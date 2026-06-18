import { supabaseAdmin } from './supabase';
import { dateCourte } from './utils';
import { createNotification } from './notifications';
import { ABONNEMENT_MOIS_MS } from './abonnement';

// Produit Chariow correspondant à l'abonnement freelance (20 000 FCFA/mois).
// Lien de paiement : https://bajiuulm.mychariow.shop/prd_vkvdqask/checkout
export const ABONNEMENT_PRODUCT_ID = 'prd_vkvdqask';

// La vente Chariow concerne-t-elle l'abonnement freelance ?
// On regarde tous les champs identifiant le produit + l'URL de checkout.
export function isAbonnementSale(payload: any): boolean {
  const idBlob = JSON.stringify({
    product: payload?.product,
    productId: payload?.sale?.product_id,
    url: payload?.checkout?.url,
    link: payload?.sale?.product_link,
  }).toLowerCase();
  return idBlob.includes(ABONNEMENT_PRODUCT_ID);
}

// Paiement de l'abonnement freelance : prolonge l'accès de 30 jours.
// À l'issue de ces 30 jours, le compte se bloque à nouveau automatiquement
// (computeAbonnement renvoie « expired » dès que abonnementValidUntil est dépassé).
export async function creditAbonnement(saleId: string, emailRaw: string, payload: any): Promise<void> {
  const sb = supabaseAdmin();
  const email = (emailRaw ?? '').toLowerCase().trim();

  // Idempotence : cette vente d'abonnement a-t-elle déjà été créditée ?
  const { data: already } = await sb
    .from('AbonnementPayment')
    .select('id')
    .eq('saleId', saleId)
    .maybeSingle();
  if (already) return;

  if (!email) return; // sans e-mail, on ne peut pas rattacher → réconciliation manuelle (WebhookLog)

  // On rattache le paiement au freelance par son e-mail de compte.
  const { data: u } = await sb
    .from('User')
    .select('id, prenom, role')
    .ilike('email', email)
    .maybeSingle();
  const user = u as { id: string; prenom: string; role: string } | null;
  if (!user || user.role !== 'FREELANCE') return; // e-mail inconnu / non-freelance → réactivation manuelle

  // +30 jours à partir de la fin d'abonnement en cours (ou de maintenant si déjà expiré).
  const { data: prof } = await sb
    .from('Profile')
    .select('abonnementValidUntil')
    .eq('userId', user.id)
    .maybeSingle();
  const current = (prof as { abonnementValidUntil: string | null } | null)?.abonnementValidUntil;
  const base = current && new Date(current).getTime() > Date.now() ? new Date(current).getTime() : Date.now();
  const next = new Date(base + ABONNEMENT_MOIS_MS).toISOString();

  await sb.from('Profile').update({ abonnementValidUntil: next }).eq('userId', user.id);
  await sb.from('AbonnementPayment').insert({ userId: user.id, saleId, email, validUntil: next });

  // Notifie le freelance que son accès est réactivé.
  await createNotification({
    userId: user.id,
    type: 'PAIEMENT',
    titre: '✅ Abonnement activé',
    corps: `Votre abonnement est actif jusqu'au ${dateCourte(next)}. Merci ! Vous profitez à nouveau de tout recrutefreelance.com.`,
    lien: '/dashboard',
  });

  // Notifie les administrateurs.
  const { data: admins } = await sb.from('User').select('id').eq('admin', true);
  for (const a of (admins as { id: string }[]) ?? []) {
    await createNotification({
      userId: a.id,
      type: 'PAIEMENT',
      titre: '💳 Abonnement payé',
      corps: `${user.prenom} a payé son abonnement (20 000 FCFA). Accès prolongé jusqu'au ${dateCourte(next)}.`,
      lien: `/admin/utilisateurs/${user.id}`,
    });
  }
}
