import { NextResponse } from 'next/server';

// DÉSACTIVÉ : ancien flux de commande à paiement SIMULÉ (mock) qui créait une
// commande « payée » sans paiement réel — vecteur d'extraction de fonds.
// Les commandes passent désormais uniquement par le paiement carte Chariow (devis).
export async function POST() {
  return NextResponse.json(
    { error: 'Flux indisponible. Passez par un devis payé par carte.' },
    { status: 410 }
  );
}
