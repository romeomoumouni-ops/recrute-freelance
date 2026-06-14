import 'server-only';

// Envoi d'e-mails transactionnels via l'API Resend (https://resend.com).
// On appelle l'API REST directement (pas de SDK) pour rester léger.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const RESEND_BATCH_ENDPOINT = 'https://api.resend.com/emails/batch';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface BatchResult {
  sent: number;
  failed: number;
  error?: string;
}

// Envoi en masse fiable via l'API batch de Resend (jusqu'à 100 e-mails par requête).
// Évite les centaines d'appels séquentiels qui font expirer la fonction serverless.
export async function sendEmailBatch(emails: SendEmailInput[]): Promise<BatchResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY manquant');
    return { sent: 0, failed: emails.length, error: 'RESEND_API_KEY manquant côté serveur.' };
  }
  if (emails.length === 0) return { sent: 0, failed: 0 };
  const from = process.env.DIGEST_FROM || 'RecruteFreelance <onboarding@resend.dev>';

  let sent = 0;
  let failed = 0;
  let firstError: string | undefined;

  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100).map((e) => ({
      from,
      to: e.to,
      subject: e.subject,
      html: e.html,
      ...(e.text ? { text: e.text } : {}),
    }));
    try {
      const res = await fetch(RESEND_BATCH_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });
      if (res.ok) {
        sent += chunk.length;
      } else {
        failed += chunk.length;
        const body = await res.text().catch(() => '');
        console.error('[email] échec batch Resend', res.status, body);
        if (!firstError) firstError = `Resend ${res.status} : ${body.slice(0, 300)}`;
      }
    } catch (e) {
      failed += chunk.length;
      console.error('[email] erreur réseau batch Resend', e);
      if (!firstError) firstError = 'Erreur réseau lors de l’appel à Resend.';
    }
  }
  return { sent, failed, error: firstError };
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY manquant');
    return false;
  }
  const from = process.env.DIGEST_FROM || 'RecruteFreelance <onboarding@resend.dev>';

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[email] échec Resend', res.status, body);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[email] erreur réseau Resend', e);
    return false;
  }
}
