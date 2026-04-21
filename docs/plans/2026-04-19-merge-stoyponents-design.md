# Design: Merge stoyponents into mockingbird

**Date:** 2026-04-19  
**Status:** Approved

## Summary

Dissolve the `stoyponents` Nx library and move its components directly into `apps/mockingbird/src/_components/`. The library is single-consumer and too app-specific to justify a separate package.

## What Moves Where

| Source | Destination |
|--------|-------------|
| `stoyponents/src/lib/dialog/` | `apps/mockingbird/src/_components/dialog/` |
| `stoyponents/src/lib/editor/` | `apps/mockingbird/src/_components/editor/` |
| `stoyponents/src/lib/form/` | `apps/mockingbird/src/_components/form/` |
| `stoyponents/src/lib/menu/` | `apps/mockingbird/src/_components/menu/` |

## Import Updates

All 18 import sites currently using `@mockingbird/stoyponents` will be updated to use `@/_components/<subfolder>` (e.g. `import { TextDisplay } from '@/_components/editor'`), matching existing mockingbird conventions.

Affected files:
- `src/_components/Comment.tsx`
- `src/_components/CommentReply.client.tsx`
- `src/_components/CommentReplyContainer.client.tsx`
- `src/_components/PostMenu.client.tsx`
- `src/_components/PostView.tsx`
- `src/_components/SelectImageDialog.client.tsx`
- `src/_components/SummaryPost.tsx`
- `src/_components/UserButton.client.tsx`
- `src/_components/postEditor/AddToPostOptions.client.tsx`
- `src/_components/postEditor/PostEditorDialog.client.tsx`
- `src/app/(admin)/admin/users/[userId]/_components/SuspensionDialog.client.tsx`
- `src/app/(routes)/friends/_components/FriendCard.client.tsx`
- `src/app/(routes)/profile/_components/ConfirmDeleteUserDialog.client.tsx`
- `src/app/(routes)/profile/_components/DeleteAccountButton.client.tsx`
- `src/app/(routes)/profile/_components/SignOutButton.client.tsx`
- `src/app/(routes)/test/_components/TestEditor.client.tsx`
- `src/app/auth/create-account/_components/CreateAccountForm.client.tsx`
- `src/app/auth/signin/_components/SignInEmailPassword.client.tsx`

## Cleanup

- Remove `@mockingbird/stoyponents` path alias from `tsconfig.base.json`
- Delete the `stoyponents/` directory entirely
- Verify `nx run mockingbird:build` and `nx run mockingbird:test` pass

## Tests

`stoyponents/src/lib/editor/__tests__/utils.spec.ts` moves with the editor folder to `apps/mockingbird/src/_components/editor/__tests__/utils.spec.ts`. Mockingbird's Jest config already picks up tests in `_components/`.
