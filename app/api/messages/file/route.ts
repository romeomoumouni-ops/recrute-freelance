import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { assertMember } from '@/lib/conversations';
import { saveUpload, validateAnyFile } from '@/lib/upload';
import { heureCourte } from '@/lib/utils';

// Envoi d'un fichier (tout type) dans une conversation — sert notamment au
// freelance pour livrer son travail au client.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  if (session.user.banni) return NextResponse.json({ error: 'Compte suspendu.' }, { status: 403 });

  const form = await req.formData();
  const file = form.get('file');
  const conversationId = String(form.get('conversationId') ?? '');
  if (!conversationId) return NextResponse.json({ error: 'Conversation manquante.' }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });

  const err = validateAnyFile(file);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const conv = await assertMember(conversationId, session.user.id);
  if (!conv) return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 });

  const url = await saveUpload(file);
  const meta = JSON.stringify({ url, name: file.name, size: file.size });

  const { data: msg, error } = await supabaseAdmin()
    .from('Message')
    .insert({
      conversationId,
      senderId: session.user.id,
      type: 'FILE',
      meta,
      contenu: `📎 ${file.name}`,
    })
    .select('id, contenu, createdAt')
    .single();
  if (error || !msg) return NextResponse.json({ error: 'Envoi impossible.' }, { status: 500 });

  const m = msg as { id: string; contenu: string; createdAt: string };
  return NextResponse.json({
    message: { id: m.id, mine: true, contenu: m.contenu, type: 'FILE', meta, heure: heureCourte(m.createdAt) },
  });
}
