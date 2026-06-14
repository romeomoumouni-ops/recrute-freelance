import { supabaseAdmin } from '@/lib/supabase';
import AdminUsersTable, { type AdminUserRow } from '@/components/admin/AdminUsersTable';

export const dynamic = 'force-dynamic';

export default async function AdminUtilisateurs() {
  const sb = supabaseAdmin();
  const [{ data: users }, { data: profiles }] = await Promise.all([
    sb.from('User').select('id, prenom, email, role, banni, createdAt, pays').order('createdAt', { ascending: false }).limit(500),
    sb.from('Profile').select('userId, estVerifie'),
  ]);

  type U = { id: string; prenom: string; email: string; role: string; banni: boolean; createdAt: string; pays: string | null };
  const verif = new Map((profiles as { userId: string; estVerifie: boolean }[] ?? []).map((p) => [p.userId, p.estVerifie]));
  const rows: AdminUserRow[] = ((users as U[]) ?? []).map((u) => ({
    ...u,
    estVerifie: verif.get(u.id) ?? false,
  }));

  return (
    <>
      <h1 className="admin-h1">Utilisateurs ({rows.length})</h1>
      <p className="admin-sub">
        Clique un nom pour voir la fiche complète. Bannir bloque l&apos;accès à toute la plateforme ;
        vérifier attribue le badge « Freelance approuvé ».
      </p>
      <AdminUsersTable users={rows} />
    </>
  );
}
