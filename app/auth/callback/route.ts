import { NextResponse } from 'next/server';
import type { EmailOtpType, User } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { isAfricanCountry, requestCountry } from '@/lib/geo';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const BAN_ENTREPRISE_AFRIQUE =
  'Les comptes entreprise situés en Afrique ne sont pas autorisés sur la plateforme.';

// Auto-ban : une entreprise (CLIENT) qui se connecte depuis l'Afrique est bannie.
// Renvoie true si le compte a été (ou est déjà) banni pour cette raison.
async function banIfAfricanEntreprise(request: Request, userId: string | undefined): Promise<boolean> {
  try {
    if (!userId) return false;
    if (!isAfricanCountry(requestCountry(request))) return false;
    const sb = supabaseAdmin();
    const { data: row } = await sb.from('User').select('role, admin, banni').eq('id', userId).maybeSingle();
    const u = row as { role: string; admin: boolean | null; banni: boolean | null } | null;
    if (!u || u.admin === true || u.role !== 'CLIENT') return false; // on ne touche ni aux admins ni aux freelances
    if (!u.banni) await sb.from('User').update({ banni: true }).eq('id', userId);
    return true;
  } catch {
    return false; // ne jamais casser le flux d'auth
  }
}

// Envoie NOTRE e-mail de bienvenue (adapté au rôle), une seule fois par compte.
// Lit le rôle réel dans public.User (source de vérité).
async function sendWelcomeOnce(origin: string, user: User | null) {
  try {
    if (!user || !user.email) return;
    const sb = supabaseAdmin();
    const { data: row } = await sb
      .from('User')
      .select('prenom, role, welcomeEmailedAt')
      .eq('id', user.id)
      .maybeSingle();
    const u = row as { prenom: string | null; role: string; welcomeEmailedAt: string | null } | null;
    if (!u || u.welcomeEmailedAt) return; // déjà envoyé

    const prenom = u.prenom ?? user.email.split('@')[0] ?? '';
    const isFreelance = u.role === 'FREELANCE';
    const titre = isFreelance
      ? 'Bienvenue sur RecruteFreelance 🎉'
      : 'Bienvenue ! Votre compte entreprise est créé 🎉';
    const corps = isFreelance
      ? 'Votre inscription est confirmée et vous profitez de <strong>7 jours d’essai gratuits</strong> (puis 20 000 FCFA/mois, 0 % de commission sur vos missions). Il ne vous reste plus qu’à <strong>terminer le remplissage de votre profil et à le soumettre</strong>, afin qu’il apparaisse sur la marketplace et que les clients puissent vous contacter.'
      : 'Votre inscription est confirmée. Vous pouvez dès maintenant rechercher des freelances et leur confier vos projets, en toute sécurité.';
    const ctaLabel = isFreelance ? 'Compléter et soumettre mon profil' : 'Trouver un freelance';
    const ctaUrl = isFreelance ? `${origin}/mon-profil` : `${origin}/recherche`;

    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;border:1px solid #ececea;border-radius:14px;overflow:hidden">
      <div style="background:#0d0d0d;padding:20px 24px"><span style="color:#fff;font-weight:800;font-size:17px">recrutefreelance</span></div>
      <div style="padding:24px;color:#222;font-size:14px;line-height:1.6">
        <p>Bonjour ${esc(prenom)},</p>
        <p style="font-weight:600;color:#0d0d0d">${esc(titre)}</p>
        <p>${corps}</p>
        <p style="margin-top:18px"><a href="${ctaUrl}" style="background:#0d0d0d;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block">${esc(ctaLabel)}</a></p>
        <p style="margin-top:20px;color:#888;font-size:12px">— L'équipe recrutefreelance.com</p>
      </div>
    </div>`;

    const sent = await sendEmail({ to: user.email, subject: titre, html });
    if (sent) await sb.from('User').update({ welcomeEmailedAt: new Date().toISOString() }).eq('id', user.id);
  } catch {
    /* ne jamais bloquer le flux */
  }
}

// Onboarding Google : applique le rôle choisi (nouvelle inscription), crée le profil
// freelance si besoin, puis envoie l'e-mail de bienvenue. (Pas d'e-mail sur une simple connexion.)
async function onboardOAuthUser(origin: string, newrole: string | null, user: User | null) {
  try {
    if (!user) return;
    const createdMs = user.created_at ? Date.now() - new Date(user.created_at).getTime() : Infinity;
    const isNew = createdMs < 10 * 60 * 1000; // inscription récente
    if (!isNew) return; // connexion : rien à faire

    const sb = supabaseAdmin();
    const { data: row } = await sb.from('User').select('role, welcomeEmailedAt').eq('id', user.id).maybeSingle();
    const u = row as { role: string; welcomeEmailedAt: string | null } | null;
    if (!u || u.welcomeEmailedAt) return;

    const chosen = newrole === 'FREELANCE' ? 'FREELANCE' : 'CLIENT';
    if (chosen === 'FREELANCE' && u.role !== 'FREELANCE') {
      await sb.from('User').update({ role: 'FREELANCE' }).eq('id', user.id);
      const { data: prof } = await sb.from('Profile').select('id').eq('userId', user.id).maybeSingle();
      if (!prof) await sb.from('Profile').insert({ userId: user.id, skills: '[]' });
    }

    await sendWelcomeOnce(origin, user); // lit le rôle (mis à jour) et envoie l'e-mail
  } catch {
    /* ne jamais bloquer la connexion */
  }
}

// Cible des liens d'e-mail (confirmation d'inscription + réinitialisation de mot de passe).
// Gère les deux formats possibles de Supabase : ?code=... (PKCE) ou ?token_hash=...&type=...
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') || '';
  const isReset = next.includes('reset') || type === 'recovery';

  const supabase = createServerSupabase();
  let ok = false;
  let authedUser: User | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    authedUser = data?.user ?? null;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
    authedUser = data?.user ?? null;
  }

  if (!ok) {
    return NextResponse.redirect(
      `${origin}/connexion?toast=${encodeURIComponent(
        'Lien invalide ou expiré. Réessayez ou demandez un nouveau lien.'
      )}`
    );
  }

  // Réinitialisation : on garde la session de récupération pour choisir le nouveau mot de passe.
  if (isReset) {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // Connexion OAuth (Google) : on GARDE la session et on redirige vers l'app.
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    // onboardOAuthUser applique d'abord le rôle choisi (le ban se base sur le rôle réel).
    await onboardOAuthUser(origin, searchParams.get('newrole'), authedUser);
    if (await banIfAfricanEntreprise(request, authedUser?.id)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/connexion?toast=${encodeURIComponent(BAN_ENTREPRISE_AFRIQUE)}`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Confirmation d'inscription par e-mail. Entreprise en Afrique → bannie, on bloque.
  if (await banIfAfricanEntreprise(request, authedUser?.id)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/connexion?toast=${encodeURIComponent(BAN_ENTREPRISE_AFRIQUE)}`);
  }
  // Sinon : on envoie NOTRE e-mail de bienvenue puis on déconnecte
  // (rappel de compléter + soumettre le profil pour les freelances).
  await sendWelcomeOnce(origin, authedUser);
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/inscription-confirmee`);
}
