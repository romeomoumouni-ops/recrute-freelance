import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { creditAbonnement } from '@/lib/chariow-abonnement';

export const dynamic = 'force-dynamic';

// Endpoint dédié aux paiements de l'ABONNEMENT freelance (Pulse Chariow).
// Réutilise le même secret que le webhook des devis (CHARIOW_WEBHOOK_SECRET).
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

  // On répond 200 même si le secret est faux (évite les retries), mais on ne TRAITE
  // et ne journalise QUE les requêtes authentifiées.
  if (!secretOk) return NextResponse.json({ received: true });

  const sb = supabaseAdmin();
  try {
    await sb.from('WebhookLog').insert({ source: 'chariow-abonnement', payload, headers: { secretOk: true } });
  } catch {
    /* ignore */
  }

  if (payload?.event === 'successful.sale' && payload?.sale?.id) {
    try {
      await creditAbonnement(payload.sale.id, payload.customer?.email ?? '', payload);
    } catch {
      /* déjà loggé ; pas d'erreur renvoyée pour éviter les retries en boucle */
    }
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'chariow-abonnement-webhook' });
}
