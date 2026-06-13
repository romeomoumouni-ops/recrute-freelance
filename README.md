# recrutefreelance.com — MVP

Marketplace qui connecte les **entreprises d'Europe francophone** aux **freelances d'Afrique francophone**, payés directement sur **Mobile Money** (Orange Money, MTN MoMo, Wave, Moov Money).

Modèle : commission de **10 %** payée par le client, fonds séquestrés (escrow) puis libérés au freelance à la validation de la livraison.

---

## Stack technique

| Couche | Choix |
|---|---|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript (strict) |
| Styles | Tailwind CSS + design tokens du prototype (`app/globals.css`) |
| Base de données | **PostgreSQL (Supabase)** via `@supabase/supabase-js`, accès **serveur uniquement** (`lib/supabase.ts`) |
| Auth | NextAuth (Auth.js) — credentials e-mail + mot de passe, sessions JWT, rôles `CLIENT` / `FREELANCE` |
| Upload | Stockage local `public/uploads/` (abstraction `lib/upload.ts`, migrable vers S3) |
| Paiements | **Simulés** — architecture en services `PaymentProvider` / `PayoutProvider` (`lib/payments.ts`), prêts pour Stripe / CinetPay / FedaPay / PawaPay |
| Validation | Zod côté serveur sur toutes les mutations (`lib/validations.ts`) |

---

## Installation

> Prérequis : **Node.js 18+** et npm.

```bash
# 1. Installer les dépendances
npm install

# 2. Renseigner le .env (voir ci-dessous), puis insérer les données de démo
npm run db:seed

# 3. Lancer le serveur de développement
npm run dev
```

L'application tourne sur **http://localhost:3000**.

Le fichier `.env` (gitignore — jamais commité) contient :

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."           # publique (RLS deny-by-default)
SUPABASE_SERVICE_ROLE_KEY="..."               # SECRET, serveur uniquement, jamais NEXT_PUBLIC_
# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

> Le schéma SQL, les vues (`freelance_card`), les fonctions RPC (`get_conversations`, `validate_order`,
> `withdraw`) et le RLS vivent dans Supabase. Les migrations sont des fichiers SQL appliqués via le
> dashboard Supabase / MCP. `prisma/schema.prisma` est conservé comme **référence** du modèle de données.

### Sécurité (Supabase)

- **RLS activé sur toutes les tables, sans policy publique** → la clé anon (publique) ne donne accès à **rien**.
- L'accès aux données est **100 % côté serveur** via la clé `service_role` (secrète) ; l'autorisation
  reste dans le code (chaque route vérifie session + propriété).
- `passwordHash` n'est jamais exposé au client.
- Les opérations sensibles (validation de paiement, retrait) sont des **fonctions RPC atomiques**.

### Scripts utiles

| Script | Effet |
|---|---|
| `npm run dev` | Serveur de développement (localhost:3000) |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run db:seed` | Réinitialise et remplit les données de démo dans Supabase |
| `npm run db:reset` | `db:push --force-reset` + `db:seed` |

---

## Comptes de test

Mot de passe commun : **`test1234`**

| Compte | Rôle | Notes |
|---|---|---|
| `client@test.com` | Entreprise / Client | Missions en cours, à valider, avis à laisser |
| `freelance@test.com` | Freelance (Sékou Camara) | Profil vérifié, solde, missions reçues, retrait Mobile Money |

Les 8 freelances de démo sont aussi connectables (`prenom.nom@demo.rf`, mot de passe `test1234`) — ex. `awa.diop@demo.rf`.

---

## Pages

| Route | Description |
|---|---|
| `/` | Accueil (hero, recherche, services, promesses, étapes, CTA) |
| `/recherche` | Recherche de freelances — filtres temps réel (texte, catégorie, pays, tarif, tri), URL synchronisée |
| `/freelance/[id]` | Profil public : à propos, compétences, services, portfolio, avis, encart commande + tunnel de paiement simulé. Aperçu pour le freelance propriétaire |
| `/inscription` · `/connexion` | Création de compte (entreprise / freelance) et connexion |
| `/mon-profil` | Édition du profil freelance : photo, bio, compétences, services, portfolio, CV, progression de vérification |
| `/parametres` | Vérification du profil, compte, paiement Mobile Money, notifications |
| `/dashboard` | Tableau de bord — vue client (valider une livraison, laisser un avis) et vue freelance (marquer livrée, retrait Mobile Money) |
| `/messages` | Messagerie 2 colonnes, responsive mobile, envoi temps réel (optimistic + polling), compteur de non-lus |

---

## Vérification du profil freelance (`estVerifie`)

Calculée automatiquement quand les **6 critères** sont remplis (`lib/verification.ts`) :
photo de profil · titre + bio ≥ 50 caractères · ≥ 2 éléments de portfolio · CV · ≥ 1 service · numéro Mobile Money.

---

## Structure du projet

```
app/
  page.tsx                  Accueil
  layout.tsx                Layout global (header, footer, providers, toaster)
  (recherche|freelance|…)/  Pages (Server Components + sous-composants client)
  api/                      Routes serveur (auth, register, orders, messages, …)
components/
  Header, Footer, Avatar, FreelanceCardLink, Toaster, HomeSearch
  order/                    Tunnel de commande (provider + boutons)
lib/
  prisma, auth, constants, utils, validations, verification,
  freelancers, conversations, payments, upload, profile-server
prisma/
  schema.prisma             Modèle de données
  seed.ts                   Données de démo
public/uploads/             Fichiers uploadés (photos, portfolio, CV)
```

---

## Hors périmètre du MVP

Paiements réels, e-mails réels, WebSockets, back-office admin, multi-langue, facturation PDF, litiges/remboursements, application mobile.

> Le design suit fidèlement le prototype de référence du dossier `inspiration/` (noir / blanc / gris, accent vert `#1a7f4e`, typographie Montserrat).
