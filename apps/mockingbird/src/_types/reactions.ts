import { z } from 'zod';
import { UserIdSchema } from './ids';

export const ReactionTypeSchema = z.enum([
  'THUMBS_UP',
  'THUMBS_DOWN',
  'CHEER',
  'ANGER',
  'LAUGH',
  'HUGS',
]);
export type ReactionType = z.infer<typeof ReactionTypeSchema>;

export const PostReactionUserSchema = z.object({
  id: UserIdSchema,
  name: z.string(),
  image: z.string().nullable(),
});
export type PostReactionUser = z.infer<typeof PostReactionUserSchema>;

export const PostReactionSummarySchema = z.object({
  type: ReactionTypeSchema,
  count: z.number(),
  users: z.array(PostReactionUserSchema),
});
export type PostReactionSummary = z.infer<typeof PostReactionSummarySchema>;

export const SetReactionSchema = z.object({
  reaction: ReactionTypeSchema,
});
export type SetReaction = z.infer<typeof SetReactionSchema>;
