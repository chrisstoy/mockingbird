import { env } from '@/../env';
import { PrismaClient } from '../../prisma/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({
  adapter,
  log:
    env.NODE_ENV === 'development' || env.VERCEL_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

export const config = {
  runtime: 'nodejs',
};
