// ===== Constantes métier =====

export const COMMISSION = 0.1; // 10 % payés par le client
export const TAUX_FCFA = 655.96; // 1 € = 655,96 FCFA

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
  dev: 'Développement',
  design: 'Design',
  marketing: 'Marketing Digital',
  video: 'Vidéo & Animation',
  ia: 'Services IA',
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
