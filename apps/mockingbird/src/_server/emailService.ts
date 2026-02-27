import { Resend } from 'resend';
import { env } from '@/../env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: 'Reset your Mockingbird password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 24 hours.</p>`,
  });
}
