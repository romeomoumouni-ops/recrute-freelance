// ===== Constantes métier =====

export const COMMISSION = 0; // Plus aucune commission : le freelance garde 100 % de ses missions
export const TAUX_FCFA = 655.96; // 1 € = 655,96 FCFA

// Abonnement freelance : 1er mois gratuit, puis 20 000 FCFA / mois.
export const ABONNEMENT_FCFA = 20000;
export const ABONNEMENT_EUR = Math.round(ABONNEMENT_FCFA / TAUX_FCFA); // ≈ 30 €

export type Role = 'CLIENT' | 'FREELANCE';
export type OrderStatus =
  | 'EN_ATTENTE'
  | 'EN_COURS'
  | 'LIVREE'
  | 'VALIDEE'
  | 'PAYEE'
  | 'ANNULEE';

export const STATUTS_LABEL: Record<OrderStatus, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  LIVREE: 'Livrée',
  VALIDEE: 'Validée',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
};

// classe CSS du badge de statut
export const STATUT_CLASS: Record<OrderStatus, string> = {
  EN_ATTENTE: 'enattente',
  EN_COURS: 'encours',
  LIVREE: 'livree',
  VALIDEE: 'validee',
  PAYEE: 'payee',
  ANNULEE: 'annulee',
};

export const CATEGORIES: Record<string, string> = {
  design: 'Design de logo',
  dev: 'Site & Développement web',
  ia: 'Services IA',
  marketing: 'Marketing Digital',
  audiovisuel: 'Audiovisuel',
  redaction: 'Rédaction',
  social: 'Réseaux sociaux',
  business: 'Business',
};

export const CATEGORIES_LIST = Object.entries(CATEGORIES).map(([value, label]) => ({
  value,
  label,
}));

export const PAYS_AFRIQUE = [
  'Bénin',
  'Burkina Faso',
  'Cameroun',
  "Côte d'Ivoire",
  'Guinée',
  'Mali',
  'Niger',
  'RD Congo',
  'Sénégal',
  'Togo',
];

export const OPERATEURS_MOMO = ['Orange Money', 'MTN MoMo', 'Wave', 'Moov Money'];

// Mappe le libellé opérateur vers le code stocké
export const OPERATEUR_CODE: Record<string, string> = {
  'Orange Money': 'ORANGE',
  'MTN MoMo': 'MTN',
  Wave: 'WAVE',
  'Moov Money': 'MOOV',
};
export const OPERATEUR_LABEL: Record<string, string> = {
  ORANGE: 'Orange Money',
  MTN: 'MTN MoMo',
  WAVE: 'Wave',
  MOOV: 'Moov Money',
};
