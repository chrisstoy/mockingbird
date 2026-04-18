import { env } from '@/../env';
import { Resend } from 'resend';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: 'Reset your Mockingbird password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 24 hours.</p>`,
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  verifyUrl: string
) {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: 'Confirm your Mockingbird account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
        <h1 style="font-size:22px;font-weight:700;margin:0 0 12px;">Welcome to Mockingbird</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
          Thanks for signing up! To complete your registration and activate your account,
          please confirm your email address by clicking the button below.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#000;color:#fff;text-decoration:none;
                  font-size:15px;font-weight:600;padding:12px 28px;border-radius:6px;">
          Confirm my email
        </a>
        <p style="font-size:13px;color:#666;margin:24px 0 0;line-height:1.5;">
          This link expires in 24 hours. If you didn't create a Mockingbird account,
          you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
