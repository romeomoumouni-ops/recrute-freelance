import { supabaseAdmin } from './supabase';
import { parseSkills } from './utils';
import { asValidationStatus, type ValidationStatus } from './validation';

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
  cvName: string | null;
  cvUrl: string | null;
  statutValidation: ValidationStatus;
  services: { id: string; titre: string; description: string; prix: number; delaiJours: number }[];
  portfolio: { id: string; imageUrl: string }[];
  reviews: { id: string; note: number; commentaire: string | null; author: string; date: Date }[];
  prixMin: number | null;
}

// Profil complet construit depuis les tables de base (PAS la vue filtrée par approbation).
// Renvoie `statutValidation` pour que la PAGE décide qui peut le voir
// (l'owner et l'admin voient même un profil non approuvé ; les autres non).
export async function getFreelanceProfile(id: string): Promise<FreelanceFull | null> {
  const sb = supabaseAdmin();

  const { data: u } = await sb
    .from('User')
    .select('id, prenom, pays, role, banni')
    .eq('id', id)
    .maybeSingle();
  const user = u as { id: string; prenom: string; pays: string | null; role: string; banni: boolean } | null;
  if (!user || user.role !== 'FREELANCE' || user.banni) return null;

  const { data: prof } = await sb
    .from('Profile')
    .select(
      'titre, cat, skills, photoUrl, estVerifie, bio, note, cvName, cvUrl, statutValidation, services:Service(id,titre,description,prix,delaiJours,createdAt), portfolio:PortfolioItem(id,imageUrl,ordre)'
    )
    .eq('userId', id)
    .maybeSingle();
  if (!prof) return null;

  type Svc = { id: string; titre: string; description: string; prix: number; delaiJours: number; createdAt: string };
  type Pf = { id: string; imageUrl: string; ordre: number };
  const p = prof as unknown as {
    titre: string | null; cat: string | null; skills: string | null; photoUrl: string | null;
    estVerifie: boolean; bio: string | null; note: string | null; cvName: string | null; cvUrl: string | null;
    statutValidation: string | null; services: Svc[]; portfolio: Pf[];
  };

  const services = ((p.services ?? []) as Svc[])
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((s) => ({ id: s.id, titre: s.titre, description: s.description, prix: s.prix, delaiJours: s.delaiJours }));
  const portfolio = ((p.portfolio ?? []) as Pf[])
    .slice()
    .sort((a, b) => a.ordre - b.ordre)
    .map((pf) => ({ id: pf.id, imageUrl: pf.imageUrl }));

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

  const prixMin = services.length ? Math.min(...services.map((s) => s.prix)) : null;
  const note = reviews.length ? reviews.reduce((a, r) => a + r.note, 0) / reviews.length : 0;

  return {
    id: user.id,
    nom: user.prenom,
    pays: user.pays,
    titre: p.titre ?? 'Freelance',
    cat: p.cat,
    skills: parseSkills(p.skills),
    tarif: prixMin,
    photoUrl: p.photoUrl,
    note,
    avis: reviews.length,
    estVerifie: p.estVerifie,
    bio: p.bio ?? '',
    mot: p.note ?? null,
    cvName: p.cvName,
    cvUrl: p.cvUrl,
    prixMin,
    statutValidation: asValidationStatus(p.statutValidation),
    services,
    portfolio,
    reviews,
  };
}
