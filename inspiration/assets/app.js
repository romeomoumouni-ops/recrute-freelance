/* ===== Données fictives : freelances ===== */
const FREELANCES = [
  { id: 1, nom: 'Awa Diop', pays: 'Sénégal', role: 'Développeuse Web Full-Stack', cat: 'dev',
    skills: ['React', 'Node.js', 'Next.js'], tarif: 180, note: 4.9, avis: 32, momo: 'Wave',
    bio: "Développeuse full-stack avec 6 ans d'expérience, spécialisée dans les applications SaaS pour des clients européens. J'ai livré plus de 40 projets : sites vitrines, plateformes e-commerce et applications métiers." },
  { id: 2, nom: 'Koffi Mensah', pays: 'Togo', role: 'Designer UI/UX', cat: 'design',
    skills: ['Figma', 'Design System', 'Prototypage'], tarif: 150, note: 4.8, avis: 27, momo: 'Moov Money',
    bio: "Designer produit passionné par les interfaces sobres et efficaces. J'accompagne les startups européennes de la maquette au design system complet." },
  { id: 3, nom: 'Fatou Traoré', pays: "Côte d'Ivoire", role: 'Experte Marketing Digital', cat: 'marketing',
    skills: ['SEO', 'Google Ads', 'Social Media'], tarif: 140, note: 4.9, avis: 41, momo: 'Orange Money',
    bio: "Consultante marketing digital depuis 7 ans. Je gère des budgets publicitaires pour des PME françaises et belges avec un ROI moyen de x3,5." },
  { id: 4, nom: 'Jean-Marc Nkoulou', pays: 'Cameroun', role: 'Développeur Mobile', cat: 'dev',
    skills: ['Flutter', 'React Native', 'Firebase'], tarif: 170, note: 4.7, avis: 19, momo: 'MTN MoMo',
    bio: "Spécialiste des applications mobiles cross-platform. Plus de 25 apps publiées sur les stores pour des clients en France, Suisse et Belgique." },
  { id: 5, nom: 'Aïcha Sow', pays: 'Bénin', role: 'Monteuse Vidéo & Motion Designer', cat: 'video',
    skills: ['After Effects', 'Premiere Pro', 'Motion'], tarif: 130, note: 4.8, avis: 23, momo: 'MTN MoMo',
    bio: "Je crée des vidéos qui captent l'attention : publicités, contenus réseaux sociaux, motion design. Livraison rapide et illimitée en révisions." },
  { id: 6, nom: 'Moussa Keïta', pays: 'Mali', role: 'Expert IA & Data', cat: 'ia',
    skills: ['Python', 'Machine Learning', 'Chatbots'], tarif: 200, note: 5.0, avis: 15, momo: 'Orange Money',
    bio: "Ingénieur IA, je conçois des chatbots, des pipelines de données et des automatisations sur mesure pour les entreprises européennes." },
  { id: 7, nom: 'Salimata Ouédraogo', pays: 'Burkina Faso', role: 'Rédactrice Web SEO', cat: 'marketing',
    skills: ['Rédaction SEO', 'Copywriting', 'WordPress'], tarif: 100, note: 4.6, avis: 38, momo: 'Orange Money',
    bio: "Rédactrice web francophone, je produis des contenus optimisés SEO qui positionnent vos pages en première page de Google." },
  { id: 8, nom: 'David Houngbédji', pays: 'Bénin', role: 'Designer Graphique & Logos', cat: 'design',
    skills: ['Illustrator', 'Branding', 'Logos'], tarif: 110, note: 4.9, avis: 52, momo: 'MTN MoMo',
    bio: "Créateur d'identités visuelles mémorables : logos, chartes graphiques et supports print pour entreprises et indépendants en Europe." }
];

const CATEGORIES = {
  dev: 'Développement', design: 'Design', marketing: 'Marketing Digital',
  video: 'Vidéo & Animation', ia: 'Services IA'
};

/* ===== Mini "backend" local (localStorage) ===== */
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem('rf_' + key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('rf_' + key, JSON.stringify(value)); } catch {}
  }
};

function getUser() { return store.get('user', null); }
function setUser(u) { store.set('user', u); }
function logout() { setUser(null); location.href = 'index.html'; }
function getOrders() { return store.get('orders', []); }
function setOrders(o) { store.set('orders', o); }

/* ===== Profil éditable (freelance) ===== */
function getProfil() {
  return store.get('profil', {
    photo: null, titre: '', bio: '', skills: [], services: [], portfolio: [], cv: null
  });
}
function setProfil(p) { store.set('profil', p); }

/* ===== Checklist de vérification ===== */
function getVerifChecks() {
  const user = getUser() || {};
  const p = getProfil();
  return [
    { titre: 'Photo de profil', desc: 'Une photo professionnelle rassure les clients.', ok: !!p.photo, lien: 'mon-profil.html' },
    { titre: 'Titre & présentation', desc: 'Votre métier et une bio d\'au moins 50 caractères.', ok: !!p.titre && (p.bio || '').length >= 50, lien: 'mon-profil.html' },
    { titre: 'Portfolio', desc: 'Au moins 2 réalisations en images.', ok: p.portfolio.length >= 2, lien: 'mon-profil.html' },
    { titre: 'CV ou expérience', desc: 'Votre CV au format PDF.', ok: !!p.cv, lien: 'mon-profil.html' },
    { titre: 'Au moins un service', desc: 'Créez une offre avec un tarif clair.', ok: p.services.length >= 1, lien: 'mon-profil.html' },
    { titre: 'Numéro Mobile Money', desc: 'Pour recevoir vos paiements.', ok: !!(user.momo), lien: 'parametres.html' }
  ];
}
function isVerified() { return getVerifChecks().every(c => c.ok); }

function initiales(nom) {
  return nom.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function euros(n) {
  return n.toLocaleString('fr-FR') + ' €';
}

/* ===== Header dynamique (connecté / non connecté) ===== */
function renderHeaderActions() {
  const el = document.getElementById('header-actions');
  if (!el) return;
  const user = getUser();
  if (user) {
    const profil = getProfil();
    const photo = profil.photo
      ? '<img src="' + profil.photo + '" style="width:34px;height:34px;border-radius:50%;object-fit:cover;vertical-align:middle">'
      : '<span class="avatar" style="width:34px;height:34px;font-size:.7rem;display:inline-flex">' + initiales(user.prenom) + '</span>';
    el.innerHTML =
      '<a class="link-login" href="messagerie.html" title="Messagerie">💬</a>' +
      '<a class="link-login" href="parametres.html" title="Paramètres">⚙️</a>' +
      (user.role === 'freelance' ? '<a class="link-login" href="mon-profil.html">Modifier mon profil</a>' : '') +
      '<a class="link-login" href="' + (user.role === 'freelance' ? 'profil-public.html' : 'dashboard.html') + '" style="display:inline-flex;align-items:center;gap:8px">' + photo + ' ' + user.prenom + '</a>' +
      '<button class="btn btn-outline" onclick="logout()">Déconnexion</button>';
  } else {
    el.innerHTML =
      '<a class="link-login" href="connexion.html">Se connecter</a>' +
      '<a class="btn btn-dark" href="inscription.html">S\'inscrire</a>';
  }
}

/* ===== Toast ===== */
function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ===== Carte freelance (HTML) ===== */
function flCard(f) {
  return '<a class="fl-card" href="freelance.html?id=' + f.id + '">' +
    '<div class="fl-top"><div class="avatar">' + initiales(f.nom) + '</div>' +
    '<div><h3>' + f.nom + '</h3><div class="role">' + f.role + '</div></div></div>' +
    '<div class="fl-meta"><span>📍 ' + f.pays + '</span><span class="badge">' + CATEGORIES[f.cat] + '</span></div>' +
    '<div class="skills">' + f.skills.map(s => '<span class="badge">' + s + '</span>').join('') + '</div>' +
    '<div class="fl-bottom"><span class="price">' + euros(f.tarif) + ' <small>/ jour</small></span>' +
    '<span class="rating">★ ' + f.note.toFixed(1) + ' <small>(' + f.avis + ')</small></span></div></a>';
}

document.addEventListener('DOMContentLoaded', renderHeaderActions);
