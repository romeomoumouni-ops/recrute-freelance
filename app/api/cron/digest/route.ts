import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Appelé par pg_cron (Supabase) toutes les ~30 min.
// Agrège les messages non lus (>= 2h) en UN seul e-mail récap par destinataire.
// Protégé par un secret partagé (en-tête x-cron-secret ou ?secret=).

interface DigestRow {
  message_id: string;
  recipient_id: string;
  recipient_email: string;
  recipient_prenom: string | null;
  from_prenom: string | null;
  contenu: string | null;
  msg_type: string | null;
  created_at: string;
}

const SITE_URL = 'https://www.recrutefreelance.com';

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('x-cron-secret');
  const url = new URL(req.url);
  const qs = url.searchParams.get('secret');
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return header === secret || qs === secret || bearer === secret;
}

function snippet(row: DigestRow): string {
  const t = (row.contenu ?? '').trim();
  if (row.msg_type === 'DEVIS') return '📋 Vous a envoyé une demande de devis';
  if (row.msg_type === 'DEVIS_OFFER') return '💼 Vous a envoyé un devis à payer';
  if (!t) return 'Nouveau message';
  return t.length > 120 ? t.slice(0, 117) + '…' : t;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmail(prenom: string, rows: DigestRow[]): { subject: string; html: string; text: string } {
  // Regroupe par expéditeur
  const bySender = new Map<string, DigestRow[]>();
  for (const r of rows) {
    const key = r.from_prenom ?? 'Quelqu’un';
    if (!bySender.has(key)) bySender.set(key, []);
    bySender.get(key)!.push(r);
  }
  const total = rows.length;
  const senders = bySender.size;
  const subject =
    total === 1
      ? `Vous avez 1 nouveau message sur RecruteFreelance`
      : `Vous avez ${total} nouveaux messages sur RecruteFreelance`;

  const blocks: string[] = [];
  const textLines: string[] = [];
  for (const [sender, msgs] of bySender) {
    const items = msgs
      .map(
        (m) =>
          `<li style="margin:0 0 6px;color:#374151;font-size:14px;line-height:1.4">${escapeHtml(
            snippet(m)
          )}</li>`
      )
      .join('');
    blocks.push(
      `<div style="margin:0 0 18px">
         <div style="font-weight:600;color:#111827;font-size:15px;margin:0 0 6px">${escapeHtml(
           sender
         )} <span style="color:#6b7280;font-weight:400">· ${msgs.length} message${
        msgs.length > 1 ? 's' : ''
      }</span></div>
         <ul style="margin:0;padding-left:18px">${items}</ul>
       </div>`
    );
    textLines.push(`${sender} (${msgs.length}) :`);
    msgs.forEach((m) => textLines.push(`  - ${snippet(m)}`));
  }

  const html = `<!doctype html><html><body style="margin:0;background:#f3f4f6;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#111827;padding:20px 24px">
        <span style="color:#fff;font-size:18px;font-weight:700">RecruteFreelance</span>
      </div>
      <div style="padding:24px">
        <p style="margin:0 0 4px;font-size:16px;color:#111827">Bonjour ${escapeHtml(prenom || '')},</p>
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280">Vous avez ${total} message${
    total > 1 ? 's' : ''
  } non lu${total > 1 ? 's' : ''} de ${senders} contact${senders > 1 ? 's' : ''} :</p>
        ${blocks.join('')}
        <a href="${SITE_URL}/messages" style="display:inline-block;margin-top:8px;background:#111827;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600">Voir mes messages</a>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px">
        Vous recevez cet e-mail car vous avez des messages non lus sur RecruteFreelance.
      </div>
    </div>
  </body></html>`;

  const text = `Bonjour ${prenom || ''},\n\nVous avez ${total} message(s) non lu(s) :\n\n${textLines.join(
    '\n'
  )}\n\nVoir : ${SITE_URL}/messages`;

  return { subject, html, text };
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc('pending_digest_messages');
  if (error) {
    console.error('[digest] rpc error', error.message);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
  const rows = (data as DigestRow[]) ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ sent: 0, recipients: 0 });
  }

  // Regroupe par destinataire
  const byRecipient = new Map<string, DigestRow[]>();
  for (const r of rows) {
    if (!byRecipient.has(r.recipient_id)) byRecipient.set(r.recipient_id, []);
    byRecipient.get(r.recipient_id)!.push(r);
  }

  let sent = 0;
  const notifiedIds: string[] = [];
  for (const [, msgs] of byRecipient) {
    const to = msgs[0].recipient_email;
    const prenom = msgs[0].recipient_prenom ?? '';
    const { subject, html, text } = buildEmail(prenom, msgs);
    const ok = await sendEmail({ to, subject, html, text });
    if (ok) {
      sent++;
      // On ne marque "notifié" que si l'e-mail est bien parti (sinon on réessaiera au prochain cron).
      notifiedIds.push(...msgs.map((m) => m.message_id));
    }
  }

  if (notifiedIds.length > 0) {
    await sb.rpc('mark_messages_notified', { p_ids: notifiedIds });
  }

  return NextResponse.json({ sent, recipients: byRecipient.size, messages: notifiedIds.length });
}

// Permet un déclenchement manuel/diagnostic protégé par secret.
export async function GET(req: Request) {
  return POST(req);
}
