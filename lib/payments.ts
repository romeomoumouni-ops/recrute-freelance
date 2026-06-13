// ===== Architecture de paiement (MVP : implémentations simulées) =====
// L'objectif est d'isoler la logique de paiement pour brancher plus tard
// Stripe (encaissement carte) et CinetPay/FedaPay/PawaPay (payout Mobile Money)
// sans toucher au reste de l'application.

export interface ChargeResult {
  success: boolean;
  reference: string;
}

export interface PayoutResult {
  success: boolean;
  reference: string;
}

// Encaissement carte côté client (escrow). Aujourd'hui : simulé.
export interface PaymentProvider {
  charge(amountEuros: number, meta?: Record<string, string>): Promise<ChargeResult>;
}

// Versement Mobile Money vers le freelance. Aujourd'hui : simulé.
export interface PayoutProvider {
  payout(
    amountEuros: number,
    operateur: string,
    numero: string,
    meta?: Record<string, string>
  ): Promise<PayoutResult>;
}

class MockPaymentProvider implements PaymentProvider {
  async charge(): Promise<ChargeResult> {
    return { success: true, reference: 'mock_pay_' + Math.round(Date.now()).toString(36) };
  }
}

class MockPayoutProvider implements PayoutProvider {
  async payout(): Promise<PayoutResult> {
    return { success: true, reference: 'mock_payout_' + Math.round(Date.now()).toString(36) };
  }
}

export const paymentProvider: PaymentProvider = new MockPaymentProvider();
export const payoutProvider: PayoutProvider = new MockPayoutProvider();
