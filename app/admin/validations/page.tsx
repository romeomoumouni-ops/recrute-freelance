import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { dateCourte, heureCourte } from '@/lib/utils';
import { OPERATEUR_LABEL } from '@/lib/constants';
import AdminValidationActions from '@/components/admin/AdminValidationActions';

export const dynamic = 'force-dynamic';

export default async function AdminValidations() {
  const sb = supabaseAdmin();

  const { data: profiles } = await sb
    .from('Profile')
    .select(
      'userId, titre, bio, photoUrl, dateSoumission, services:Service(id), portfolio:PortfolioItem(id), user:User(prenom, email, pays, telephoneMomo, operateurMomo, banni)'
    )
    .eq('statutValidation', 'EN_ATTENTE')
    .order('dateSoumission', { ascending: true });

  type Row = {
    userId: string;
    titre: string | null;
    bio: string | null;
    photoUrl: string | null;
    dateSoumission: string | null;
    services: unknown[];
    portfolio: unknown[];
    user: { prenom: string; email: string; pays: string | null; telephoneMomo: string | null; operateurMomo: string | null; banni: boolean } | null;
  };
  const list = (profiles as unknown as Row[]) ?? [];

  return (
    <>
      <h1 className="admin-h1">Demandes de validation</h1>
      <p className="admin-sub">
        Freelances ayant complété tous les critères et soumis leur profil. Une fois <strong>approuvé</strong>,
        le freelance devient visible par les clients dans « Trouver un freelance ».
      </p>

      {list.length === 0 ? (
        <div className="admin-empty">Aucune demande en attente. ✅</div>
      ) : (
        <div className="admin-cards">
          {list.map((p) => (
            <div className="admin-card hot" key={p.userId}>
              <div className="admin-card-main">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {p.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photoUrl}
                      alt=""
                      style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <div>
                    <strong>{p.user?.prenom ?? '—'}</strong>{' '}
                    {p.user?.banni && <span className="status red">banni</span>}
                    <div className="admin-meta">{p.user?.email}{p.user?.pays ? ` · ${p.user.pays}` : ''}</div>
                  </div>
                </div>
                <div className="admin-meta" style={{ marginTop: 8 }}>
                  <strong>{p.titre || 'Sans titre'}</strong>
                </div>
                <div className="admin-meta" style={{ marginTop: 2 }}>
                  {(p.bio || '').slice(0, 160)}{(p.bio || '').length > 160 ? '…' : ''}
                </div>
                <div className="admin-meta" style={{ marginTop: 6 }}>
                  {(p.services ?? []).length} service(s) · {(p.portfolio ?? []).length} réalisation(s) ·{' '}
                  MoMo : {p.user?.telephoneMomo || '—'}{p.user?.operateurMomo ? ` (${OPERATEUR_LABEL[p.user.operateurMomo] ?? p.user.operateurMomo})` : ''}
                  {p.dateSoumission && <> · soumis le {dateCourte(p.dateSoumission)} {heureCourte(p.dateSoumission)}</>}
                </div>
                <div className="admin-meta" style={{ marginTop: 6 }}>
                  <Link href={`/admin/utilisateurs/${p.userId}`} className="inline-ic">Voir la fiche complète →</Link>
                </div>
              </div>
              <AdminValidationActions userId={p.userId} prenom={p.user?.prenom ?? 'ce freelance'} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
