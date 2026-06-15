import 'server-only';
import { TAUX_FCFA } from './constants';

// Intégration Bictorys (https://docs.bictorys.com). Mode TEST par défaut.
// Encaissement : POST /pay/v1/charges -> renvoie un lien de paiement hébergé.
// Webhook : header X-Secret-Key (comparé au secret configuré dans le dashboard).

const BASE = process.env.BICTORYS_BASE_URL || 'https://api.test.bictorys.com';

export function eurToXof(eur: number): number {
  return Math.round(eur * TAUX_FCFA);
}

export interface ChargeInput {
  amountXof: number;
  paymentReference: string; // notre référence (sert à réconcilier via le webhook)
  merchantReference: string; // UUID
  customer: { name: string; email: string; phone?: string; country?: string; locale?: string };
  redirectUrl: string;
  paymentType?: string; // 'card' | 'orange_money' | 'mtn_money' | ...
}

export interface ChargeResult {
  ok: boolean;
  url?: string;
  transactionId?: string;
  error?: string;
  raw?: unknown;
}

export function bictorysConfigured(): boolean {
  return !!process.env.BICTORYS_API_KEY;
}

export async function createCharge(input: ChargeInput): Promise<ChargeResult> {
  const key = process.env.BICTORYS_API_KEY;
  if (!key) return { ok: false, error: 'BICTORYS_API_KEY manquant (variables d’environnement).' };

  const paymentType = input.paymentType || process.env.BICTORYS_PAYMENT_TYPE || 'card';
  const url = `${BASE}/pay/v1/charges?payment_type=${encodeURIComponent(paymentType)}`;

  const body = {
    merchantReference: input.merchantReference,
    amount: input.amountXof,
    currency: 'XOF',
    country: input.customer.country || 'SN',
    paymentReference: input.paymentReference,
    redirectUrl: input.redirectUrl,
    successRedirectUrl: input.redirectUrl,
    errorRedirectUrl: input.redirectUrl,
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone || '',
      country: input.customer.country || 'SN',
      locale: input.customer.locale || 'fr-FR',
    },
    allowUpdateCustomer: true,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': key },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, error: `Bictorys ${res.status} : ${JSON.stringify(json).slice(0, 400)}`, raw: json };
    }
    // Défensif : le lien peut s'appeler link / redirectUrl / checkoutUrl, à la racine ou sous data.
    const data = (json.data ?? json) as Record<string, unknown>;
    const link =
      (json.link as string) ||
      (json.redirectUrl as string) ||
      (json.checkoutUrl as string) ||
      (data.link as string) ||
      (data.redirectUrl as string) ||
      (data.checkoutUrl as string);
    const transactionId =
      (json.id as string) ||
      (json.transactionId as string) ||
      (json.chargeId as string) ||
      (data.id as string);
    if (!link) return { ok: false, error: 'Réponse Bictorys sans lien de paiement.', raw: json };
    return { ok: true, url: link, transactionId, raw: json };
  } catch (e) {
    return { ok: false, error: 'Erreur réseau lors de l’appel à Bictorys.', raw: String(e) };
  }
}
