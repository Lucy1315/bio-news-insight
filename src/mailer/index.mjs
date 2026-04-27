import nodemailer from 'nodemailer';
import { createLogger } from '../util/logger.mjs';

const log = createLogger({ level: process.env.LOG_LEVEL ?? 'info', prefix: '[mailer]' });

export function buildSubject(dateKST, summary) {
  const firstLine = String(summary ?? '').split('\n')[0].trim();
  const truncated = firstLine.length > 60 ? firstLine.slice(0, 60) + '…' : firstLine;
  return `[Bio Daily] ${dateKST} — ${truncated}`;
}

function defaultTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: String(process.env.SMTP_SECURE ?? 'true') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/**
 * @param {{to: string, from: string, subject: string, html: string, text: string, attachments?: any[]}} msg
 * @param {import('nodemailer').Transporter} [transport]
 */
export async function send(msg, transport = defaultTransport()) {
  const delays = [0, 2000, 8000];
  let lastErr;
  for (let i = 0; i < delays.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, delays[i]));
    try {
      const info = await transport.sendMail(msg);
      log.info(`sent messageId=${info.messageId ?? 'n/a'}`);
      return info;
    } catch (err) {
      lastErr = err;
      const transient = /ECONNRESET|ETIMEDOUT|EAI_AGAIN|ESOCKET/.test(err.code ?? '') || (err.responseCode >= 400 && err.responseCode < 500);
      const auth = err.responseCode === 535 || /auth/i.test(err.message ?? '');
      log.warn(`send attempt ${i + 1} failed: ${err.message}`);
      if (auth || !transient) break;
    }
  }
  const e = new Error(`send failed: ${lastErr?.message ?? 'unknown'}`);
  e.exitCode = 1;
  throw e;
}
