import { NextResponse } from 'next/server';
import type { EmailOtpType, User } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

// Onboarding d'un nouvel inscrit via Google : applique le rôle choisi, crée le profil
// freelance si besoin, et envoie notre e-mail de bienvenue (une seule fois).
// On reçoit `user` directement du résultat de l'échange (la session n'est pas encore
// lisible via getUser() dans la même requête).
async function onboardOAuthUser(origin: string, newrole: string | null, user: User | null) {
  try {
    if (!user) return;

    const createdMs = user.created_at ? Date.now() - new Date(user.created_at).getTime() : Infinity;
    const isNew = createdMs < 10 * 60 * 1000; // inscrit il y a moins de 10 min

    const sb = supabaseAdmin();
    const { data: row } = await sb
      .from('User')
      .select('prenom, role, welcomeEmailedAt')
      .eq('id', user.id)
      .maybeSingle();
    const u = row as { prenom: string | null; role: string; welcomeEmailedAt: string | null } | null;
    if (!u || u.welcomeEmailedAt) return; // déjà onboardé (e-mail déjà envoyé)

    // Attribuer le rôle choisi UNIQUEMENT lors d'une nouvelle inscription
    // (on ne change jamais le rôle d'un compte existant).
    const chosen = newrole === 'FREELANCE' ? 'FREELANCE' : 'CLIENT';
    if (isNew && chosen === 'FREELANCE' && u.role !== 'FREELANCE') {
      await sb.from('User').update({ role: 'FREELANCE' }).eq('id', user.id);
      const { data: prof } = await sb.from('Profile').select('id').eq('userId', user.id).maybeSingle();
      if (!prof) await sb.from('Profile').insert({ userId: user.id, skills: '[]' });
    }

    // Rôle effectif après attribution éventuelle (pour le bon contenu d'e-mail).
    const effectiveRole = isNew ? chosen : u.role;
    const prenom = u.prenom ?? user.email?.split('@')[0] ?? '';
    const isFreelance = effectiveRole === 'FREELANCE';
    const titre = isFreelance
      ? 'Bienvenue ! Votre compte freelance est créé 🎉'
      : 'Bienvenue ! Votre compte entreprise est créé 🎉';
    const corps = isFreelance
      ? 'Complétez votre profil (photo, présentation, portfolio, services, Mobile Money) pour être validé et apparaître auprès des clients.'
      : 'Vous pouvez dès maintenant rechercher des freelances et leur confier vos projets, en toute sécurité.';
    const ctaLabel = isFreelance ? 'Compléter mon profil' : 'Trouver un freelance';
    const ctaUrl = isFreelance ? `${origin}/mon-profil` : `${origin}/recherche`;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;border:1px solid #ececea;border-radius:14px;overflow:hidden">
      <div style="background:#0d0d0d;padding:20px 24px"><span style="color:#fff;font-weight:800;font-size:17px">recrutefreelance</span></div>
      <div style="padding:24px;color:#222;font-size:14px;line-height:1.6">
        <p>Bonjour ${esc(prenom)},</p>
        <p style="font-weight:600;color:#0d0d0d">${esc(titre)}</p>
        <p>${esc(corps)}</p>
        <p style="margin-top:18px"><a href="${ctaUrl}" style="background:#0d0d0d;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block">${esc(ctaLabel)}</a></p>
        <p style="margin-top:20px;color:#888;font-size:12px">— L'équipe recrutefreelance.com</p>
      </div>
    </div>`;
    if (user.email) {
      const sent = await sendEmail({ to: user.email, subject: titre, html });
      if (sent) await sb.from('User').update({ welcomeEmailedAt: new Date().toISOString() }).eq('id', user.id);
    }
  } catch {
    /* l'onboarding ne doit jamais bloquer la connexion */
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
  let oauthUser: User | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    oauthUser = data?.user ?? null;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
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
  // (`next` est un chemin interne fourni par le bouton Google, ex. /dashboard.)
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    await onboardOAuthUser(origin, searchParams.get('newrole'), oauthUser);
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Confirmation d'inscription : l'e-mail est validé → on déconnecte pour que la personne
  // se connecte explicitement avec ses identifiants, puis page de confirmation dédiée.
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/inscription-confirmee`);
}
