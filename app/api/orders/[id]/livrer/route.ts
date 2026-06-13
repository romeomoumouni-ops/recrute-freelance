import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications';

// Le freelance marque une mission comme livrée (EN_COURS -> LIVREE).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  // Mise à jour conditionnelle (propriétaire + statut) en une seule requête atomique.
  const { data, error } = await supabaseAdmin()
    .from('Order')
    .update({ statut: 'LIVREE' })
    .eq('id', params.id)
    .eq('freelanceId', session.user.id)
    .eq('statut', 'EN_COURS')
    .select('id, clientId, titre');

  if (error) return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: 'Mission introuvable ou non modifiable.' },
      { status: 400 }
    );
  }

  // Notifie le client que sa commande est livrée (à valider).
  const o = data[0] as unknown as { clientId: string; titre: string };
  await createNotification({
    userId: o.clientId,
    type: 'LIVRAISON',
    titre: '📦 Commande livrée',
    corps: `Votre commande « ${o.titre} » a été livrée. Validez-la depuis votre tableau de bord.`,
    lien: '/dashboard',
  });

  return NextResponse.json({ ok: true });
}
