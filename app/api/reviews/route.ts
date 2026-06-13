import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { reviewSchema } from '@/lib/validations';
import { createNotification } from '@/lib/notifications';

// Le client laisse un avis sur une mission validée.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Données invalides.' },
      { status: 400 }
    );
  }
  const { orderId, note, commentaire } = parsed.data;
  const sb = supabaseAdmin();

  const { data: order } = await sb
    .from('Order')
    .select('id, clientId, freelanceId, titre, statut')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 });
  if (order.clientId !== session.user.id) {
    return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 });
  }
  if (order.statut !== 'VALIDEE' && order.statut !== 'PAYEE') {
    return NextResponse.json(
      { error: 'Vous pourrez laisser un avis une fois la livraison validée.' },
      { status: 400 }
    );
  }

  const { data: existing } = await sb
    .from('Review')
    .select('id')
    .eq('orderId', orderId)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: 'Un avis a déjà été laissé.' }, { status: 409 });

  const { error } = await sb
    .from('Review')
    .insert({ orderId, authorId: session.user.id, note, commentaire: commentaire || null });
  if (error) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });

  // Notifie le freelance qu'un nouvel avis a été laissé.
  const o = order as unknown as { freelanceId: string; titre: string };
  await createNotification({
    userId: o.freelanceId,
    type: 'AVIS',
    titre: '⭐ Nouvel avis',
    corps: `${session.user.prenom} vous a laissé un avis ${'★'.repeat(note)} sur « ${o.titre} ».`,
    lien: `/freelance/${o.freelanceId}`,
  });

  return NextResponse.json({ ok: true });
}
