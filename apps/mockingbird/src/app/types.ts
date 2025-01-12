export type RouteParams = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * API Route Context containing the Route parameters
 *
 * For example, the route path `/api/posts/[postId]/comments` called with
 * a request `/api/posts/123/comments` has the context `{ params: { postId: '123' } }`
 */
export type RouteContext = {
  params: Promise<{ [key: string]: string | string[] | undefined }>;
};
