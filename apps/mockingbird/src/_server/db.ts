import { env } from '@/../env';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log:
    env.NODE_ENV === 'development' || env.VERCEL_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

export const config = {
  runtime: 'nodejs',
};
