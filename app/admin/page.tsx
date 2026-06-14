import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { euros } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Stats {
  clients: number; freelances: number; bannis: number;
  cmd_en_cours: number; cmd_validees: number;
  sequestre: number; gmv: number; revenus: number;
  retraits_attente_n: number; retraits_attente_montant: number;
  flagues: number; avis: number;
}

export default async function AdminHome() {
  const { data } = await supabaseAdmin().rpc('admin_stats');
  const s = (data as Stats) ?? ({} as Stats);

  return (
    <>
      <h1 className="admin-h1">Tableau de bord</h1>

      {/* Alertes : ce qui demande une action */}
      <div className="admin-alerts">
        <Link href="/admin/retraits" className={`admin-alert${s.retraits_attente_n ? ' hot' : ''}`}>
          <div className="n">{s.retraits_attente_n ?? 0}</div>
          <div className="l">Retraits à envoyer<br /><strong>{euros(s.retraits_attente_montant ?? 0)}</strong></div>
        </Link>
        <Link href="/admin/moderation" className={`admin-alert${s.flagues ? ' hot' : ''}`}>
          <div className="n">{s.flagues ?? 0}</div>
          <div className="l">Messages flagués<br />à examiner</div>
        </Link>
        <Link href="/admin/litiges" className="admin-alert">
          <div className="n">{s.cmd_en_cours ?? 0}</div>
          <div className="l">Commandes en cours<br />(litiges possibles)</div>
        </Link>
      </div>

      <h2 className="admin-h2">Finances</h2>
      <div className="admin-kpis">
        <div className="admin-kpi"><div className="v">{euros(s.revenus ?? 0)}</div><div className="k">Revenus (commission)</div></div>
        <div className="admin-kpi"><div className="v">{euros(s.gmv ?? 0)}</div><div className="k">Volume validé (GMV)</div></div>
        <div className="admin-kpi"><div className="v">{euros(s.sequestre ?? 0)}</div><div className="k">En séquestre</div></div>
        <div className="admin-kpi"><div className="v">{s.cmd_validees ?? 0}</div><div className="k">Commandes validées</div></div>
      </div>

      <h2 className="admin-h2">Communauté</h2>
      <div className="admin-kpis">
        <div className="admin-kpi"><div className="v">{s.clients ?? 0}</div><div className="k">Clients</div></div>
        <div className="admin-kpi"><div className="v">{s.freelances ?? 0}</div><div className="k">Freelances</div></div>
        <div className="admin-kpi"><div className="v">{s.avis ?? 0}</div><div className="k">Avis</div></div>
        <div className="admin-kpi"><div className="v">{s.bannis ?? 0}</div><div className="k">Comptes bannis</div></div>
      </div>
    </>
  );
}
