import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications';
import { euros } from '@/lib/utils';

// Le client valide la livraison : RPC atomique (statut VALIDEE + crédit du solde freelance).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const sb = supabaseAdmin();
  const { data: ord } = await sb
    .from('Order')
    .select('freelanceId, titre')
    .eq('id', params.id)
    .maybeSingle();

  const { data, error } = await sb.rpc('validate_order', {
    order_id: params.id,
    actor_id: session.user.id,
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('forbidden'))
      return NextResponse.json({ error: 'Action non autorisée.' }, { status: 403 });
    if (msg.includes('not_found'))
      return NextResponse.json({ error: 'Mission introuvable.' }, { status: 404 });
    if (msg.includes('bad_status'))
      return NextResponse.json({ error: 'Cette mission est déjà validée.' }, { status: 400 });
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }

  const o = ord as unknown as { freelanceId: string; titre: string } | null;
  if (o) {
    await createNotification({
      userId: o.freelanceId,
      type: 'VALIDATION',
      titre: '✅ Commande validée',
      corps: `${session.user.prenom} a validé « ${o.titre} ». ${euros(data as number)} ajoutés à votre solde disponible.`,
      lien: '/dashboard',
    });
  }

  return NextResponse.json({ ok: true, montant: data as number });
}
