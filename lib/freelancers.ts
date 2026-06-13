import { supabaseAdmin } from './supabase';
import { parseSkills } from './utils';

export interface FreelanceCard {
  id: string;
  nom: string;
  pays: string | null;
  titre: string;
  cat: string | null;
  skills: string[];
  tarif: number | null; // prix d'entrée = min service
  photoUrl: string | null;
  note: number;
  avis: number;
  estVerifie: boolean;
}

interface CardRow {
  id: string;
  nom: string;
  pays: string | null;
  titre: string | null;
  cat: string | null;
  skills: string | null;
  photoUrl: string | null;
  estVerifie: boolean;
  bio: string | null;
  mot: string | null;
  cvName: string | null;
  telephoneMomo: string | null;
  operateurMomo: string | null;
  prixMin: number | null;
  note: number;
  avis: number;
}

function toCard(r: CardRow): FreelanceCard {
  return {
    id: r.id,
    nom: r.nom,
    pays: r.pays,
    titre: r.titre ?? 'Freelance',
    cat: r.cat,
    skills: parseSkills(r.skills),
    tarif: r.prixMin,
    photoUrl: r.photoUrl,
    note: r.note ?? 0,
    avis: r.avis ?? 0,
    estVerifie: r.estVerifie,
  };
}

export async function getFreelanceCards(): Promise<FreelanceCard[]> {
  const { data, error } = await supabaseAdmin().from('freelance_card').select('*');
  if (error) throw new Error(error.message);
  return (data as CardRow[]).map(toCard);
}

export interface FreelanceFull extends FreelanceCard {
  bio: string;
  mot: string | null;
  operateurMomo: string | null;
  telephoneMomo: string | null;
  cvName: string | null;
  services: { id: string; titre: string; description: string; prix: number; delaiJours: number }[];
  portfolio: { id: string; imageUrl: string }[];
  reviews: { id: string; note: number; commentaire: string | null; author: string; date: Date }[];
  prixMin: number | null;
}

export async function getFreelanceProfile(id: string): Promise<FreelanceFull | null> {
  const sb = supabaseAdmin();

  const { data: card } = await sb.from('freelance_card').select('*').eq('id', id).maybeSingle();
  if (!card) return null;
  const r = card as CardRow;

  // Services + portfolio (via le profil de ce freelance)
  const { data: prof } = await sb
    .from('Profile')
    .select(
      'id, services:Service(id,titre,description,prix,delaiJours,createdAt), portfolio:PortfolioItem(id,imageUrl,ordre)'
    )
    .eq('userId', id)
    .maybeSingle();

  type Svc = { id: string; titre: string; description: string; prix: number; delaiJours: number; createdAt: string };
  type Pf = { id: string; imageUrl: string; ordre: number };
  const services = (((prof?.services as Svc[]) ?? []) as Svc[])
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((s) => ({ id: s.id, titre: s.titre, description: s.description, prix: s.prix, delaiJours: s.delaiJours }));
  const portfolio = (((prof?.portfolio as Pf[]) ?? []) as Pf[])
    .slice()
    .sort((a, b) => a.ordre - b.ordre)
    .map((p) => ({ id: p.id, imageUrl: p.imageUrl }));

  // Avis (Review -> Order.freelanceId)
  const { data: revs } = await sb
    .from('Review')
    .select('id, note, commentaire, createdAt, order:Order!inner(freelanceId), author:User(prenom)')
    .eq('order.freelanceId', id)
    .order('createdAt', { ascending: false });

  type Rev = { id: string; note: number; commentaire: string | null; createdAt: string; author: { prenom: string } | null };
  const reviews = ((revs as unknown as Rev[]) ?? []).map((rv) => ({
    id: rv.id,
    note: rv.note,
    commentaire: rv.commentaire,
    author: rv.author?.prenom ?? 'Client',
    date: new Date(rv.createdAt),
  }));

  return {
    ...toCard(r),
    bio: r.bio ?? '',
    mot: r.mot ?? null,
    operateurMomo: r.operateurMomo,
    telephoneMomo: r.telephoneMomo,
    cvName: r.cvName,
    prixMin: r.prixMin,
    services,
    portfolio,
    reviews,
  };
}
