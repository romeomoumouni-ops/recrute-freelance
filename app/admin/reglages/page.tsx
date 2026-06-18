import { getSettings } from '@/lib/settings';
import { supabaseAdmin } from '@/lib/supabase';
import AdminSettingsForm from '@/components/admin/AdminSettingsForm';
import AdminButton from '@/components/admin/AdminButton';

export const dynamic = 'force-dynamic';

export default async function AdminReglages() {
  const s = await getSettings();
  const commissionPct = Math.round(Number(s.commission_rate ?? 0) * 100);
  const { count: nbBots } = await supabaseAdmin()
    .from('User')
    .select('id', { count: 'exact', head: true })
    .eq('isTestBot', true);

  return (
    <>
      <h1 className="admin-h1">Réglages</h1>
      <p className="admin-sub">Modifie les paramètres clés de la plateforme sans toucher au code.</p>
      <AdminSettingsForm
        commissionPct={commissionPct}
        banner={s.banner_messagerie || ''}
        abonnementUrl={s.abonnement_url || ''}
        botsActifs={(s.bots_test_actifs || 'off').toLowerCase() === 'on'}
      />

      <h2 className="admin-h2">Comptes de test (bots)</h2>
      <div className="admin-panel" style={{ maxWidth: 620 }}>
        <p className="admin-meta" style={{ marginBottom: 12 }}>
          <strong>{nbBots ?? 0}</strong> compte(s)-bot en base. Avant le lancement public, supprime tout :
          comptes-bots, leurs conversations et messages, et l&apos;historique des scénarios. Le moteur de test
          sera aussi désactivé. <strong>Action irréversible.</strong>
        </p>
        <AdminButton
          endpoint="/api/admin/bots"
          body={{ action: 'cleanup' }}
          label="🧹 Supprimer tous les comptes de test"
          className="btn btn-dark btn-sm"
          confirmMsg="Supprimer définitivement tous les bots, leurs conversations et messages ?"
          successMsg="Comptes de test supprimés."
        />
      </div>
    </>
  );
}
