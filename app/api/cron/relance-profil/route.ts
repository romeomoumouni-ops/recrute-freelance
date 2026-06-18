import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmailBatch, type SendEmailInput } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SITE = 'https://www.recrutefreelance.com';
const DAY = 24 * 60 * 60 * 1000;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('x-cron-secret');
  const qs = new URL(req.url).searchParams.get('secret');
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return header === secret || qs === secret || bearer === secret;
}

// Étape de relance attendue selon l'âge du compte (en jours).
function targetStep(ageDays: number): number {
  if (ageDays >= 6) return 3; // J+6 : dernier jour
  if (ageDays >= 5) return 2; // J+5
  if (ageDays >= 2) return 1; // J+2
  return 0;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

function relanceEmail(step: number, prenom: string, daysLeft: number): { subject: string; html: string } {
  const cta = `${SITE}/mon-profil`;
  let subject: string;
  let intro: string;
  if (step === 3) {
    subject = '⏳ Dernier jour de votre essai gratuit RecruteFreelance';
    intro =
      "C'est le <strong>dernier jour de vos 7 jours d'essai gratuits</strong>. Pour que votre profil apparaisse sur la marketplace et que les clients puissent vous contacter, il ne vous reste plus qu'à <strong>compléter et soumettre votre profil</strong> dès aujourd'hui.";
  } else if (step === 2) {
    subject = `Il vous reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''} d'essai gratuit`;
    intro =
      `Votre essai gratuit se termine bientôt (encore <strong>${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong>). ` +
      "Profitez-en pour <strong>compléter et soumettre votre profil</strong> : c'est ce qui le rend visible des entreprises et vous permet de recevoir des missions.";
  } else {
    subject = 'Finalisez votre profil RecruteFreelance 🚀';
    intro =
      "Bienvenue ! Pour commencer à recevoir des missions d'entreprises européennes, il ne vous reste plus qu'à " +
      "<strong>compléter et soumettre votre profil</strong> (photo, présentation, portfolio, services, Mobile Money). " +
      "Une fois soumis et validé par notre équipe, votre profil apparaît sur la marketplace.";
  }
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;border:1px solid #ececea;border-radius:14px;overflow:hidden">
      <div style="background:#0d0d0d;padding:20px 24px"><span style="color:#fff;font-weight:800;font-size:17px">recrutefreelance</span></div>
      <div style="padding:24px;color:#222;font-size:14px;line-height:1.6">
        <p>Bonjour ${esc(prenom)},</p>
        <p>${intro}</p>
        <p style="margin-top:18px"><a href="${cta}" style="background:#0d0d0d;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block">Compléter et soumettre mon profil</a></p>
        <p style="margin-top:16px;color:#666;font-size:13px">Rappel : l'inscription comprend <strong>7 jours d'essai gratuits</strong>, puis 20 000 FCFA/mois, sans aucune commission sur vos missions.</p>
        <p style="margin-top:20px;color:#888;font-size:12px">— L'équipe recrutefreelance.com</p>
      </div>
    </div>`;
  return { subject, html };
}

// Relance les freelances en cours d'essai qui n'ont pas encore soumis leur profil (J+2, J+5, J+6).
async function run(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = supabaseAdmin();
  const cutoff7d = new Date(Date.now() - 7 * DAY).toISOString();

  // Freelances NON_SOUMIS, non admin, non bannis, encore dans leur essai (< 7 jours).
  const { data, error } = await sb
    .from('Profile')
    .select('userId, statutValidation, relanceProfilStep, user:User!inner(email, prenom, createdAt, role, admin, banni)')
    .eq('statutValidation', 'NON_SOUMIS')
    .eq('user.role', 'FREELANCE')
    .eq('user.admin', false)
    .eq('user.banni', false)
    .gt('user.createdAt', cutoff7d);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = {
    userId: string;
    relanceProfilStep: number;
    user: { email: string; prenom: string; createdAt: string } | null;
  };
  const rows = ((data as unknown as Row[]) ?? []).filter((r) => r.user?.email);

  const emails: SendEmailInput[] = [];
  const toAdvance: { userId: string; step: number }[] = [];

  for (const r of rows) {
    const u = r.user!;
    const ageDays = (Date.now() - new Date(u.createdAt).getTime()) / DAY;
    const step = targetStep(ageDays);
    if (step <= (r.relanceProfilStep ?? 0)) continue; // déjà relancé à ce stade (ou trop tôt)
    const daysLeft = Math.max(0, Math.ceil(7 - ageDays));
    const { subject, html } = relanceEmail(step, u.prenom || '', daysLeft);
    emails.push({ to: u.email, subject, html });
    toAdvance.push({ userId: r.userId, step });
  }

  if (emails.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const res = await sendEmailBatch(emails);

  // On n'avance le compteur que pour les e-mails effectivement partis (sinon, on retentera demain).
  if (res.sent > 0) {
    for (const a of toAdvance) {
      await sb.from('Profile').update({ relanceProfilStep: a.step }).eq('userId', a.userId);
    }
  }

  return NextResponse.json({ ok: true, candidates: rows.length, queued: emails.length, sent: res.sent, failed: res.failed, error: res.error });
}

export async function POST(req: Request) {
  return run(req);
}
export async function GET(req: Request) {
  return run(req);
}
