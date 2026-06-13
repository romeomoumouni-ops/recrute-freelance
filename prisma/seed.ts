import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import bcrypt from 'bcryptjs';

// ----- Chargement minimal du .env (tsx ne le fait pas tout seul) -----
function loadEnv() {
  try {
    const txt = readFileSync('.env', 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* ignore */
  }
}
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env');
  process.exit(1);
}
const sb = createClient(URL, KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as undefined },
});

const COMMISSION = 0.1;
const OP_CODE: Record<string, string> = {
  'Orange Money': 'ORANGE',
  'MTN MoMo': 'MTN',
  Wave: 'WAVE',
  'Moov Money': 'MOOV',
};

interface FreelanceSeed {
  email: string;
  nom: string;
  pays: string;
  role: string;
  cat: string;
  skills: string[];
  tarif: number;
  momo: string;
  numero: string;
  bio: string;
  note?: string;
  img: number;
  services: { titre: string; description: string; prix: number; delaiJours: number }[];
  reviews: { note: number; commentaire: string }[];
}

const FREELANCES: FreelanceSeed[] = [
  {
    email: 'awa.diop@demo.rf', nom: 'Awa Diop', pays: 'Sénégal', role: 'Développeuse Web Full-Stack', cat: 'dev',
    skills: ['React', 'Node.js', 'Next.js'], tarif: 180, momo: 'Wave', numero: '+221 77 123 45 67', img: 5,
    note: 'Disponible dès la semaine prochaine · Réponse sous 2h en journée.',
    bio: "Développeuse full-stack avec 6 ans d'expérience, spécialisée dans les applications SaaS pour des clients européens. J'ai livré plus de 40 projets : sites vitrines, plateformes e-commerce et applications métiers.",
    services: [
      { titre: 'Site vitrine sur-mesure (Next.js)', description: 'Site rapide, responsive et optimisé SEO, jusqu’à 6 pages, livré clé en main.', prix: 900, delaiJours: 10 },
      { titre: 'Application web SaaS (MVP)', description: 'Développement d’un MVP fonctionnel : authentification, base de données, tableau de bord.', prix: 2400, delaiJours: 25 },
    ],
    reviews: [
      { note: 5, commentaire: 'Travail impeccable, livré en avance. Je recommande vivement.' },
      { note: 5, commentaire: 'Très professionnelle et réactive, communication parfaite en français.' },
      { note: 4, commentaire: 'Bon travail, quelques allers-retours mais résultat au top.' },
    ],
  },
  {
    email: 'koffi.mensah@demo.rf', nom: 'Koffi Mensah', pays: 'Togo', role: 'Designer UI/UX', cat: 'design',
    skills: ['Figma', 'Design System', 'Prototypage'], tarif: 150, momo: 'Moov Money', numero: '+228 90 12 34 56', img: 12,
    bio: "Designer produit passionné par les interfaces sobres et efficaces. J'accompagne les startups européennes de la maquette au design system complet.",
    services: [
      { titre: 'Maquette d’application mobile', description: 'Maquettes haute-fidélité Figma + prototype cliquable, jusqu’à 10 écrans.', prix: 750, delaiJours: 8 },
      { titre: 'Design system complet', description: 'Composants, tokens, documentation : une base design solide et évolutive.', prix: 1500, delaiJours: 15 },
    ],
    reviews: [
      { note: 5, commentaire: 'Des maquettes superbes, exactement ce que je voulais.' },
      { note: 5, commentaire: 'Koffi a un vrai sens du détail. Collaboration fluide.' },
    ],
  },
  {
    email: 'fatou.traore@demo.rf', nom: 'Fatou Traoré', pays: "Côte d'Ivoire", role: 'Experte Marketing Digital', cat: 'marketing',
    skills: ['SEO', 'Google Ads', 'Social Media'], tarif: 140, momo: 'Orange Money', numero: '+225 07 11 22 33', img: 9,
    bio: "Consultante marketing digital depuis 7 ans. Je gère des budgets publicitaires pour des PME françaises et belges avec un ROI moyen de x3,5.",
    services: [
      { titre: 'Audit SEO complet', description: 'Analyse technique, sémantique et concurrentielle + plan d’action priorisé.', prix: 450, delaiJours: 5 },
      { titre: 'Campagne Google Ads (1 mois)', description: 'Création, paramétrage et optimisation de vos campagnes pour un ROI maximal.', prix: 800, delaiJours: 30 },
    ],
    reviews: [
      { note: 5, commentaire: 'Nos ventes ont décollé en deux mois. Bravo !' },
      { note: 5, commentaire: 'Experte qui sait de quoi elle parle. Reporting clair.' },
      { note: 4, commentaire: 'Très bons résultats, je continue avec elle.' },
    ],
  },
  {
    email: 'jeanmarc.nkoulou@demo.rf', nom: 'Jean-Marc Nkoulou', pays: 'Cameroun', role: 'Développeur Mobile', cat: 'dev',
    skills: ['Flutter', 'React Native', 'Firebase'], tarif: 170, momo: 'MTN MoMo', numero: '+237 6 70 12 34 56', img: 13,
    bio: "Spécialiste des applications mobiles cross-platform. Plus de 25 apps publiées sur les stores pour des clients en France, Suisse et Belgique.",
    services: [
      { titre: 'Application mobile Flutter', description: 'App iOS + Android à partir de vos maquettes, publication sur les stores incluse.', prix: 2200, delaiJours: 30 },
    ],
    reviews: [
      { note: 5, commentaire: 'App livrée et publiée sans accroc. Très compétent.' },
      { note: 4, commentaire: 'Bon développeur, disponible et sérieux.' },
    ],
  },
  {
    email: 'aicha.sow@demo.rf', nom: 'Aïcha Sow', pays: 'Bénin', role: 'Monteuse Vidéo & Motion Designer', cat: 'video',
    skills: ['After Effects', 'Premiere Pro', 'Motion'], tarif: 130, momo: 'MTN MoMo', numero: '+229 01 90 11 22', img: 20,
    bio: "Je crée des vidéos qui captent l'attention : publicités, contenus réseaux sociaux, motion design. Livraison rapide et illimitée en révisions.",
    services: [
      { titre: 'Montage vidéo réseaux sociaux', description: 'Vidéo dynamique 30–60s, sous-titres et habillage inclus.', prix: 250, delaiJours: 4 },
      { titre: 'Animation logo (motion)', description: 'Intro animée de votre logo en motion design, formats multiples.', prix: 320, delaiJours: 5 },
    ],
    reviews: [
      { note: 5, commentaire: 'Vidéos magnifiques, livrées rapidement.' },
      { note: 5, commentaire: 'Créative et à l’écoute, un vrai plaisir.' },
    ],
  },
  {
    email: 'moussa.keita@demo.rf', nom: 'Moussa Keïta', pays: 'Mali', role: 'Expert IA & Data', cat: 'ia',
    skills: ['Python', 'Machine Learning', 'Chatbots'], tarif: 200, momo: 'Orange Money', numero: '+223 76 12 34 56', img: 33,
    bio: "Ingénieur IA, je conçois des chatbots, des pipelines de données et des automatisations sur mesure pour les entreprises européennes.",
    services: [
      { titre: 'Chatbot IA sur-mesure', description: 'Assistant conversationnel entraîné sur vos données, intégré à votre site.', prix: 1800, delaiJours: 20 },
      { titre: 'Automatisation & pipeline data', description: 'Scripts et automatisations pour fiabiliser et accélérer vos flux de données.', prix: 1200, delaiJours: 14 },
    ],
    reviews: [
      { note: 5, commentaire: 'Notre chatbot gère 70% des demandes. Excellent travail.' },
      { note: 5, commentaire: 'Expertise pointue, explications claires.' },
    ],
  },
  {
    email: 'salimata.ouedraogo@demo.rf', nom: 'Salimata Ouédraogo', pays: 'Burkina Faso', role: 'Rédactrice Web SEO', cat: 'marketing',
    skills: ['Rédaction SEO', 'Copywriting', 'WordPress'], tarif: 100, momo: 'Orange Money', numero: '+226 70 11 22 33', img: 16,
    bio: "Rédactrice web francophone, je produis des contenus optimisés SEO qui positionnent vos pages en première page de Google.",
    services: [
      { titre: 'Pack 5 articles SEO (1000 mots)', description: 'Articles optimisés, recherche de mots-clés et maillage interne inclus.', prix: 350, delaiJours: 7 },
      { titre: 'Rédaction de page de vente', description: 'Page de vente persuasive et optimisée pour la conversion.', prix: 200, delaiJours: 4 },
    ],
    reviews: [
      { note: 5, commentaire: 'Textes de grande qualité, parfaitement optimisés.' },
      { note: 4, commentaire: 'Bonne plume, respect des délais.' },
      { note: 5, commentaire: 'Nos articles remontent enfin sur Google !' },
    ],
  },
  {
    email: 'david.houngbedji@demo.rf', nom: 'David Houngbédji', pays: 'Bénin', role: 'Designer Graphique & Logos', cat: 'design',
    skills: ['Illustrator', 'Branding', 'Logos'], tarif: 110, momo: 'MTN MoMo', numero: '+229 01 67 88 99', img: 51,
    note: 'Première commande : -10 % sur votre logo 🎨',
    bio: "Créateur d'identités visuelles mémorables : logos, chartes graphiques et supports print pour entreprises et indépendants en Europe.",
    services: [
      { titre: 'Création de logo professionnel', description: '3 propositions, révisions illimitées, fichiers sources livrés.', prix: 300, delaiJours: 5 },
      { titre: 'Identité visuelle complète', description: 'Logo + charte graphique + déclinaisons (cartes, réseaux sociaux).', prix: 650, delaiJours: 10 },
    ],
    reviews: [
      { note: 5, commentaire: 'Un logo qui nous représente parfaitement. Merci !' },
      { note: 5, commentaire: 'Créatif, rapide et très pro.' },
      { note: 5, commentaire: 'Identité visuelle au top, je recommande.' },
    ],
  },
];

const DEMO_CLIENTS = [
  { email: 'client@test.com', prenom: 'Thomas' },
  { email: 'camille.bernard@demo.rf', prenom: 'Camille' },
  { email: 'lucas.martin@demo.rf', prenom: 'Lucas' },
  { email: 'elodie.petit@demo.rf', prenom: 'Élodie' },
];

function portfolioUrls(seed: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/600/450`);
}

// Insère une ligne et renvoie son id.
async function insertReturningId(table: string, row: Record<string, unknown>): Promise<string> {
  const { data, error } = await sb.from(table).insert(row).select('id').single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data as { id: string }).id;
}

async function wipe() {
  // Ordre FK (les CASCADE aident, mais on reste explicite).
  for (const t of ['Review', 'Message', 'Conversation', 'Order', 'Withdrawal', 'PortfolioItem', 'Service', 'Profile', 'User']) {
    const { error } = await sb.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(`wipe ${t}: ${error.message}`);
  }
}

async function main() {
  console.log('🌱 Réinitialisation de la base Supabase…');
  await wipe();

  const hash = await bcrypt.hash('test1234', 10);

  // ----- Clients -----
  const clients: Record<string, string> = {};
  for (const c of DEMO_CLIENTS) {
    clients[c.email] = await insertReturningId('User', {
      email: c.email, passwordHash: hash, prenom: c.prenom, role: 'CLIENT',
    });
  }
  const clientTestId = clients['client@test.com'];
  const clientIds = Object.values(clients);

  // ----- Freelances -----
  const flByNom: Record<string, string> = {};
  for (const f of FREELANCES) {
    const userId = await insertReturningId('User', {
      email: f.email, passwordHash: hash, prenom: f.nom, role: 'FREELANCE',
      pays: f.pays, telephoneMomo: f.numero, operateurMomo: OP_CODE[f.momo],
    });
    flByNom[f.nom] = userId;

    const profileId = await insertReturningId('Profile', {
      userId,
      photoUrl: `https://i.pravatar.cc/300?img=${f.img}`,
      titre: f.role, bio: f.bio, note: f.note ?? null,
      cvUrl: '/uploads/seed-cv.pdf', cvName: `cv-${f.nom.toLowerCase().replace(/[^a-z]/g, '-')}.pdf`,
      skills: JSON.stringify(f.skills), cat: f.cat, tarifJour: f.tarif, estVerifie: true,
    });

    await sb.from('Service').insert(f.services.map((s) => ({ profileId, ...s })));
    await sb.from('PortfolioItem').insert(
      portfolioUrls(f.email.split('@')[0], 3).map((url, i) => ({ profileId, imageUrl: url, ordre: i }))
    );

    let totalGagne = 0;
    let solde = 0;
    for (let i = 0; i < f.reviews.length; i++) {
      const r = f.reviews[i];
      const authorId = clientIds[i % clientIds.length];
      const jours = 5 + i;
      const montant = f.tarif * jours;
      const orderId = await insertReturningId('Order', {
        clientId: authorId, freelanceId: userId, titre: f.services[0]?.titre ?? 'Mission',
        description: 'Mission livrée et validée.', jours, montant,
        commission: Math.round(montant * COMMISSION), statut: 'VALIDEE',
      });
      await sb.from('Review').insert({ orderId, authorId, note: r.note, commentaire: r.commentaire });
      totalGagne += montant;
      solde += montant;
    }
    await sb.from('Profile').update({ totalGagne, soldeDisponible: solde }).eq('id', profileId);
  }

  // ----- Freelance de test : Sékou -----
  const sekouId = await insertReturningId('User', {
    email: 'freelance@test.com', passwordHash: hash, prenom: 'Sékou', role: 'FREELANCE',
    pays: 'Sénégal', telephoneMomo: '+221 78 000 11 22', operateurMomo: 'ORANGE',
  });
  const sekouProfileId = await insertReturningId('Profile', {
    userId: sekouId, photoUrl: 'https://i.pravatar.cc/300?img=68',
    titre: 'Développeur Web & Intégrateur',
    note: 'Disponible immédiatement · Première mission à tarif découverte.',
    bio: "Développeur web front-end et intégrateur, je transforme vos maquettes en sites rapides, responsives et accessibles. Disponible immédiatement pour des missions européennes.",
    cvUrl: '/uploads/seed-cv.pdf', cvName: 'cv-sekou-camara.pdf',
    skills: JSON.stringify(['HTML/CSS', 'JavaScript', 'Vue.js', 'WordPress']),
    cat: 'dev', tarifJour: 120, estVerifie: true,
  });
  await sb.from('Service').insert([
    { profileId: sekouProfileId, titre: 'Intégration de maquette en site responsive', description: 'Intégration fidèle et responsive de vos maquettes Figma en HTML/CSS/JS.', prix: 400, delaiJours: 6 },
    { profileId: sekouProfileId, titre: 'Création de site WordPress', description: 'Site WordPress sur-mesure, optimisé et facile à administrer.', prix: 700, delaiJours: 10 },
  ]);
  await sb.from('PortfolioItem').insert(
    portfolioUrls('sekou', 2).map((url, i) => ({ profileId: sekouProfileId, imageUrl: url, ordre: i }))
  );

  await sb.from('Order').insert([
    { clientId: clientTestId, freelanceId: sekouId, titre: 'Intégration de la nouvelle landing page', description: 'Intégrer la maquette Figma de la page d’accueil.', jours: 7, montant: 840, commission: 84, statut: 'EN_COURS' },
    { clientId: clients['camille.bernard@demo.rf'], freelanceId: sekouId, titre: 'Site vitrine WordPress restaurant', description: 'Site 5 pages avec menu et réservation.', jours: 10, montant: 700, commission: 70, statut: 'LIVREE' },
    { clientId: clients['lucas.martin@demo.rf'], freelanceId: sekouId, titre: 'Intégration emailing responsive', description: 'Template d’email responsive.', jours: 5, montant: 600, commission: 60, statut: 'VALIDEE' },
  ]);
  await sb.from('Profile').update({ totalGagne: 600, soldeDisponible: 600 }).eq('id', sekouProfileId);

  // ----- Conversations de démo -----
  const awaId = flByNom['Awa Diop'];
  const koffiId = flByNom['Koffi Mensah'];

  const conv1 = await insertReturningId('Conversation', { clientId: clientTestId, freelanceId: awaId });
  await sb.from('Message').insert([
    { conversationId: conv1, senderId: awaId, contenu: "Bonjour ! Merci pour votre message. Pouvez-vous m'en dire plus sur votre projet ?", lu: true },
    { conversationId: conv1, senderId: clientTestId, contenu: 'Bonjour Awa, je cherche à refondre mon site vitrine, environ 5 pages.', lu: true },
    { conversationId: conv1, senderId: awaId, contenu: 'Parfait, c’est tout à fait dans mes cordes. Je peux vous livrer en 10 jours. Souhaitez-vous un devis détaillé ?', lu: false },
  ]);

  const conv2 = await insertReturningId('Conversation', { clientId: clientTestId, freelanceId: koffiId });
  await sb.from('Message').insert({
    conversationId: conv2, senderId: koffiId,
    contenu: 'Bonjour, j’ai bien reçu votre brief pour le design de l’application. Je vous prépare les premières maquettes.', lu: false,
  });

  const conv3 = await insertReturningId('Conversation', { clientId: clientTestId, freelanceId: sekouId });
  await sb.from('Message').insert([
    { conversationId: conv3, senderId: clientTestId, contenu: 'Bonjour Sékou, êtes-vous disponible pour intégrer notre nouvelle landing page ?', lu: false },
    { conversationId: conv3, senderId: sekouId, contenu: 'Bonjour ! Oui, je suis disponible cette semaine. Pouvez-vous m’envoyer la maquette ?', lu: true },
  ]);

  console.log('✅ Seed Supabase terminé.');
  console.log(`   ${FREELANCES.length} freelances + 1 freelance de test + ${DEMO_CLIENTS.length} clients.`);
  console.log('   Comptes : client@test.com / freelance@test.com (mot de passe : test1234)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
