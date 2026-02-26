'use client';

import { ErrorBoundary } from 'react-error-boundary';
import { type PropsWithChildren } from 'react';

function renderError({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Unhandle Error When Loading Page</p>
      <pre style={{ color: 'red' }}>{JSON.stringify(error, null, 2)}</pre>
    </div>
  );
}

export function AppErrorBoundary({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary fallbackRender={renderError}>{children}</ErrorBoundary>
  );
}
