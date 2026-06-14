import { getSettings } from '@/lib/settings';
import AdminSettingsForm from '@/components/admin/AdminSettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminReglages() {
  const s = await getSettings();
  const commissionPct = Math.round((Number(s.commission_rate) || 0.2) * 100);

  return (
    <>
      <h1 className="admin-h1">Réglages</h1>
      <p className="admin-sub">Modifie les paramètres clés de la plateforme sans toucher au code.</p>
      <AdminSettingsForm commissionPct={commissionPct} banner={s.banner_messagerie || ''} />
    </>
  );
}
