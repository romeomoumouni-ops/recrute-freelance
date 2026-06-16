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

// E-mail simple et branché (validation de profil, réponse du support).
function simpleEmail(
  prenom: string,
  titre: string,
  corps: string,
  ctaLabel: string,
  ctaUrl: string
): { html: string; text: string } {
  const html = `<!doctype html><html><body style="margin:0;background:#f3f4f6;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#111827;padding:20px 24px"><span style="color:#fff;font-size:18px;font-weight:700">RecruteFreelance</span></div>
      <div style="padding:24px">
        <p style="margin:0 0 6px;font-size:16px;color:#111827">Bonjour ${escapeHtml(prenom || '')},</p>
        <p style="margin:0 0 8px;font-size:15px;color:#111827;font-weight:600">${escapeHtml(titre)}</p>
        <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6">${escapeHtml(corps)}</p>
        <a href="${ctaUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:600">${escapeHtml(ctaLabel)}</a>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:12px">recrutefreelance.com</div>
    </div>
  </body></html>`;
  const text = `Bonjour ${prenom || ''},\n\n${titre}\n${corps}\n\n${ctaLabel} : ${ctaUrl}`;
  return { html, text };
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const sb = supabaseAdmin();

  // ---- 1) Messages non lus (>= 2h) ----
  let sent = 0;
  const notifiedIds: string[] = [];
  const { data, error } = await sb.rpc('pending_digest_messages');
  if (error) {
    console.error('[digest] rpc error', error.message);
  } else {
    const rows = (data as DigestRow[]) ?? [];
    const byRecipient = new Map<string, DigestRow[]>();
    for (const r of rows) {
      if (!byRecipient.has(r.recipient_id)) byRecipient.set(r.recipient_id, []);
      byRecipient.get(r.recipient_id)!.push(r);
    }
    for (const [, msgs] of byRecipient) {
      const { subject, html, text } = buildEmail(msgs[0].recipient_prenom ?? '', msgs);
      const ok = await sendEmail({ to: msgs[0].recipient_email, subject, html, text });
      if (ok) {
        sent++;
        notifiedIds.push(...msgs.map((m) => m.message_id));
      }
    }
    if (notifiedIds.length > 0) await sb.rpc('mark_messages_notified', { p_ids: notifiedIds });
  }

  // ---- 2) Validations de profil (approuvé / refusé) non vues (>= 2h) ----
  let validations = 0;
  const { data: vrows } = await sb.rpc('pending_validation_emails');
  const vlist =
    (vrows as { id: string; email: string; prenom: string | null; titre: string; corps: string | null }[]) ?? [];
  const vDone: string[] = [];
  for (const v of vlist) {
    if (!v.email) continue;
    const { html, text } = simpleEmail(
      v.prenom ?? '',
      v.titre,
      v.corps ?? '',
      'Voir mon profil',
      `${SITE_URL}/mon-profil`
    );
    const ok = await sendEmail({ to: v.email, subject: v.titre, html, text });
    if (ok) {
      validations++;
      vDone.push(v.id);
    }
  }
  if (vDone.length > 0) await sb.rpc('mark_notifications_emailed', { p_ids: vDone });

  // ---- 3) Réponses du support non vues (>= 2h) ----
  let support = 0;
  const { data: srows } = await sb.rpc('pending_support_emails');
  const slist =
    (srows as { id: string; userId: string; email: string; prenom: string | null; contenu: string }[]) ?? [];
  const byUser = new Map<string, typeof slist>();
  for (const s of slist) {
    if (!s.email) continue;
    if (!byUser.has(s.userId)) byUser.set(s.userId, []);
    byUser.get(s.userId)!.push(s);
  }
  const sDone: string[] = [];
  for (const [, msgs] of byUser) {
    const corps =
      msgs.length === 1
        ? `Le support vous a répondu : « ${msgs[0].contenu.slice(0, 200)} »`
        : `Le support vous a envoyé ${msgs.length} nouvelles réponses.`;
    const { html, text } = simpleEmail(
      msgs[0].prenom ?? '',
      'Vous avez une réponse du support',
      corps,
      'Ouvrir le chat',
      `${SITE_URL}/aide`
    );
    const ok = await sendEmail({
      to: msgs[0].email,
      subject: 'Réponse du support — RecruteFreelance',
      html,
      text,
    });
    if (ok) {
      support++;
      sDone.push(...msgs.map((m) => m.id));
    }
  }
  if (sDone.length > 0) await sb.rpc('mark_support_emailed', { p_ids: sDone });

  return NextResponse.json({
    messages: notifiedIds.length,
    messageEmails: sent,
    validations,
    support,
  });
}

// Permet un déclenchement manuel/diagnostic protégé par secret.
export async function GET(req: Request) {
  return POST(req);
}
