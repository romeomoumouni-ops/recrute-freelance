import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmailBatch } from '@/lib/email';
import { logAdminAction } from '@/lib/admin-log';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const schema = z.object({
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(2).max(5000),
  audience: z.enum(['all', 'CLIENT', 'FREELANCE']),
  test: z.boolean().optional(), // envoi de test à l'admin uniquement
});

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildHtml(prenom: string, message: string): string {
  const corps = esc(message).replace(/\n/g, '<br>');
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto">
      <div style="background:#0d0d0d;padding:18px 24px"><span style="color:#fff;font-weight:700;font-size:17px">RecruteFreelance</span></div>
      <div style="padding:24px;color:#222;font-size:14px;line-height:1.6">
        <p>Bonjour ${esc(prenom || '')},</p>
        <p>${corps}</p>
        <p style="margin-top:20px;color:#888;font-size:12px">— L'équipe recrutefreelance.com</p>
      </div>
    </div>`;
}

// Admin : envoie un e-mail à tous les utilisateurs (ou un segment) via Resend.
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Accès refusé.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }
  const { subject, message, audience, test } = parsed.data;

  // ----- Mode test : un seul e-mail, vers l'admin connecté -----
  if (test) {
    const r = await sendEmailBatch([
      { to: session.user.email, subject: `[TEST] ${subject}`, html: buildHtml(session.user.prenom, message) },
    ]);
    if (r.sent === 0) {
      return NextResponse.json(
        { error: r.error ?? 'Échec de l’envoi du test.' },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, test: true, sent: 1, total: 1, to: session.user.email });
  }

  // ----- Envoi réel -----
  let query = supabaseAdmin().from('User').select('email, prenom').eq('banni', false).limit(5000);
  if (audience !== 'all') query = query.eq('role', audience);
  const { data: users, error: dbError } = await query;
  if (dbError) {
    return NextResponse.json({ error: 'Lecture des destinataires impossible.' }, { status: 500 });
  }
  const list = ((users as { email: string; prenom: string }[]) ?? []).filter((u) => u.email);

  if (list.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, total: 0, note: 'Aucun destinataire.' });
  }

  const emails = list.map((u) => ({
    to: u.email,
    subject,
    html: buildHtml(u.prenom, message),
  }));

  const r = await sendEmailBatch(emails);

  await logAdminAction(
    session,
    `Communication envoyée (${audience})`,
    `${r.sent}/${list.length} e-mails · « ${subject} »${r.error ? ` · erreur : ${r.error}` : ''}`
  );

  // Échec total : on remonte une vraie erreur au lieu d'un faux succès.
  if (r.sent === 0) {
    return NextResponse.json(
      { error: r.error ?? 'Aucun e-mail n’a pu être envoyé.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, sent: r.sent, failed: r.failed, total: list.length, error: r.error });
}
