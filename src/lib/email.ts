import nodemailer from "nodemailer";

interface SendMailInput {
  to: string;
  subject: string;
  text: string;
}

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

/** Builds (and caches) the SMTP transporter from env vars. Returns null if not configured. */
function getTransporter() {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    cachedTransporter = null;
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return cachedTransporter;
}

/**
 * Best-effort email send. No-ops (with a console warning, once) if SMTP env vars aren't
 * configured, so callers can fire-and-forget this without forms breaking in environments
 * that haven't set up email yet. Never throws.
 */
export async function sendMail({ to, subject, text }: SendMailInput): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("sendMail skipped: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_FROM not fully configured.");
    return;
  }

  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
  } catch (error) {
    console.error("sendMail failed", error);
  }
}
