// Paliers de prix Chariow (produits à prix fixe de la boutique "bajiuulm").
// Chaque devis doit correspondre à l'un de ces montants. Les URL de checkout
// sont publiques (pages boutique), donc ce fichier n'est pas secret.
// Pour ajouter un palier : créer le produit sur Chariow puis ajouter une ligne.
export interface ChariowTier {
  eur: number;
  productId: string;
  checkoutUrl: string;
}

// ⚠️ TEMPORAIRE : lien de paiement à 25 € utilisé comme bouche-trou pour les
// paliers > 25 € dont le vrai lien Chariow n'existe pas encore. À REMPLACER par
// les vrais liens (un par montant) dès qu'ils seront créés. Tant que c'est en
// place, un paiement sur un de ces paliers ne débite réellement que 25 €.
const PLACEHOLDER_PRODUCT_ID = 'prd_qsp93mot';
const PLACEHOLDER_URL = 'https://bajiuulm.mychariow.shop/prd_qsp93mot/checkout';

// Paliers avec un VRAI lien de paiement dédié.
const REAL_TIERS: ChariowTier[] = [
  { eur: 5, productId: 'prd_quuqvzom', checkoutUrl: 'https://bajiuulm.mychariow.shop/prd_quuqvzom/checkout' },
  { eur: 10, productId: 'prd_7ar5x6vg', checkoutUrl: 'https://bajiuulm.mychariow.shop/prd_7ar5x6vg/checkout' },
  { eur: 15, productId: 'prd_yvfqpyjx', checkoutUrl: 'https://bajiuulm.mychariow.shop/prd_yvfqpyjx/checkout' },
  { eur: 20, productId: 'prd_5ruv3542', checkoutUrl: 'https://bajiuulm.mychariow.shop/prd_5ruv3542/checkout' },
  { eur: 25, productId: 'prd_qsp93mot', checkoutUrl: 'https://bajiuulm.mychariow.shop/prd_qsp93mot/checkout' },
];

// Paliers supplémentaires jusqu'à 1000 € (par pas de 50). Liens pas encore créés
// → on pointe temporairement vers le lien 25 € (à remplacer ligne par ligne).
const PLACEHOLDER_AMOUNTS: number[] = [];
for (let eur = 50; eur <= 1000; eur += 50) PLACEHOLDER_AMOUNTS.push(eur);

const PLACEHOLDER_TIERS: ChariowTier[] = PLACEHOLDER_AMOUNTS.map((eur) => ({
  eur,
  productId: PLACEHOLDER_PRODUCT_ID,
  checkoutUrl: PLACEHOLDER_URL,
}));

export const CHARIOW_TIERS: ChariowTier[] = [...REAL_TIERS, ...PLACEHOLDER_TIERS];

// Montants proposés (utilisé côté UI pour le sélecteur).
export const TIER_AMOUNTS = CHARIOW_TIERS.map((t) => t.eur);

export function tierForAmount(eur: number): ChariowTier | null {
  return CHARIOW_TIERS.find((t) => t.eur === eur) ?? null;
}

export function tierForProduct(productId: string): ChariowTier | null {
  return CHARIOW_TIERS.find((t) => t.productId === productId) ?? null;
}
