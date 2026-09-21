import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let warnedOnce = false;

function getTransporter(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (!warnedOnce) {
      console.warn(
        "[mailer] SMTP_HOST/SMTP_USER/SMTP_PASS not set — emails will be logged to the " +
          "console instead of sent. Set these in backend/.env to send real email."
      );
      warnedOnce = true;
    }
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: Number(SMTP_PORT ?? 587) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

// Every place in the app that needs to send email — quote requests,
// negotiation sends, missing-spec follow-ups, password reset, email
// verification — goes through this one function, so there's exactly one
// place that decides "real SMTP" vs. "log it" rather than each call site
// re-implementing the fallback.
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer:not-configured] to=${to} subject="${subject}"\n${body}`);
    return;
  }
  await t.sendMail({ from: process.env.MAIL_FROM ?? "no-reply@procurement.example", to, subject, text: body });
}
