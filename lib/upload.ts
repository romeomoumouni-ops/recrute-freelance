import { randomUUID } from 'crypto';
import path from 'path';
import { supabaseAdmin } from './supabase';

const BUCKET = 'uploads';
export const MAX_FILE_MB = 5;

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
  const { error } = await sb.storage.from(BUCKET).upload(filename, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw new Error(`Upload échoué : ${error.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

function guessExt(mime: string): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  if (mime === 'application/pdf') return '.pdf';
  return '';
}

export function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Le fichier doit être une image.';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Image trop volumineuse (max ${MAX_FILE_MB} Mo).`;
  return null;
}

export function validateDoc(file: File): string | null {
  const ok = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!ok.includes(file.type)) return 'Le CV doit être un PDF ou un document Word.';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Fichier trop volumineux (max ${MAX_FILE_MB} Mo).`;
  return null;
}
