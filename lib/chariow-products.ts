// Paliers de prix Chariow (produits à prix fixe de la boutique "bajiuulm").
// Chaque devis doit correspondre à l'un de ces montants. Les URL de checkout
// sont publiques (pages boutique), donc ce fichier n'est pas secret.
// Pour ajouter un palier : créer le produit sur Chariow puis ajouter une ligne.
export interface ChariowTier {
  eur: number;
  productId: string;
  checkoutUrl: string;
}

export const CHARIOW_TIERS: ChariowTier[] = [
  { eur: 5, productId: 'prd_quuqvzom', checkoutUrl: 'https://bajiuulm.mychariow.shop/prd_quuqvzom/checkout' },
  { eur: 10, productId: 'prd_7ar5x6vg', checkoutUrl: 'https://bajiuulm.mychariow.shop/prd_7ar5x6vg/checkout' },
  { eur: 15, productId: 'prd_yvfqpyjx', checkoutUrl: 'https://bajiuulm.mychariow.shop/prd_yvfqpyjx/checkout' },
  { eur: 20, productId: 'prd_5ruv3542', checkoutUrl: 'https://bajiuulm.mychariow.shop/prd_5ruv3542/checkout' },
  { eur: 25, productId: 'prd_qsp93mot', checkoutUrl: 'https://bajiuulm.mychariow.shop/prd_qsp93mot/checkout' },
];

// Montants proposés (utilisé côté UI pour le sélecteur).
export const TIER_AMOUNTS = CHARIOW_TIERS.map((t) => t.eur);

export function tierForAmount(eur: number): ChariowTier | null {
  return CHARIOW_TIERS.find((t) => t.eur === eur) ?? null;
}

export function tierForProduct(productId: string): ChariowTier | null {
  return CHARIOW_TIERS.find((t) => t.productId === productId) ?? null;
}
