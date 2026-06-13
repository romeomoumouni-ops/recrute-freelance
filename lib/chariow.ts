import 'server-only';
import { TAUX_FCFA } from './constants';

// Chariow facture en FCFA (XOF), minimum 5 000 FCFA.
export const CHARIOW_MIN_FCFA = 5000;
export const CHARIOW_MIN_EUR = Math.ceil(CHARIOW_MIN_FCFA / TAUX_FCFA); // ~8 €

export function eurToFcfa(eur: number): number {
  return Math.round(eur * TAUX_FCFA);
}

// Construit l'URL de paiement Chariow en pré-remplissant l'email du payeur
// (qui nous sert de clé de réconciliation dans le webhook).
export function buildChariowCheckoutUrl(opts: {
  email: string;
  prenom: string;
  montantFcfa: number;
  ref: string;
}): string {
  const base = process.env.CHARIOW_CHECKOUT_URL;
  if (!base) throw new Error('CHARIOW_CHECKOUT_URL manquant');
  const u = new URL(base);
  u.searchParams.set('email', opts.email);
  u.searchParams.set('first_name', opts.prenom);
  // Best-effort : Chariow peut pré-remplir / renvoyer ces champs.
  u.searchParams.set('amount', String(opts.montantFcfa));
  u.searchParams.set('ref', opts.ref);
  return u.toString();
}
