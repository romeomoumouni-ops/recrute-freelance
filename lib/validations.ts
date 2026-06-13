import { z } from 'zod';
import { CATEGORIES, OPERATEUR_LABEL } from './constants';

export const registerSchema = z
  .object({
    prenom: z.string().trim().min(1, 'Le prénom est requis.').max(60),
    email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.'),
    password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères.'),
    role: z.enum(['CLIENT', 'FREELANCE']),
    pays: z.string().trim().optional(),
    telephoneMomo: z.string().trim().optional(),
  })
  .refine((d) => d.role !== 'FREELANCE' || (d.pays && d.pays.length > 0), {
    message: 'Le pays est requis pour un compte freelance.',
    path: ['pays'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

// ----- Profil -----
export const profileSchema = z.object({
  titre: z.string().trim().max(120).optional().default(''),
  bio: z.string().trim().max(2000).optional().default(''),
  note: z.string().trim().max(280).optional().default(''),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  cat: z.string().trim().optional(),
});

export const serviceSchema = z.object({
  titre: z.string().trim().min(1, 'Titre requis.').max(120),
  description: z.string().trim().max(1000).optional().default(''),
  prix: z.coerce.number().positive('Le prix doit être positif.'),
  delaiJours: z.coerce.number().int().positive().max(365).optional().default(7),
});

// ----- Commande -----
export const orderSchema = z.object({
  freelanceId: z.string().min(1),
  serviceId: z.string().optional(),
  titre: z.string().trim().min(1, 'Donnez un titre à votre mission.').max(160),
  description: z.string().trim().max(2000).optional().default(''),
  jours: z.coerce.number().int().min(1).max(60),
});

// ----- Avis -----
export const reviewSchema = z.object({
  orderId: z.string().min(1),
  note: z.coerce.number().int().min(1).max(5),
  commentaire: z.string().trim().max(1000).optional().default(''),
});

// ----- Retrait -----
export const withdrawalSchema = z.object({
  montant: z.coerce.number().positive('Montant invalide.'),
  operateur: z.enum(['ORANGE', 'MTN', 'WAVE', 'MOOV']),
  numero: z.string().trim().min(1, 'Numéro requis.'),
});

// ----- Paramètres -----
export const compteSchema = z.object({
  prenom: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email(),
  pays: z.string().trim().optional(),
});

export const momoSchema = z.object({
  telephoneMomo: z.string().trim().optional().default(''),
  operateurMomo: z.enum(['ORANGE', 'MTN', 'WAVE', 'MOOV']).optional(),
});

export const notifSchema = z.object({
  messages: z.boolean(),
  missions: z.boolean(),
  paiements: z.boolean(),
  newsletter: z.boolean(),
});

// ----- Message -----
export const messageSchema = z.object({
  conversationId: z.string().min(1),
  contenu: z.string().trim().min(1, 'Message vide.').max(2000),
});

export const conversationSchema = z.object({
  freelanceId: z.string().min(1),
});

// helpers de validation de valeurs connues (utilisés ici et là)
export function isValidCat(c: string | undefined | null): boolean {
  return !!c && c in CATEGORIES;
}
export function isValidOperateur(o: string | undefined | null): boolean {
  return !!o && o in OPERATEUR_LABEL;
}
