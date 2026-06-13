import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Abstraction de stockage : aujourd'hui disque local, demain S3.
// saveUpload renvoie l'URL publique (servie depuis /uploads).
export async function saveUpload(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || guessExt(file.type);
  const safeBase = path
    .basename(file.name, path.extname(file.name))
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 40);
  const filename = `${safeBase || 'fichier'}-${randomUUID().slice(0, 8)}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

function guessExt(mime: string): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'application/pdf') return '.pdf';
  return '';
}

export const MAX_FILE_MB = 5;

export function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Le fichier doit être une image.';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Image trop volumineuse (max ${MAX_FILE_MB} Mo).`;
  return null;
}

export function validateDoc(file: File): string | null {
  const ok = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!ok.includes(file.type)) return 'Le CV doit être un PDF ou un document Word.';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Fichier trop volumineux (max ${MAX_FILE_MB} Mo).`;
  return null;
}
