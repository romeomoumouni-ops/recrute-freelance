import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Réception des webhooks Chariow (Pulses). Phase 1 : on enregistre le contenu brut
// pour connaître le format exact, avant de coder la réconciliation paiement -> devis.
export async function POST(req: Request) {
  let payload: unknown = null;
  const raw = await req.text();
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = { _raw: raw };
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k] = v;
  });

  try {
    await supabaseAdmin().from('WebhookLog').insert({ source: 'chariow', headers, payload });
  } catch {
    /* on ne bloque jamais l'accusé de réception */
  }

  // On répond 200 pour que Chariow considère le webhook comme livré.
  return NextResponse.json({ received: true });
}

// Certains services testent l'URL en GET.
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'chariow-webhook' });
}
