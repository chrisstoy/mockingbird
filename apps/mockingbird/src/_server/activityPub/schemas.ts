import { z } from 'zod';

export type APUID = string & { __brand: 'APUID' };
/**
 * ID schema for ActivityPub objects
 */
export const APUIDSchema = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);

        // Must use HTTP or HTTPS protocol
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return false;
        }

        // Generally shouldn't have query parameters or fragments
        if (parsedUrl.search || parsedUrl.hash) {
          return false;
        }

        // Common patterns for ActivityPub servers
        // This is a non-exhaustive check that covers common implementations
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

        // Common patterns:
        // /users/username
        // /users/username/statuses/123456
        // /@username
        // /objects/123456
        // /activities/123456
        return (
          // Has some path (not just domain)
          pathSegments.length > 0 &&
          // Not excessively long
          pathSegments.length <= 6
        );
      } catch {
        return false;
      }
    },
    {
      message: 'ActivityPub UID must follow common ActivityPub URL patterns',
    }
  );

export const DateTimeSchema = z.string().datetime();
export const LangStringSchema = z.record(z.string(), z.string()).or(z.string());

/**
 * Supported Activity types
 */
export const APActivityTypeSchema = z.union([
  z.literal('Create'),
  z.literal('Delete'),
  z.literal('Follow'),
  z.literal('Accept'),
  z.literal('Reject'),
]);

export const APObjectSchema = z.union([z.literal('Note'), z.literal('Create')]);

/**
 * Supported Object types
 */
export const APObjectTypeSchema = z.union([
  z.literal('Note'),
  z.literal('Actor'),
  z.literal('Like'),
]);

export const APActivitySchema = z.object({
  '@context': z.string().or(z.string().array()),
  type: APActivityTypeSchema,
  actor: z.string(),
});

export const APImageSchema = z.object({
  type: z.literal('Image'),
  url: z.string().url(),
});

export const APLinkSchema = z.object({
  type: z.literal('Link'),
  href: z.string().url(),
});

export const IconFieldSchema = z.string().or(APImageSchema).or(APLinkSchema);

export const APActorSchema = z.object({
  id: APUIDSchema.optional(),
  preferredUsername: z.string().optional(),
  name: z.string(),
  summary: z.string().optional(),
  icon: IconFieldSchema.or(z.array(IconFieldSchema)).optional(),
  type: z.string().or(z.string().array()).optional(),
  inbox: z.string().url(),
  outbox: z.string().url(),
  followers: z.string().url().optional(),
  following: z.string().url().optional(),
  liked: z.string().url().optional(),
});
