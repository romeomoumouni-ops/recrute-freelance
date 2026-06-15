// Statut de validation d'un profil freelance (workflow d'approbation par l'admin).
export type ValidationStatus = 'NON_SOUMIS' | 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';

export const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  NON_SOUMIS: 'Non soumis',
  EN_ATTENTE: 'En attente de validation',
  APPROUVE: 'Approuvé',
  REJETE: 'Refusé',
};

export function asValidationStatus(v: unknown): ValidationStatus {
  return v === 'EN_ATTENTE' || v === 'APPROUVE' || v === 'REJETE' ? v : 'NON_SOUMIS';
}
