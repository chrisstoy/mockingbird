import { env } from '@/../env.mjs';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log:
    env.NODE_ENV === 'development' || env.VECEL_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

export const config = {
  runtime: 'nodejs',
};
