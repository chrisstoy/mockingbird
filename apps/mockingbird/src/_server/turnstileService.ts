import { env } from '@/../env';
import baseLogger from './logger';

const logger = baseLogger.child({
  service: 'turnstile:service',
});

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstile(token: string) {
  const secretKey = env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    logger.error('TURNSTILE_SECRET_KEY is not set');
    return false;
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const data: TurnstileResponse = await response.json();
    return data.success;
  } catch (error) {
    logger.error('Turnstile verification error:', error);
    return false;
  }
}
