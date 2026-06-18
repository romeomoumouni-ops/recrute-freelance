import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { withdrawalSchema } from '@/lib/validations';
import { TAUX_FCFA } from '@/lib/constants';
import { blockIfFreelanceExpired } from '@/lib/abonnement';

// Retrait Mobile Money (freelance) : RPC atomique (débite le solde + enregistre le retrait).
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  if (session.user.role !== 'FREELANCE') {
    return NextResponse.json({ error: 'Réservé aux freelances.' }, { status: 403 });
  }
  if (session.user.banni) return NextResponse.json({ error: 'Compte suspendu.' }, { status: 403 });
  const blocked = await blockIfFreelanceExpired(session);
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  const parsed = withdrawalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }
  const { montant, operateur, numero } = parsed.data;

  // Le retrait est enregistré "en attente" : l'admin envoie le Mobile Money à la
  // main puis le marque "effectué". Le débit du solde reste atomique côté DB.
  const { data, error } = await supabaseAdmin().rpc('withdraw', {
    actor_id: session.user.id,
    amount: montant,
    op: operateur,
    num: numero,
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('bad_amount'))
      return NextResponse.json({ error: 'Montant supérieur au solde disponible.' }, { status: 400 });
    if (msg.includes('no_profile'))
      return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 });
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }

  const m = data as number;
  return NextResponse.json({ ok: true, montant: m, fcfa: Math.round(m * TAUX_FCFA), operateur });
}
