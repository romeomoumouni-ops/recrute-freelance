import { NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase';
import { getSetting } from './settings';

// Essai gratuit de 7 jours après l'inscription, puis abonnement payant.
export const TRIAL_DAYS = 7;
export const ABONNEMENT_FCFA = 20000;
export const ABONNEMENT_MOIS_MS = 30 * 24 * 60 * 60 * 1000;

export type AbonnementMode = 'trial' | 'paid' | 'expired';

export interface AbonnementStatus {
  active: boolean; // le freelance peut utiliser le site
  mode: AbonnementMode;
  trialEndsAt: string; // ISO — fin des 7 jours d'essai
  validUntil: string | null; // ISO — fin de l'abonnement payé (si payé)
  daysLeft: number; // jours restants avant blocage (0 si expiré)
}

// Calcule l'état d'abonnement à partir de la date d'inscription et de la date de fin d'abonnement payé.
export function computeAbonnement(createdAt: string, validUntil: string | null): AbonnementStatus {
  const now = Date.now();
  const trialEnd = new Date(createdAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const paidUntil = validUntil ? new Date(validUntil).getTime() : 0;
  const effectiveEnd = Math.max(trialEnd, paidUntil);
  const active = now < effectiveEnd;
  const mode: AbonnementMode = !active ? 'expired' : paidUntil > now ? 'paid' : 'trial';
  const daysLeft = active ? Math.ceil((effectiveEnd - now) / (24 * 60 * 60 * 1000)) : 0;
  return {
    active,
    mode,
    trialEndsAt: new Date(trialEnd).toISOString(),
    validUntil,
    daysLeft,
  };
}

// État d'abonnement d'un freelance (null si l'utilisateur n'est pas un freelance).
export async function getFreelanceAbonnement(userId: string): Promise<AbonnementStatus | null> {
  const sb = supabaseAdmin();
  const { data: u } = await sb.from('User').select('createdAt, role').eq('id', userId).maybeSingle();
  const user = u as { createdAt: string; role: string } | null;
  if (!user || user.role !== 'FREELANCE') return null;
  const { data: p } = await sb.from('Profile').select('abonnementValidUntil').eq('userId', userId).maybeSingle();
  const validUntil = (p as { abonnementValidUntil: string | null } | null)?.abonnementValidUntil ?? null;
  return computeAbonnement(user.createdAt, validUntil);
}

// Le lien de paiement de l'abonnement (Chariow), configurable depuis l'espace admin.
export async function getAbonnementUrl(): Promise<string> {
  return (await getSetting('abonnement_url')) || '';
}

interface SessionLike {
  user: { id: string; role: string; admin?: boolean };
}

// Garde-fou serveur : renvoie une réponse 402 si un freelance dont l'essai/abonnement
// a expiré tente une action. Renvoie null si l'action est autorisée.
export async function blockIfFreelanceExpired(session: SessionLike | null): Promise<NextResponse | null> {
  if (!session || session.user.role !== 'FREELANCE' || session.user.admin) return null;
  const st = await getFreelanceAbonnement(session.user.id);
  if (st && !st.active) {
    return NextResponse.json(
      { error: 'Votre essai gratuit de 7 jours est terminé. Abonnez-vous (20 000 FCFA/mois) pour continuer.', abonnementExpired: true },
      { status: 402 }
    );
  }
  return null;
}
