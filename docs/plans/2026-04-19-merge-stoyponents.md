# Merge stoyponents into mockingbird Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Dissolve the `stoyponents` Nx library and move all its components directly into `apps/mockingbird/src/_components/`, then update all import sites and remove the library.

**Architecture:** Copy the 4 subfolders (`dialog/`, `editor/`, `form/`, `menu/`) into `apps/mockingbird/src/_components/`, update all 18 import sites to use `@/_components/<subfolder>`, remove the tsconfig path alias from both `tsconfig.base.json` and `apps/mockingbird/tsconfig.json`, then delete the `stoyponents/` directory.

**Tech Stack:** TypeScript, Next.js App Router, Nx monorepo

---

### Task 1: Verify stoyponents tests pass before migration

**Files:**
- No changes — verification only

**Step 1: Run stoyponents tests**

```bash
nx run stoyponents:test
```

Expected: All tests pass (there is one trivial placeholder test in `editor/__tests__/utils.spec.ts`).

**Step 2: Confirm clean git state**

```bash
git status
```

Expected: Working tree clean (or only expected in-progress changes).

---

### Task 2: Copy dialog components into mockingbird

**Files:**
- Create: `apps/mockingbird/src/_components/dialog/ConfirmationDialog.client.tsx`
- Create: `apps/mockingbird/src/_components/dialog/ConfirmSignOutDialog.client.tsx`
- Create: `apps/mockingbird/src/_components/dialog/DialogBase.tsx`
- Create: `apps/mockingbird/src/_components/dialog/FormDialog.client.tsx`
- Create: `apps/mockingbird/src/_components/dialog/index.ts`

**Step 1: Copy the dialog folder**

```bash
cp -r stoyponents/src/lib/dialog apps/mockingbird/src/_components/dialog
```

**Step 2: Verify files were copied**

```bash
ls apps/mockingbird/src/_components/dialog/
```

Expected output:
```
ConfirmSignOutDialog.client.tsx  ConfirmationDialog.client.tsx  DialogBase.tsx  FormDialog.client.tsx  index.ts
```

---

### Task 3: Copy editor components into mockingbird

**Files:**
- Create: `apps/mockingbird/src/_components/editor/TextEditor.client.tsx`
- Create: `apps/mockingbird/src/_components/editor/TextDisplay.client.tsx`
- Create: `apps/mockingbird/src/_components/editor/FileSelectButton.client.tsx`
- Create: `apps/mockingbird/src/_components/editor/customLink.ts`
- Create: `apps/mockingbird/src/_components/editor/options.ts`
- Create: `apps/mockingbird/src/_components/editor/styles.css`
- Create: `apps/mockingbird/src/_components/editor/utils.ts`
- Create: `apps/mockingbird/src/_components/editor/index.ts`
- Create: `apps/mockingbird/src/_components/editor/__tests__/utils.spec.ts`

**Step 1: Copy the editor folder**

```bash
cp -r stoyponents/src/lib/editor apps/mockingbird/src/_components/editor
```

**Step 2: Verify files were copied**

```bash
ls apps/mockingbird/src/_components/editor/
```

Expected output includes: `TextEditor.client.tsx`, `TextDisplay.client.tsx`, `FileSelectButton.client.tsx`, `utils.ts`, `index.ts`, `__tests__/`

---

### Task 4: Copy form components into mockingbird

**Files:**
- Create: `apps/mockingbird/src/_components/form/FormError.tsx`
- Create: `apps/mockingbird/src/_components/form/FormTextInput.tsx`
- Create: `apps/mockingbird/src/_components/form/index.ts`

**Step 1: Copy the form folder**

```bash
cp -r stoyponents/src/lib/form apps/mockingbird/src/_components/form
```

**Step 2: Verify files were copied**

```bash
ls apps/mockingbird/src/_components/form/
```

Expected output: `FormError.tsx  FormTextInput.tsx  index.ts`

---

### Task 5: Copy menu components into mockingbird

**Files:**
- Create: `apps/mockingbird/src/_components/menu/MenuButton.tsx`
- Create: `apps/mockingbird/src/_components/menu/MenuItem.tsx`
- Create: `apps/mockingbird/src/_components/menu/index.ts`

**Step 1: Copy the menu folder**

```bash
cp -r stoyponents/src/lib/menu apps/mockingbird/src/_components/menu
```

**Step 2: Verify files were copied**

```bash
ls apps/mockingbird/src/_components/menu/
```

Expected output: `MenuButton.tsx  MenuItem.tsx  index.ts`

---

### Task 6: Update all import sites from @mockingbird/stoyponents to @/_components

**Files to modify** (18 files — update each `from '@mockingbird/stoyponents'` to the correct `@/_components/<subfolder>`):

| File | New import path |
|------|----------------|
| `apps/mockingbird/src/_components/Comment.tsx` | `@/_components/editor` |
| `apps/mockingbird/src/_components/CommentReply.client.tsx` | `@/_components/editor` |
| `apps/mockingbird/src/_components/CommentReplyContainer.client.tsx` | `@/_components/editor` |
| `apps/mockingbird/src/_components/PostMenu.client.tsx` | `@/_components/menu` or `@/_components/dialog` (check actual imports) |
| `apps/mockingbird/src/_components/PostView.tsx` | `@/_components/editor` |
| `apps/mockingbird/src/_components/SelectImageDialog.client.tsx` | `@/_components/dialog` or `@/_components/editor` (check actual imports) |
| `apps/mockingbird/src/_components/SummaryPost.tsx` | `@/_components/editor` |
| `apps/mockingbird/src/_components/UserButton.client.tsx` | `@/_components/menu` or `@/_components/dialog` (check actual imports) |
| `apps/mockingbird/src/_components/postEditor/AddToPostOptions.client.tsx` | `@/_components/editor` |
| `apps/mockingbird/src/_components/postEditor/PostEditorDialog.client.tsx` | `@/_components/editor` or `@/_components/dialog` (check actual imports) |
| `apps/mockingbird/src/app/(admin)/admin/users/[userId]/_components/SuspensionDialog.client.tsx` | `@/_components/dialog` |
| `apps/mockingbird/src/app/(routes)/friends/_components/FriendCard.client.tsx` | `@/_components/menu` or `@/_components/dialog` (check actual imports) |
| `apps/mockingbird/src/app/(routes)/profile/_components/ConfirmDeleteUserDialog.client.tsx` | `@/_components/dialog` |
| `apps/mockingbird/src/app/(routes)/profile/_components/DeleteAccountButton.client.tsx` | `@/_components/dialog` (check actual imports) |
| `apps/mockingbird/src/app/(routes)/profile/_components/SignOutButton.client.tsx` | `@/_components/dialog` (check actual imports) |
| `apps/mockingbird/src/app/(routes)/test/_components/TestEditor.client.tsx` | `@/_components/editor` |
| `apps/mockingbird/src/app/auth/create-account/_components/CreateAccountForm.client.tsx` | `@/_components/form` |
| `apps/mockingbird/src/app/auth/signin/_components/SignInEmailPassword.client.tsx` | `@/_components/form` |

**Step 1: Check the exact named exports each file imports**

For each file, open it and check which symbols are imported from `@mockingbird/stoyponents`. The subfolder to use is determined by which `index.ts` exports that symbol:
- `dialog/index.ts` exports: `ConfirmationDialog`, `ConfirmSignOutDialog`, `DialogBase`, `FormDialog`
- `editor/index.ts` exports: `TextEditor`, `TextDisplay`, `FileSelectButton`, `EditorDelta` (type)
- `form/index.ts` exports: `FormError`, `FormTextInput`
- `menu/index.ts` exports: `MenuButton`, `MenuItem`

**Step 2: Update each import**

For each file, change:
```ts
import { SomeComponent } from '@mockingbird/stoyponents';
```
to:
```ts
import { SomeComponent } from '@/_components/<subfolder>';
```

If a file imports from multiple subfolders, split into multiple import lines.

**Step 3: Verify no remaining references**

```bash
grep -r "@mockingbird/stoyponents" apps/mockingbird/src/
```

Expected: No output.

---

### Task 7: Remove @mockingbird/stoyponents path alias from tsconfig files

**Files:**
- Modify: `tsconfig.base.json`
- Modify: `apps/mockingbird/tsconfig.json`

**Step 1: Remove alias from tsconfig.base.json**

Open `tsconfig.base.json` and delete line 19:
```json
"@mockingbird/stoyponents": ["stoyponents/src/index.ts"]
```

**Step 2: Remove alias from apps/mockingbird/tsconfig.json**

Open `apps/mockingbird/tsconfig.json` and delete lines 20-22:
```json
"@mockingbird/stoyponents": [
  "stoyponents/src/index.ts"
],
```

**Step 3: Verify no remaining stoyponents references in tsconfig files**

```bash
grep -r "stoyponents" tsconfig.base.json apps/mockingbird/tsconfig.json
```

Expected: No output.

---

### Task 8: Run TypeScript build check

**Files:** No changes — verification only

**Step 1: Run the build**

```bash
nx run mockingbird:build
```

Expected: Build succeeds with no TypeScript errors.

If there are errors, they will point to import paths that need fixing — fix them before proceeding.

---

### Task 9: Run tests**

**Files:** No changes — verification only

**Step 1: Run mockingbird tests**

```bash
nx run mockingbird:test
```

Expected: All tests pass, including the migrated `editor/__tests__/utils.spec.ts`.

---

### Task 10: Delete the stoyponents directory and commit

**Files:**
- Delete: `stoyponents/` (entire directory)

**Step 1: Delete the stoyponents directory**

```bash
rm -rf stoyponents/
```

**Step 2: Verify it's gone**

```bash
ls stoyponents/ 2>&1
```

Expected: `ls: stoyponents/: No such file or directory`

**Step 3: Run build one more time to confirm nothing depends on stoyponents**

```bash
nx run mockingbird:build
```

Expected: Build succeeds.

**Step 4: Commit everything**

```bash
git add -A
git commit -m "refactor: merge stoyponents library into mockingbird _components"
```
