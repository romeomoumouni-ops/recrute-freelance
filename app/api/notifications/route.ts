import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { heureCourte } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Liste des notifications de l'utilisateur connecté (+ nombre de non-lues).
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ notifications: [], unread: 0 });

  const sb = supabaseAdmin();
  const { data } = await sb
    .from('Notification')
    .select('id, type, titre, corps, lien, lu, createdAt')
    .eq('userId', session.user.id)
    .order('createdAt', { ascending: false })
    .limit(30);

  type Row = {
    id: string; type: string; titre: string; corps: string | null;
    lien: string | null; lu: boolean; createdAt: string;
  };
  const rows = (data as Row[]) ?? [];
  return NextResponse.json({
    unread: rows.filter((n) => !n.lu).length,
    notifications: rows.map((n) => ({
      id: n.id,
      type: n.type,
      titre: n.titre,
      corps: n.corps,
      lien: n.lien,
      lu: n.lu,
      heure: heureCourte(n.createdAt),
    })),
  });
}
