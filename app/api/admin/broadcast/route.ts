import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { logAdminAction } from '@/lib/admin-log';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const schema = z.object({
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(2).max(5000),
  audience: z.enum(['all', 'CLIENT', 'FREELANCE']),
});

// Admin : envoie un e-mail à tous les utilisateurs (ou un segment) via Resend.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Données invalides.' }, { status: 400 });
  }
  const { subject, message, audience } = parsed.data;

  let query = supabaseAdmin().from('User').select('email, prenom').eq('banni', false).limit(2000);
  if (audience !== 'all') query = query.eq('role', audience);
  const { data: users } = await query;
  const list = (users as { email: string; prenom: string }[] ?? []).filter((u) => u.email);

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const corps = esc(message).replace(/\n/g, '<br>');
  const html = (prenom: string) =>
    `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto">
      <div style="background:#0d0d0d;padding:18px 24px"><span style="color:#fff;font-weight:700;font-size:17px">RecruteFreelance</span></div>
      <div style="padding:24px;color:#222;font-size:14px;line-height:1.6">
        <p>Bonjour ${esc(prenom || '')},</p>
        <p>${corps}</p>
        <p style="margin-top:20px;color:#888;font-size:12px">— L'équipe recrutefreelance.com</p>
      </div>
    </div>`;

  let sent = 0;
  for (const u of list) {
    const ok = await sendEmail({ to: u.email, subject, html: html(u.prenom) });
    if (ok) sent++;
  }

  await logAdminAction(session, `Communication envoyée (${audience})`, `${sent}/${list.length} e-mails · « ${subject} »`);
  return NextResponse.json({ ok: true, sent, total: list.length });
}
