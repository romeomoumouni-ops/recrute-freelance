import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { createCharge, eurToXof } from '@/lib/bictorys';

export const dynamic = 'force-dynamic';

const SITE = 'https://www.recrutefreelance.com';

// TEST : crée une charge Bictorys en sandbox. Réservé à l'admin le temps de valider.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const amountEur = Math.max(1, Math.min(50, Number(body.amountEur) || 5));
  const paymentType = typeof body.paymentType === 'string' ? body.paymentType : undefined;
  const paymentReference = `test_${randomUUID().slice(0, 8)}`;

  const r = await createCharge({
    amountXof: eurToXof(amountEur),
    paymentReference,
    merchantReference: randomUUID(),
    customer: {
      name: session.user.prenom || 'Test Admin',
      email: session.user.email,
      country: 'SN',
      locale: 'fr-FR',
    },
    redirectUrl: `${SITE}/admin/bictorys-test?ref=${paymentReference}`,
    paymentType,
  });

  // Journalise la tentative (visible sur la page de test).
  await supabaseAdmin()
    .from('WebhookLog')
    .insert({
      source: 'bictorys-charge',
      payload: { paymentReference, amountEur, paymentType: paymentType ?? 'card', ok: r.ok, error: r.error ?? null, transactionId: r.transactionId ?? null },
      headers: {},
    })
    .then(
      () => {},
      () => {}
    );

  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 });
  return NextResponse.json({ url: r.url, paymentReference, transactionId: r.transactionId });
}
