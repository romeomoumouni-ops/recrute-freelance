import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { euros } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// Réception des webhooks Chariow (Pulses) : confirme les paiements de devis.
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secretOk = searchParams.get('secret') === process.env.CHARIOW_WEBHOOK_SECRET;

  const raw = await req.text();
  let payload: any = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = { _raw: raw };
  }

  const sb = supabaseAdmin();
  // On garde une trace (utile pour le debug / la réconciliation manuelle).
  try {
    await sb.from('WebhookLog').insert({ source: 'chariow', payload, headers: { secretOk } });
  } catch {
    /* ignore */
  }

  // Sécurité : on ne TRAITE que si le secret est bon (mais on répond 200 pour éviter les retries).
  if (!secretOk) return NextResponse.json({ received: true });

  if (payload?.event === 'successful.sale' && payload?.sale?.id) {
    try {
      await handleSale(payload);
    } catch {
      /* on a déjà loggé ; on ne renvoie pas d'erreur pour éviter les retries en boucle */
    }
  }

  return NextResponse.json({ received: true });
}

async function handleSale(payload: any) {
  const sb = supabaseAdmin();
  const saleId: string = payload.sale.id;
  const email: string = (payload.customer?.email ?? '').toLowerCase().trim();

  // Idempotence : vente déjà traitée ?
  const { data: already } = await sb
    .from('DevisPayment')
    .select('id')
    .eq('saleId', saleId)
    .maybeSingle();
  if (already) return;

  // Réconciliation, par ordre de fiabilité décroissante.
  // 1) ref (notre id de paiement, passé dans l'URL de checkout / metadata)
  let ref: string | null = payload?.sale?.custom_metadata?.ref ?? null;
  if (!ref && typeof payload?.checkout?.url === 'string') {
    try {
      ref = new URL(payload.checkout.url).searchParams.get('ref');
    } catch {
      /* ignore */
    }
  }
  // 2) productId : produit Chariow à prix fixe acheté (palier connu)
  const productId: string | null =
    payload?.product?.id ??
    payload?.product?.public_id ??
    payload?.sale?.product_id ??
    payload?.product?.product_id ??
    null;

  let pendingId: string | null = null;
  if (ref) {
    const { data } = await sb
      .from('DevisPayment')
      .select('id')
      .eq('id', ref)
      .eq('status', 'awaiting')
      .maybeSingle();
    if (data) pendingId = (data as { id: string }).id;
  }
  // productId + email : très fiable (palier fixe + bon payeur)
  if (!pendingId && productId && email) {
    const { data } = await sb
      .from('DevisPayment')
      .select('id')
      .eq('productId', productId)
      .eq('payerEmail', email)
      .eq('status', 'awaiting')
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) pendingId = (data as { id: string }).id;
  }
  // productId seul (à défaut d'email exploitable)
  if (!pendingId && productId) {
    const { data } = await sb
      .from('DevisPayment')
      .select('id')
      .eq('productId', productId)
      .eq('status', 'awaiting')
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) pendingId = (data as { id: string }).id;
  }
  // email seul (dernier recours)
  if (!pendingId && email) {
    const { data } = await sb
      .from('DevisPayment')
      .select('id')
      .eq('payerEmail', email)
      .eq('status', 'awaiting')
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) pendingId = (data as { id: string }).id;
  }
  if (!pendingId) return; // paiement non rattaché — visible dans WebhookLog pour réconciliation manuelle

  // Règlement atomique (marque payé + crédite le freelance).
  const { data: settled } = await sb.rpc('settle_devis_payment', {
    p_pending_id: pendingId,
    p_sale_id: saleId,
  });
  const r = Array.isArray(settled) ? settled[0] : settled;
  if (!r) return; // déjà réglé

  // Récupère la description du devis (pour le titre de la commande).
  const { data: offerMsg } = await sb
    .from('Message')
    .select('meta')
    .eq('id', r.offerMessageId)
    .maybeSingle();
  let description = 'Devis';
  let meta: Record<string, unknown> = {};
  if (offerMsg?.meta) {
    try {
      meta = JSON.parse(offerMsg.meta as string);
      description = (meta.description as string) || description;
    } catch {
      /* ignore */
    }
  }

  // Crée la commande en SÉQUESTRE : statut EN_COURS, fonds non encore versés.
  // Ils seront libérés vers le solde du freelance quand le client validera.
  const { data: order } = await sb
    .from('Order')
    .insert({
      clientId: r.payerId,
      freelanceId: r.freelanceId,
      titre: description,
      description: 'Commande payée par carte',
      jours: 1,
      montant: r.net,
      commission: r.commission,
      statut: 'EN_COURS',
    })
    .select('id')
    .single();

  // Le devis devient une commande "payée / en cours" : on garde le suivi dans le chat.
  meta.status = 'paid';
  if (order) meta.orderId = (order as { id: string }).id;
  await sb.from('Message').update({ meta: JSON.stringify(meta) }).eq('id', r.offerMessageId);

  // Message automatique (centré, gris) qui explique le séquestre.
  await sb.from('Message').insert({
    conversationId: r.conversationId,
    senderId: r.payerId,
    type: 'SYSTEM',
    contenu:
      `✅ Paiement reçu (${euros(r.montantEur)}). Les fonds sont sécurisés par ` +
      `recrutefreelance.com et seront versés au freelance une fois la commande livrée et validée par vos soins.`,
  });

  // Notifie le freelance qu'un paiement a été reçu.
  const { data: payer } = await sb.from('User').select('prenom').eq('id', r.payerId).maybeSingle();
  const payerPrenom = (payer as { prenom: string } | null)?.prenom ?? 'Un client';
  await createNotification({
    userId: r.freelanceId,
    type: 'PAIEMENT',
    titre: '💳 Paiement reçu',
    corps: `${payerPrenom} a payé votre commande « ${description} » (${euros(r.montantEur)}). Livrez-la pour débloquer les fonds.`,
    lien: `/messages?c=${r.conversationId}`,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'chariow-webhook' });
}
