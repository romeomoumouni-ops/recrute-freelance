import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Le client valide la livraison : RPC atomique (statut VALIDEE + crédit du solde freelance).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const { data, error } = await supabaseAdmin().rpc('validate_order', {
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

  return NextResponse.json({ ok: true, montant: data as number });
}
