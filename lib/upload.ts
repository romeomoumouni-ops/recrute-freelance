import { randomUUID } from 'crypto';
import path from 'path';
import { supabaseAdmin } from './supabase';

const BUCKET = 'uploads';
export const MAX_FILE_MB = 5;
// Limite des fichiers de livraison (chat) : sous le plafond de 4,5 Mo des
// fonctions serverless Vercel.
export const MAX_DELIVERY_MB = 4;

// Stockage des fichiers dans Supabase Storage (fonctionne sur Vercel, contrairement au
// système de fichiers local en lecture seule). Renvoie l'URL publique.
export async function saveUpload(file: File): Promise<string> {
  const ext = path.extname(file.name) || guessExt(file.type);
  const safeBase = path
    .basename(file.name, path.extname(file.name))
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 40);
  const filename = `${safeBase || 'fichier'}-${randomUUID().slice(0, 8)}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const sb = supabaseAdmin();
  // Sécurité : le bucket est public. On ne sert en inline QUE les types image sûrs
  // (jamais SVG/HTML/XML, qui pourraient exécuter du JS). Tout le reste est servi
  // en application/octet-stream → le navigateur télécharge le fichier au lieu de
  // l'exécuter. Empêche le XSS stocké via un Content-Type contrôlé par l'uploadeur.
  const SAFE_INLINE = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  const contentType = SAFE_INLINE.includes(file.type) ? file.type : 'application/octet-stream';
  const { error } = await sb.storage.from(BUCKET).upload(filename, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Upload échoué : ${error.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

const SAFE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function guessExt(mime: string): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  if (mime === 'application/pdf') return '.pdf';
  return '';
}

export function validateImage(file: File): string | null {
  // Whitelist stricte (pas de SVG : peut contenir du JavaScript).
  if (!SAFE_IMAGE_TYPES.includes(file.type)) return 'Image invalide (JPG, PNG, WEBP ou GIF).';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Image trop volumineuse (max ${MAX_FILE_MB} Mo).`;
  return null;
}

// Livraison dans le chat : tout type de fichier accepté, taille limitée.
export function validateAnyFile(file: File): string | null {
  if (file.size === 0) return 'Fichier vide.';
  if (file.size > MAX_DELIVERY_MB * 1024 * 1024)
    return `Fichier trop volumineux (max ${MAX_DELIVERY_MB} Mo).`;
  return null;
}

export function validateDoc(file: File): string | null {
  const okMime = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  // Certains navigateurs n'envoient pas (ou mal) le type MIME : on accepte aussi par extension.
  const name = (file.name || '').toLowerCase();
  const okExt = name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx');
  if (!okMime.includes(file.type) && !okExt) {
    return 'Le CV doit être un PDF ou un document Word (.pdf, .doc, .docx).';
  }
  if (file.size === 0) return 'Fichier vide.';
  // Plafond ~4,5 Mo des fonctions serverless Vercel : on reste sous la limite.
  if (file.size > MAX_DELIVERY_MB * 1024 * 1024)
    return `Fichier trop volumineux (max ${MAX_DELIVERY_MB} Mo).`;
  return null;
}
