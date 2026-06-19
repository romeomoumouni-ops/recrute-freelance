import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import AdminBroadcastForm from '@/components/admin/AdminBroadcastForm';

export const dynamic = 'force-dynamic';

export default async function AdminCommunication() {
  const session = await requireAdmin();
  const sb = supabaseAdmin();

  const [all, clients, freelances, unverified] = await Promise.all([
    sb.from('User').select('id', { count: 'exact', head: true }).eq('banni', false).eq('isTestBot', false),
    sb.from('User').select('id', { count: 'exact', head: true }).eq('banni', false).eq('isTestBot', false).eq('role', 'CLIENT'),
    sb.from('User').select('id', { count: 'exact', head: true }).eq('banni', false).eq('isTestBot', false).eq('role', 'FREELANCE'),
    sb
      .from('Profile')
      .select('userId, user:User!inner(id)', { count: 'exact', head: true })
      .neq('statutValidation', 'APPROUVE')
      .eq('user.role', 'FREELANCE')
      .eq('user.banni', false)
      .eq('user.isTestBot', false),
  ]);

  const counts = {
    all: all.count ?? 0,
    CLIENT: clients.count ?? 0,
    FREELANCE: freelances.count ?? 0,
    FREELANCE_UNVERIFIED: unverified.count ?? 0,
  };

  return (
    <>
      <h1 className="admin-h1">Communication</h1>
      <p className="admin-sub">
        Envoie un e-mail à tous tes utilisateurs ou à un segment (clients / freelances). Les comptes
        bannis sont exclus. Envoyé via Resend depuis notifications@recrutefreelance.com.
      </p>
      <AdminBroadcastForm adminEmail={session?.user.email ?? ''} counts={counts} />
    </>
  );
}
