import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { parseSkills } from '@/lib/utils';
import ProfilEditor from './ProfilEditor';

export const metadata: Metadata = { title: 'Mon profil' };
export const dynamic = 'force-dynamic';

const SELECT =
  'photoUrl, titre, bio, note, cat, skills, cvName, services:Service(id,titre,description,prix,delaiJours,createdAt), portfolio:PortfolioItem(id,imageUrl,ordre), user:User(prenom,telephoneMomo)';

export default async function MonProfilPage() {
  const session = await auth();
  if (!session) redirect('/connexion?callbackUrl=/mon-profil');
  if (session.user.banni) redirect('/compte-suspendu');
  if (session.user.role !== 'FREELANCE') redirect('/dashboard');
  const sb = supabaseAdmin();
  const userId = session.user.id;

  let { data: profile } = await sb.from('Profile').select(SELECT).eq('userId', userId).maybeSingle();
  if (!profile) {
    await sb.from('Profile').insert({ userId, skills: '[]' });
    ({ data: profile } = await sb.from('Profile').select(SELECT).eq('userId', userId).maybeSingle());
  }
  if (!profile) redirect('/dashboard');

  type Svc = { id: string; titre: string; description: string; prix: number; delaiJours: number; createdAt: string };
  type Pf = { id: string; imageUrl: string; ordre: number };
  const user = profile.user as unknown as { prenom: string; telephoneMomo: string | null } | null;

  const services = (((profile.services as Svc[]) ?? []) as Svc[])
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((s) => ({ id: s.id, titre: s.titre, description: s.description, prix: s.prix, delaiJours: s.delaiJours }));
  const portfolio = (((profile.portfolio as Pf[]) ?? []) as Pf[])
    .slice()
    .sort((a, b) => a.ordre - b.ordre)
    .map((p) => ({ id: p.id, imageUrl: p.imageUrl }));

  return (
    <ProfilEditor
      prenom={user?.prenom ?? ''}
      telephoneMomo={user?.telephoneMomo ?? null}
      initial={{
        photoUrl: profile.photoUrl ?? null,
        titre: profile.titre ?? '',
        bio: profile.bio ?? '',
        note: profile.note ?? '',
        cat: profile.cat ?? '',
        skills: parseSkills(profile.skills),
        cvName: profile.cvName ?? null,
        services,
        portfolio,
      }}
    />
  );
}
