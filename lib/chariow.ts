import 'server-only';
import { TAUX_FCFA } from './constants';

export function eurToFcfa(eur: number): number {
  return Math.round(eur * TAUX_FCFA);
}

// Construit l'URL de paiement d'un produit Chariow à prix fixe, en pré-remplissant
// l'email du payeur + une référence (réconciliation dans le webhook).
export function buildTierCheckoutUrl(opts: {
  checkoutUrl: string;
  email: string;
  prenom: string;
  ref: string;
  redirectUrl?: string;
}): string {
  const u = new URL(opts.checkoutUrl);
  u.searchParams.set('email', opts.email);
  u.searchParams.set('first_name', opts.prenom);
  u.searchParams.set('ref', opts.ref);
  // Retour automatique vers la discussion après paiement (best-effort).
  if (opts.redirectUrl) u.searchParams.set('redirect_url', opts.redirectUrl);
  return u.toString();
}
