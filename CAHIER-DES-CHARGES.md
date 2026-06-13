# Cahier des charges — recrutefreelance.com (MVP)

> **Document destiné à Claude Code.** Tu vas développer l'intégralité de ce projet en suivant ce cahier des charges. Lis-le entièrement avant d'écrire la moindre ligne de code.

---

## 1. Contexte et vision

**recrutefreelance.com** est une marketplace qui connecte :

- **Côté demande** : entreprises et particuliers d'Europe francophone (France, Belgique, Suisse, Luxembourg) qui cherchent des freelances qualifiés à des tarifs plus rentables que le marché européen (jusqu'à -60 %).
- **Côté offre** : freelances d'Afrique francophone (Bénin, Sénégal, Côte d'Ivoire, Togo, Cameroun, Mali, Burkina Faso, etc.) qui veulent accéder à des clients européens et **être payés directement sur leur Mobile Money** (Orange Money, MTN MoMo, Wave, Moov Money), sans compte bancaire international.

**La double promesse :**
1. Pour l'Europe : des talents vérifiés, même langue, fuseaux horaires quasi identiques, budgets maîtrisés.
2. Pour l'Afrique : des missions européennes, paiement direct sur Mobile Money.

**Modèle économique :** commission de 10 % sur chaque mission, payée par le client. Les fonds sont séquestrés (escrow) et libérés au freelance à la validation de la livraison.

---

## 2. Référence design OBLIGATOIRE : le dossier `inspiration/`

Dans le dossier de travail se trouve un dossier **`inspiration/`** contenant un prototype HTML complet et fonctionnel de toutes les pages (10 pages + CSS + JS). **C'est la référence absolue.**

Règles :

- **Reste 100 % fidèle** à la direction artistique du prototype : design sobre **noir / blanc / gris**, accent vert uniquement pour les statuts de succès (`#1a7f4e`), typographie **Montserrat** (Google Fonts, poids 400 à 800).
- Reprends les variables CSS de `inspiration/assets/styles.css` (couleurs, rayons, espacements) comme design tokens.
- Reprends la structure, les sections, les textes et les composants de chaque page HTML du prototype. Tu peux améliorer les détails (transitions, états vides, loading) mais pas changer l'identité visuelle ni la structure des pages.
- **Mobile-first obligatoire** : chaque page doit être impeccable sur mobile (~390 px), tablette et desktop. Le prototype contient déjà les comportements responsive attendus (ex : messagerie liste/conversation sur mobile).
- Tout le produit est **en français**.

Ouvre et étudie chaque fichier de `inspiration/` avant de développer la page correspondante.

---

## 3. Stack technique imposée

| Couche | Choix | Remarques |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | Projet à créer à la racine du dossier de travail |
| Langage | **TypeScript** | Strict |
| Styles | **Tailwind CSS** | Configurer les design tokens du prototype (couleurs, Montserrat, radius) dans la config Tailwind |
| Base de données | **SQLite via Prisma** | Simple pour le MVP local ; schéma migrable vers PostgreSQL plus tard |
| Auth | **NextAuth (Auth.js) — credentials e-mail + mot de passe** | Sessions, rôles `CLIENT` / `FREELANCE` |
| Upload fichiers | Stockage local `public/uploads/` pour le MVP | Photos de profil, portfolio, CV (abstraction propre pour migrer vers S3 plus tard) |
| Paiements | **Simulés** pour le MVP | Architecture en services : `PaymentProvider` (carte, futur Stripe) et `PayoutProvider` (Mobile Money, futur API CinetPay/FedaPay/PawaPay). Implémentations mock pour l'instant |
| Validation | Zod | Côté serveur sur toutes les mutations |

**Serveur de développement :** le projet doit tourner avec `npm run dev` sur **http://localhost:3000**. Lance-le tôt et garde-le fonctionnel en permanence : le fondateur suit l'avancement en temps réel dans son navigateur et te donnera des corrections au fur et à mesure.

---

## 4. Méthode de travail demandée

1. **Initialise** le projet (Next.js, Tailwind, Prisma, NextAuth), configure les design tokens, la police Montserrat, le layout global (header/footer du prototype). Vérifie que `localhost:3000` fonctionne.
2. **Développe ensuite page par page**, dans l'ordre du plan de développement (§ 8). Pour chaque page :
   - étudie le fichier correspondant dans `inspiration/` ;
   - implémente la page complète (UI + logique serveur + données réelles) ;
   - vérifie le rendu mobile et desktop ;
   - annonce que la page est prête à être revue sur localhost avant de passer à la suivante.
3. **Seed la base** avec des données de démo réalistes : reprends les 8 freelances fictifs définis dans `inspiration/assets/app.js` (noms, pays, métiers, tarifs, notes, bios) + 2 comptes de test (`client@test.com` / `freelance@test.com`, mot de passe `test1234`).
4. Commits Git réguliers et messages clairs à chaque page terminée.
5. Code propre : composants réutilisables (`Button`, `Badge`, `Card`, `Modal`, `Toast`…), pas de duplication, Server Components par défaut, Server Actions pour les mutations.

---

## 5. Modèle de données (Prisma)

```
User        : id, email (unique), passwordHash, prenom, role (CLIENT | FREELANCE),
              pays?, telephoneMomo?, operateurMomo? (ORANGE | MTN | WAVE | MOOV),
              createdAt
Profile     : userId (1-1 User FREELANCE), photoUrl?, titre?, bio?, cvUrl?,
              skills (relation ou JSON), estVerifie (bool, calculé), soldeDisponible, totalGagne
Service     : id, profileId, titre, description, prix (€), delaiJours, createdAt
PortfolioItem : id, profileId, imageUrl, ordre
Order       : id, clientId, freelanceId, serviceId?, titre, description, jours,
              montant, commission, statut (EN_ATTENTE | EN_COURS | LIVREE | VALIDEE | PAYEE | ANNULEE),
              createdAt, updatedAt
Conversation: id, clientId, freelanceId, createdAt
Message     : id, conversationId, senderId, contenu, lu (bool), createdAt
Review      : id, orderId, note (1-5), commentaire, createdAt
Withdrawal  : id, freelanceId, montant, operateur, numero, statut (EFFECTUE), createdAt
```

La **vérification du profil** (`estVerifie`) est vraie quand les 6 critères sont remplis : photo de profil, titre + bio ≥ 50 caractères, ≥ 2 éléments de portfolio, CV uploadé, ≥ 1 service créé, numéro Mobile Money renseigné.

---

## 6. Pages et fonctionnalités du MVP

Chaque page ci-dessous a son équivalent dans `inspiration/` — même structure, même DA.

### 6.1 Accueil — `/` (réf. `inspiration/index.html`)
- Hero avec image sombre, titre, barre de recherche (redirige vers `/recherche?q=`), chips de catégories.
- Bandeau stats (-60 %, Mobile Money, 100 % francophone).
- Grille « Services populaires » (4 cartes catégories, 1 carte noire).
- Double section promesse Entreprises / Freelances.
- « Comment ça marche » en 3 étapes.
- CTA final + footer complet.
- Header dynamique : visiteur → Se connecter / S'inscrire ; connecté → icônes messagerie + paramètres, avatar/photo, nom, déconnexion (réf. `app.js > renderHeaderActions`).

### 6.2 Inscription — `/inscription` (réf. `inscription.html`)
- Switch « Je suis une entreprise / Je suis freelance » (pré-sélectionnable via `?role=freelance`).
- Champs communs : prénom, e-mail, mot de passe. Freelance en plus : pays (liste Afrique francophone), numéro Mobile Money + opérateur.
- Création du compte (hash bcrypt), connexion automatique, redirection dashboard avec toast de bienvenue.

### 6.3 Connexion — `/connexion` (réf. `connexion.html`)
- E-mail + mot de passe, gestion d'erreurs propre, redirection selon rôle.

### 6.4 Recherche de freelances — `/recherche` (réf. `recherche.html`)
- Bandeau noir de titre.
- Filtres temps réel : texte libre (nom, compétence, métier), catégorie, pays, tarif max, tri (mieux notés / prix croissant / prix décroissant).
- Cartes freelance : avatar/photo, nom, métier, pays, catégorie, compétences, tarif/jour, note moyenne + nombre d'avis. Lien vers le profil public.
- Compteur de résultats, état vide soigné. Filtres synchronisés dans l'URL (`?q=&cat=`).

### 6.5 Profil public d'un freelance — `/freelance/[id]` (réf. `freelance.html` + `profil-public.html`)
- Photo, nom, titre, pays, note + avis, badge « ✓ Freelance approuvé » si vérifié.
- Sections : À propos, Compétences, **Mes services** (créés par le freelance, avec prix et bouton Commander), Portfolio (images), mention paiement Mobile Money.
- Encart latéral sticky : « À partir de X € », statut vérification, boutons **Contacter** (ouvre/crée la conversation) et **Commander**.
- **Tunnel de commande** en modal, 2 étapes (réf. `freelance.html`) : 1) brief (titre + description + durée) ; 2) récapitulatif (montant, frais 10 %, total) + paiement carte **simulé** → création de l'Order en statut EN_COURS, fonds « séquestrés », écran de succès.

### 6.6 Dashboard — `/dashboard` (réf. `dashboard.html`)
- **Vue client** : stats (missions en cours, total missions, total investi) + tableau des missions (titre, freelance, montant, date, statut). Action « Valider la livraison » → statut VALIDEE, crédit du montant net sur le solde du freelance, toast de confirmation « fonds envoyés sur le Mobile Money ».
- **Vue freelance** : stats (solde disponible — carte noire, total gagné, missions reçues) + tableau des missions reçues. Le freelance peut marquer une mission « Livrée ».
- **Retrait Mobile Money** (freelance, modal) : choix opérateur (Orange Money, MTN MoMo, Wave, Moov Money), numéro pré-rempli, montant, conversion FCFA affichée (taux 655,96), confirmation simulée + enregistrement du Withdrawal.

### 6.7 Messagerie — `/messages` (réf. `messagerie.html`)
- Layout 2 colonnes : liste des conversations (avatar, nom, aperçu dernier message, heure) + fil de discussion.
- Mobile : liste plein écran → conversation plein écran avec bouton retour.
- Envoi de messages en temps réel côté UI (optimistic update + polling ou refresh léger ; pas besoin de WebSocket pour le MVP).
- Compteur de messages non lus dans le header (badge sur l'icône 💬).
- Une conversation se crée depuis le bouton « Contacter » d'un profil ou automatiquement à la première commande.

### 6.8 Mon profil (édition, freelance) — `/mon-profil` (réf. `mon-profil.html`)
- Upload **photo de profil** (préviews, suppression) — visible aussi dans le header.
- Titre professionnel + bio (compteur de caractères, minimum 50 pour la vérification).
- **Compétences** : ajout/suppression de tags.
- **Services** : création (titre, description, prix, délai), liste, suppression. *Tout service créé apparaît immédiatement sur le profil public.*
- **Portfolio** : upload multiple d'images, grille de prévisualisation, suppression.
- **CV** : upload PDF/Word, affichage du fichier chargé.
- Barre sticky en bas : progression de la vérification (x/6 critères) + bouton Enregistrer.

### 6.9 Aperçu du profil public — accessible au freelance (réf. `profil-public.html`)
- Quand le freelance clique sur son nom dans le header → son profil public `/freelance/[sonId]` avec un **bandeau « Aperçu de votre profil public »** + bouton « Modifier mon profil » (visible uniquement par lui).

### 6.10 Paramètres — `/parametres` (réf. `parametres.html`)
- Navigation latérale par onglets (horizontale scrollable sur mobile).
- **Vérification du profil** (freelance uniquement) : bannière de statut (vérifié ✓ / en attente ⏳), barre de progression, checklist des 6 critères avec liens « Compléter → » vers la bonne page. Badge « Freelance approuvé » activé automatiquement quand tout est rempli.
- **Compte** : prénom, e-mail, pays, type de compte (lecture seule).
- **Paiement** (freelance) : numéro Mobile Money + opérateur.
- **Notifications** : toggles (messages, missions, paiements, newsletter) persistés.

### 6.11 Avis (transverse)
- Après validation d'une livraison, le client peut laisser une note (1-5) + commentaire.
- La note moyenne et le nombre d'avis s'affichent sur les cartes de recherche et le profil public.

---

## 7. Hors périmètre du MVP (ne pas développer)

- Paiements réels (Stripe, CinetPay, PawaPay…) — uniquement les mocks avec architecture prête.
- Notifications e-mail réelles, WebSockets/temps réel avancé.
- Back-office admin complet (la vérification est automatique par critères pour le MVP).
- Multi-langue, facturation PDF, litiges/remboursements, app mobile.

---

## 8. Plan de développement (ordre imposé, page par page)

1. **Setup** : projet, Tailwind + tokens, Prisma + schéma + seed, NextAuth, layout global (header/footer), `localhost:3000` opérationnel.
2. Accueil `/`
3. Inscription `/inscription` + Connexion `/connexion`
4. Recherche `/recherche`
5. Profil public `/freelance/[id]` (sans commande)
6. Mon profil `/mon-profil` (uploads, services, portfolio) + aperçu public
7. Paramètres `/parametres` (avec vérification)
8. Tunnel de commande + paiement simulé
9. Dashboard `/dashboard` (2 vues) + retrait Mobile Money
10. Messagerie `/messages`
11. Avis + polissage final (états vides, loading, erreurs, responsive, SEO de base)

À chaque étape : page fonctionnelle, testée sur mobile et desktop, visible sur localhost, **puis attends mes retours avant d'enchaîner** si je suis en train de te suivre ; sinon continue et liste ce qui est prêt à reviewer.

---

## 9. Critères de qualité / définition de « terminé »

- `npm run dev` démarre sans erreur ; aucune erreur console navigateur.
- Données 100 % réelles (DB) — aucun contenu codé en dur hors seed.
- Fidélité visuelle au prototype `inspiration/` vérifiable page par page.
- Responsive impeccable (390 px / 768 px / 1280 px).
- Formulaires : validation Zod serveur + messages d'erreur en français.
- Routes protégées : redirection vers `/connexion` si non authentifié ; pages freelance inaccessibles aux clients et inversement.
- Accessibilité de base : labels, alt, contrastes, navigation clavier sur les modals.
- SEO de base : metadata par page, titres hiérarchisés.
- README à la racine : installation, comptes de test, structure du projet.
