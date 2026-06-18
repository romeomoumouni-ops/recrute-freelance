import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { euros, dateCourte } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';
import { ABONNEMENT_MOIS_MS } from '@/lib/abonnement';

export const dynamic = 'force-dynamic';

// Produit Chariow correspondant à l'abonnement freelance (20 000 FCFA/mois).
// Lien de paiement : https://bajiuulm.mychariow.shop/prd_vkvdqask/checkout
const ABONNEMENT_PRODUCT_ID = 'prd_vkvdqask';

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

  // Sécurité : on ne TRAITE que si le secret est bon (mais on répond 200 pour éviter les retries).
  // On ne journalise QUE les requêtes authentifiées (sinon n'importe qui pourrait
  // injecter du JSON / des données perso dans WebhookLog sans connaître le secret).
  if (!secretOk) return NextResponse.json({ received: true });

  const sb = supabaseAdmin();
  try {
    await sb.from('WebhookLog').insert({ source: 'chariow', payload, headers: { secretOk: true } });
  } catch {
    /* ignore */
  }

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

  // Abonnement freelance ? On regarde tous les champs identifiant le produit + l'URL de checkout.
  const idBlob = JSON.stringify({
    product: payload?.product,
    productId: payload?.sale?.product_id,
    url: payload?.checkout?.url,
    link: payload?.sale?.product_link,
  }).toLowerCase();
  if (idBlob.includes(ABONNEMENT_PRODUCT_ID)) {
    await handleAbonnement(sb, saleId, email, payload);
    return;
  }

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
  // NB : on NE rattache PAS par e-mail seul. Sans productId/ref concordant, le
  // paiement reste « non rattaché » et part en réconciliation manuelle (WebhookLog).
  // Cela empêche qu'une vente d'un palier règle par erreur un paiement d'un autre
  // montant (le productId garantit que le palier/montant correspond).
  if (!pendingId) return;

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

  // Notifie les administrateurs qu'une nouvelle commande a été passée sur le site.
  const { data: freelanceUser } = await sb
    .from('User')
    .select('prenom')
    .eq('id', r.freelanceId)
    .maybeSingle();
  const freelancePrenom = (freelanceUser as { prenom: string } | null)?.prenom ?? 'un freelance';
  const { data: admins } = await sb.from('User').select('id').eq('admin', true);
  for (const a of (admins as { id: string }[]) ?? []) {
    await createNotification({
      userId: a.id,
      type: 'PAIEMENT',
      titre: '🛒 Nouvelle commande',
      corps: `${payerPrenom} a payé « ${description} » à ${freelancePrenom} (${euros(r.montantEur)}). Fonds en séquestre.`,
      lien: '/admin/litiges',
    });
  }
}

// Paiement de l'abonnement freelance : prolonge l'accès de 30 jours.
// À l'issue de ces 30 jours, le compte se bloque à nouveau automatiquement
// (computeAbonnement renvoie « expired » dès que abonnementValidUntil est dépassé).
async function handleAbonnement(sb: ReturnType<typeof supabaseAdmin>, saleId: string, email: string, payload: any) {
  // Idempotence : cette vente d'abonnement a-t-elle déjà été créditée ?
  const { data: already } = await sb
    .from('AbonnementPayment')
    .select('id')
    .eq('saleId', saleId)
    .maybeSingle();
  if (already) return;

  if (!email) return; // sans e-mail, on ne peut pas rattacher → réconciliation manuelle (WebhookLog)

  // On rattache le paiement au freelance par son e-mail de compte.
  const { data: u } = await sb
    .from('User')
    .select('id, prenom, role')
    .ilike('email', email)
    .maybeSingle();
  const user = u as { id: string; prenom: string; role: string } | null;
  if (!user || user.role !== 'FREELANCE') return; // e-mail inconnu / non-freelance → réactivation manuelle

  // +30 jours à partir de la fin d'abonnement en cours (ou de maintenant si déjà expiré).
  const { data: prof } = await sb
    .from('Profile')
    .select('abonnementValidUntil')
    .eq('userId', user.id)
    .maybeSingle();
  const current = (prof as { abonnementValidUntil: string | null } | null)?.abonnementValidUntil;
  const base = current && new Date(current).getTime() > Date.now() ? new Date(current).getTime() : Date.now();
  const next = new Date(base + ABONNEMENT_MOIS_MS).toISOString();

  await sb.from('Profile').update({ abonnementValidUntil: next }).eq('userId', user.id);
  await sb.from('AbonnementPayment').insert({ userId: user.id, saleId, email, validUntil: next });

  // Notifie le freelance que son accès est réactivé.
  await createNotification({
    userId: user.id,
    type: 'PAIEMENT',
    titre: '✅ Abonnement activé',
    corps: `Votre abonnement est actif jusqu'au ${dateCourte(next)}. Merci ! Vous profitez à nouveau de tout recrutefreelance.com.`,
    lien: '/dashboard',
  });

  // Notifie les administrateurs.
  const { data: admins } = await sb.from('User').select('id').eq('admin', true);
  for (const a of (admins as { id: string }[]) ?? []) {
    await createNotification({
      userId: a.id,
      type: 'PAIEMENT',
      titre: "💳 Abonnement payé",
      corps: `${user.prenom} a payé son abonnement (20 000 FCFA). Accès prolongé jusqu'au ${dateCourte(next)}.`,
      lien: `/admin/utilisateurs/${user.id}`,
    });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'chariow-webhook' });
}
