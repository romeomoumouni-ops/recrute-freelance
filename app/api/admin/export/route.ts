import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.join(',');
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n');
  return `${head}\n${body}`;
}

// Admin : export CSV (orders | payments | withdrawals).
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const type = new URL(req.url).searchParams.get('type') ?? 'orders';
  const sb = supabaseAdmin();
  let rows: Record<string, unknown>[] = [];

  if (type === 'orders') {
    const { data } = await sb.from('Order').select('id, titre, montant, commission, statut, clientId, freelanceId, createdAt').order('createdAt', { ascending: false }).limit(5000);
    rows = (data as Record<string, unknown>[]) ?? [];
  } else if (type === 'payments') {
    const { data } = await sb.from('DevisPayment').select('id, montantEur, montantFcfa, status, productId, payerEmail, paidAt, createdAt').order('createdAt', { ascending: false }).limit(5000);
    rows = (data as Record<string, unknown>[]) ?? [];
  } else if (type === 'withdrawals') {
    const { data } = await sb.from('Withdrawal').select('id, freelanceId, montant, operateur, numero, statut, createdAt').order('createdAt', { ascending: false }).limit(5000);
    rows = (data as Record<string, unknown>[]) ?? [];
  } else {
    return NextResponse.json({ error: 'Type invalide.' }, { status: 400 });
  }

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}.csv"`,
    },
  });
}
