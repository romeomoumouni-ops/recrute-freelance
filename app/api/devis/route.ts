import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { findOrCreateConversation } from '@/lib/conversations';
import { z } from 'zod';

const devisSchema = z.object({
  freelanceId: z.string().min(1),
  serviceId: z.string().optional(),
  description: z.string().trim().max(2000).optional().default(''),
});

// Demande de devis : crée/retrouve la conversation et y poste un message de type DEVIS.
// Réservé aux CLIENTS : un freelance ne peut pas contacter / solliciter un autre freelance.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  if (session.user.role !== 'CLIENT') {
    return NextResponse.json(
      { error: 'Seuls les comptes client peuvent contacter un freelance.' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = devisSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
  const { freelanceId, serviceId, description } = parsed.data;
  if (freelanceId === session.user.id) {
    return NextResponse.json({ error: 'Demande invalide.' }, { status: 400 });
  }
  const sb = supabaseAdmin();

  const { data: freelance } = await sb
    .from('User')
    .select('id')
    .eq('id', freelanceId)
    .eq('role', 'FREELANCE')
    .maybeSingle();
  if (!freelance) return NextResponse.json({ error: 'Freelance introuvable.' }, { status: 404 });

  let serviceTitre: string | null = null;
  let prix: number | null = null;
  if (serviceId) {
    const { data: service } = await sb
      .from('Service')
      .select('titre, prix, profile:Profile!inner(userId)')
      .eq('id', serviceId)
      .eq('profile.userId', freelanceId)
      .maybeSingle();
    if (service) {
      serviceTitre = (service as { titre: string }).titre;
      prix = (service as { prix: number }).prix;
    }
  }

  const conversationId = await findOrCreateConversation(session.user.id, freelanceId);
  if (!conversationId) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });

  const contenu =
    description ||
    (serviceTitre
      ? `Bonjour, je souhaite un devis pour « ${serviceTitre} ».`
      : 'Bonjour, je souhaite obtenir un devis pour une mission.');

  await sb.from('Message').insert({
    conversationId,
    senderId: session.user.id,
    type: 'DEVIS',
    meta: JSON.stringify({ serviceTitre, prix }),
    contenu,
  });

  return NextResponse.json({ conversationId });
}
