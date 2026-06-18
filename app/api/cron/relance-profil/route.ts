import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmailBatch, type SendEmailInput } from '@/lib/email';
import { getAbonnementUrl } from '@/lib/abonnement';

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

// Étape attendue selon l'âge du compte (jours) et si le profil est déjà soumis.
//   1 = relance profil (J+1)   2 = relance profil (J+2)   3 = rappel abonnement (J+6, veille du blocage)
function targetStep(ageDays: number, soumis: boolean): number {
  if (ageDays >= 6) return 3; // rappel paiement pour tout le monde (essai se termine demain)
  if (!soumis && ageDays >= 2) return 2;
  if (!soumis && ageDays >= 1) return 1;
  return 0;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

function wrap(prenom: string, intro: string, ctaUrl: string, ctaLabel: string, foot: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;border:1px solid #ececea;border-radius:14px;overflow:hidden">
      <div style="background:#0d0d0d;padding:20px 24px"><span style="color:#fff;font-weight:800;font-size:17px">recrutefreelance</span></div>
      <div style="padding:24px;color:#222;font-size:14px;line-height:1.6">
        <p>Bonjour ${esc(prenom)},</p>
        <p>${intro}</p>
        <p style="margin-top:18px"><a href="${ctaUrl}" style="background:#0d0d0d;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block">${esc(ctaLabel)}</a></p>
        <p style="margin-top:16px;color:#888;font-size:12px">${foot}</p>
        <p style="margin-top:14px;color:#888;font-size:12px">— L'équipe recrutefreelance.com</p>
      </div>
    </div>`;
}

function relanceEmail(step: number, prenom: string, daysLeft: number, abonnementUrl: string): { subject: string; html: string } {
  const profilCta = `${SITE}/mon-profil`;
  if (step === 3) {
    // Rappel abonnement (J+6) : l'essai se termine demain.
    return {
      subject: '⏳ Votre essai gratuit se termine demain',
      html: wrap(
        prenom,
        "Vos <strong>7 jours d'essai gratuits</strong> se terminent <strong>demain</strong>. Pour garder l'accès à recrutefreelance.com (recevoir des missions, échanger avec les clients, apparaître dans la recherche), il vous suffit de vous abonner : <strong>20&nbsp;000 FCFA/mois</strong>, 0&nbsp;% de commission sur vos missions.",
        abonnementUrl || `${SITE}/mon-profil`,
        'M’abonner maintenant — 20 000 FCFA/mois',
        'Sans abonnement, l’accès sera mis en pause à la fin de l’essai. Vous pourrez réactiver à tout moment.'
      ),
    };
  }
  if (step === 2) {
    // 2e (et dernière) relance profil (J+2).
    return {
      subject: 'N’oubliez pas de soumettre votre profil',
      html: wrap(
        prenom,
        "Votre profil n'est pas encore soumis. Pour apparaître sur la marketplace et recevoir des missions d'entreprises européennes, pensez à <strong>compléter puis soumettre votre profil</strong> pour validation par notre équipe.",
        profilCta,
        'Compléter et soumettre mon profil',
        `Il vous reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''} d’essai gratuit.`
      ),
    };
  }
  // 1re relance profil (J+1).
  return {
    subject: 'Finalisez votre profil RecruteFreelance 🚀',
    html: wrap(
      prenom,
      "Bienvenue ! Pour commencer à recevoir des missions, il ne vous reste plus qu'à <strong>compléter et soumettre votre profil</strong> (photo, présentation, portfolio, services, Mobile Money). Une fois validé par notre équipe, il apparaît sur la marketplace.",
      profilCta,
      'Compléter et soumettre mon profil',
      "Vous profitez de 7 jours d’essai gratuits."
    ),
  };
}

// Relances pendant l'essai : J+1 et J+2 pour soumettre le profil, J+6 pour s'abonner.
async function run(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = supabaseAdmin();
  const abonnementUrl = await getAbonnementUrl();
  const cutoff7d = new Date(Date.now() - 7 * DAY).toISOString();

  // Tous les freelances encore dans leur essai (< 7 jours), non admin, non bannis.
  const { data, error } = await sb
    .from('Profile')
    .select('userId, statutValidation, relanceProfilStep, abonnementValidUntil, user:User!inner(email, prenom, createdAt, role, admin, banni)')
    .eq('user.role', 'FREELANCE')
    .eq('user.admin', false)
    .eq('user.banni', false)
    .gt('user.createdAt', cutoff7d);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = {
    userId: string;
    statutValidation: string | null;
    relanceProfilStep: number;
    abonnementValidUntil: string | null;
    user: { email: string; prenom: string; createdAt: string } | null;
  };
  const rows = ((data as unknown as Row[]) ?? []).filter((r) => r.user?.email);

  const emails: SendEmailInput[] = [];
  const toAdvance: { userId: string; step: number }[] = [];

  for (const r of rows) {
    const u = r.user!;
    // Déjà abonné (paiement en cours de validité) → aucune relance.
    if (r.abonnementValidUntil && new Date(r.abonnementValidUntil).getTime() > Date.now()) continue;

    const ageDays = (Date.now() - new Date(u.createdAt).getTime()) / DAY;
    const soumis = (r.statutValidation ?? 'NON_SOUMIS') !== 'NON_SOUMIS';
    const step = targetStep(ageDays, soumis);
    if (step <= (r.relanceProfilStep ?? 0)) continue; // déjà relancé à ce stade (ou trop tôt)

    const daysLeft = Math.max(0, Math.ceil(7 - ageDays));
    const { subject, html } = relanceEmail(step, u.prenom || '', daysLeft, abonnementUrl);
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
