'use client';

import dynamic from 'next/dynamic';

// DialogManager imports Quill (via TextEditor) which calls document.addEventListener at
// module load time — this crashes SSR. Wrapping with ssr: false keeps it client-only.
// Note: ssr: false is only allowed inside Client Components, not Server Components.
const DialogManagerDynamic = dynamic(
  () => import('./DialogManager.client').then((m) => ({ default: m.DialogManager })),
  { ssr: false }
);

export function DialogManagerWrapper() {
  return <DialogManagerDynamic />;
}
