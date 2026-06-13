import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { orderSchema } from '@/lib/validations';
import { COMMISSION } from '@/lib/constants';
import { paymentProvider } from '@/lib/payments';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  if (session.user.role !== 'CLIENT') {
    return NextResponse.json(
      { error: 'Seuls les comptes entreprise peuvent commander.' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }
  const { freelanceId, serviceId, titre, description, jours } = parsed.data;
  if (freelanceId === session.user.id) {
    return NextResponse.json({ error: 'Commande invalide.' }, { status: 400 });
  }
  const sb = supabaseAdmin();

  const { data: freelance } = await sb
    .from('User')
    .select('id, profile:Profile(tarifJour)')
    .eq('id', freelanceId)
    .eq('role', 'FREELANCE')
    .maybeSingle();
  if (!freelance || !freelance.profile) {
    return NextResponse.json({ error: 'Freelance introuvable.' }, { status: 404 });
  }
  const tarifJour = (freelance.profile as unknown as { tarifJour: number | null }).tarifJour;

  // Calcul du montant côté serveur (jamais depuis le client).
  let montant: number;
  let safeServiceId: string | undefined;
  if (serviceId) {
    const { data: service } = await sb
      .from('Service')
      .select('id, prix, profile:Profile!inner(userId)')
      .eq('id', serviceId)
      .eq('profile.userId', freelanceId)
      .maybeSingle();
    if (!service) return NextResponse.json({ error: 'Service introuvable.' }, { status: 404 });
    montant = (service as { prix: number }).prix;
    safeServiceId = (service as { id: string }).id;
  } else if (tarifJour != null) {
    montant = tarifJour * jours;
  } else {
    return NextResponse.json(
      { error: 'Ce freelance ne propose pas de tarif journalier. Commandez un de ses services.' },
      { status: 400 }
    );
  }

  const commission = Math.round(montant * COMMISSION);

  const charge = await paymentProvider.charge(montant + commission, { freelanceId });
  if (!charge.success) {
    return NextResponse.json({ error: 'Le paiement a échoué.' }, { status: 402 });
  }

  const { data: order, error } = await sb
    .from('Order')
    .insert({
      clientId: session.user.id,
      freelanceId,
      serviceId: safeServiceId ?? null,
      titre,
      description,
      jours,
      montant,
      commission,
      statut: 'EN_COURS',
    })
    .select('id')
    .single();
  if (error || !order) {
    return NextResponse.json({ error: 'Commande impossible.' }, { status: 500 });
  }

  // Une conversation se crée automatiquement à la première commande.
  await sb
    .from('Conversation')
    .upsert(
      { clientId: session.user.id, freelanceId },
      { onConflict: 'clientId,freelanceId', ignoreDuplicates: true }
    );

  return NextResponse.json({ orderId: (order as { id: string }).id, montant, commission });
}
