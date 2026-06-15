import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Webhook Bictorys. Sécurité : le dashboard envoie le secret dans l'en-tête X-Secret-Key,
// qu'on compare au secret configuré côté serveur. On ne journalise qu'APRÈS validation
// (évite qu'un tiers injecte des données via WebhookLog).
export async function POST(req: Request) {
  const secret = process.env.BICTORYS_WEBHOOK_SECRET;
  const provided = req.headers.get('x-secret-key');
  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));

  await supabaseAdmin()
    .from('WebhookLog')
    .insert({ source: 'bictorys', payload, headers: { secretOk: true } })
    .then(
      () => {},
      () => {}
    );

  // Phase de test : on journalise uniquement pour confirmer qu'un paiement passe.
  // La réconciliation réelle (créditer l'escrow / la commande) sera branchée après validation.
  return NextResponse.json({ received: true });
}
