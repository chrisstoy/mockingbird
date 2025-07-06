import { z } from 'zod';

export type FeedSource = 'public' | 'private' | string;

export const FeedSourceSchema = z
  .enum(['public', 'private'])
  .or(z.string().cuid2()) // allowing custom feeds by CUID
  .default('public');
