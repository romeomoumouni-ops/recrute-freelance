import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { euros } from '@/lib/utils';

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

  // Réconciliation : d'abord par ref (dans l'URL de checkout), sinon par email + ancienneté.
  let ref: string | null = payload?.sale?.custom_metadata?.ref ?? null;
  if (!ref && typeof payload?.checkout?.url === 'string') {
    try {
      ref = new URL(payload.checkout.url).searchParams.get('ref');
    } catch {
      /* ignore */
    }
  }

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

  // Met le devis à "payé".
  const { data: offerMsg } = await sb
    .from('Message')
    .select('meta')
    .eq('id', r.offerMessageId)
    .maybeSingle();
  let description = 'Devis';
  if (offerMsg?.meta) {
    try {
      const meta = JSON.parse(offerMsg.meta as string);
      description = meta.description || description;
      meta.status = 'paid';
      await sb.from('Message').update({ meta: JSON.stringify(meta) }).eq('id', r.offerMessageId);
    } catch {
      /* ignore */
    }
  }

  // Trace dans le tableau de bord (mission validée).
  await sb.from('Order').insert({
    clientId: r.payerId,
    freelanceId: r.freelanceId,
    titre: description,
    description: 'Devis payé par carte',
    jours: 1,
    montant: r.net,
    commission: r.commission,
    statut: 'VALIDEE',
  });

  // Message de confirmation dans la discussion.
  await sb.from('Message').insert({
    conversationId: r.conversationId,
    senderId: r.payerId,
    type: 'TEXT',
    contenu: `✅ Devis payé par carte (${euros(r.montantEur)}). Les fonds sont crédités au freelance.`,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'chariow-webhook' });
}
