export const dynamic = 'force-dynamic';

export default function AdminExport() {
  return (
    <>
      <h1 className="admin-h1">Export comptable</h1>
      <p className="admin-sub">Télécharge les données au format CSV (ouvrable dans Excel / Google Sheets).</p>

      <div className="admin-cards">
        <div className="admin-card">
          <div className="admin-card-main">
            <div className="admin-meta"><strong>Commandes</strong><br />Toutes les missions (montant, commission, statut).</div>
          </div>
          <div className="admin-card-actions">
            <a className="btn btn-dark btn-sm" href="/api/admin/export?type=orders" download>Télécharger CSV</a>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-main">
            <div className="admin-meta"><strong>Paiements (Chariow)</strong><br />Tous les paiements de devis par carte.</div>
          </div>
          <div className="admin-card-actions">
            <a className="btn btn-dark btn-sm" href="/api/admin/export?type=payments" download>Télécharger CSV</a>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-main">
            <div className="admin-meta"><strong>Retraits Mobile Money</strong><br />Tous les retraits demandés et leur statut.</div>
          </div>
          <div className="admin-card-actions">
            <a className="btn btn-dark btn-sm" href="/api/admin/export?type=withdrawals" download>Télécharger CSV</a>
          </div>
        </div>
      </div>
    </>
  );
}
