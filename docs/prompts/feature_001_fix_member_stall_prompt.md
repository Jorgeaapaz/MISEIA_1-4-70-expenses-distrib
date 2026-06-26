@~/.claude/prompts/new_functionality_prompt_spec.md

# Fix: Add Member Stall + Deprecated Server Action Initialization

## Role
Act as a Software Developer and Software Architect expert in Next.js 16, React 19, and MongoDB.

## Context

**Project:** `expenses-distrib` — Next.js 16 App Router, React 19, MongoDB 7, Tailwind CSS v4  
**Live URL:** https://expenses-distrib.deviaaps.com  
**GCP VM:** `gcvmuser@34.174.56.186` — deploy dir: `~/MISEIA170_expenses-distrib`  
**SSH key:** `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186`  
**MongoDB (external):** `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`  
**MongoDB (inside Docker/miseia-net):** `mongodb://admin:MongoAdmin2024!@mongodb:27017/?authSource=admin`

**Observed symptoms in production:**
1. Browser console shows: `feature_collector.js:23 using deprecated parameters for the initialization function; pass a single object instead — N @ feature_collector.js:23`
2. Clicking "Añadir" in the Add Member form causes the button to enter `isPending=true` and never recover — the app stalls indefinitely

**Root cause analysis:**

**Stall (critical):** `lib/mongodb.ts` creates a `MongoClient` with no connection options. The default `serverSelectionTimeoutMS` is 30 seconds — if MongoDB is momentarily slow at the moment `getDb()` is first called inside the `addMember` Server Action, the action hangs for 30 s+ with no timeout recovery. Since `useActionState` waits for the Server Action promise, `isPending` never resolves.

**Deprecation warning:** `app/actions.ts` exports `addMember` and `addExpense` as Server Actions with a leading `groupName: string` parameter:
```ts
export async function addMember(groupName: string, _prevState: unknown, formData: FormData)
```
`AddMemberForm.tsx` binds this at render time:
```tsx
const addMemberBound = addMember.bind(null, groupName);
const [state, formAction, isPending] = useActionState(addMemberBound, null);
```
In Next.js 16, `Function.prototype.bind()` for Server Action parameter currying generates the `feature_collector.js` deprecation warning. The recommended pattern is to read extra parameters from a hidden `<input type="hidden">` inside the form, keeping the action signature as `(prevState, formData)`.

**Relevant files:**
- `lib/mongodb.ts` — MongoClient instantiation, no timeout options
- `app/actions.ts` — `addMember` and `addExpense` use leading `groupName` param
- `app/components/AddMemberForm.tsx` — uses `.bind(null, groupName)` 
- `app/components/AddExpenseForm.tsx` — uses `.bind(null, groupName)`
- `lib/services/groups.service.ts` — service layer calling repositories
- `lib/repositories/groups.repository.ts` — calls `getDb()`
- `__tests__/actions.test.ts` — unit tests for actions (must stay green)

## Task

Fix both root causes:

### Fix 1 — MongoDB connection timeouts (critical — fixes the stall)

In `lib/mongodb.ts`, pass a configuration object to `MongoClient` with:
- `serverSelectionTimeoutMS: 5000` — fail fast if no MongoDB server responds within 5 s
- `connectTimeoutMS: 10000` — TCP connection timeout
- `socketTimeoutMS: 45000` — individual operation timeout

```ts
// before
new MongoClient(uri).connect()

// after
new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}).connect()
```

Apply this change in both the `development` branch and the module-level `clientPromise` branch of `getClientPromise()`.

### Fix 2 — Replace `.bind()` pattern with hidden inputs (eliminates the deprecation warning)

**Step A — Update `app/actions.ts`:**

Remove the leading `groupName` parameter from `addMember` and `addExpense`. Read `groupName` from `formData` instead:

```ts
// before
export async function addMember(groupName: string, _prevState: unknown, formData: FormData) {
  const memberName = formData.get('memberName') as string;
  const result = await groupsService.addMember(groupName, memberName);
  if (!result.ok) return { error: result.error };
  revalidatePath(`/group/${groupName}`);
  return { success: true };
}

// after
export async function addMember(_prevState: unknown, formData: FormData) {
  const groupName = formData.get('groupName') as string;
  const memberName = formData.get('memberName') as string;
  if (!groupName) return { error: 'Group name is required' };
  const result = await groupsService.addMember(groupName, memberName);
  if (!result.ok) return { error: result.error };
  revalidatePath(`/group/${groupName}`);
  return { success: true };
}
```

Apply the same pattern to `addExpense`.

**Step B — Update `app/components/AddMemberForm.tsx`:**

Remove the `.bind()` call. Add a hidden input for `groupName`. Pass the unbound action directly to `useActionState`:

```tsx
// before
const addMemberBound = addMember.bind(null, groupName);
const [state, formAction, isPending] = useActionState(addMemberBound, null);

// after
const [state, formAction, isPending] = useActionState(addMember, null);

// Inside the <form>:
<input type="hidden" name="groupName" value={groupName} />
```

**Step C — Update `app/components/AddExpenseForm.tsx`** the same way.

### Fix 3 — Check AGENTS.md instruction

Before writing any code, read the relevant guide in `node_modules/next/dist/docs/` about Server Actions and `useActionState` to confirm the hidden-input pattern is correct for this version of Next.js 16.

### Fix 4 — Update unit tests

`__tests__/actions.test.ts` mocks `@/lib/services/groups.service`. The test calls to `addMember` and `addExpense` pass `FormData` — update these calls to include `groupName` in the `FormData` and remove the `groupName` first argument from the test call sites.

## Fix Guidelines

- Read `node_modules/next/dist/docs/` before writing any code (per `AGENTS.md`)
- Work on a new git branch: `fix/member-stall-deprecated-init`
- Fix one root cause at a time, commit after each fix:
  1. `fix: add MongoDB connection timeouts to prevent Server Action stall`
  2. `fix: replace .bind() with hidden input for addMember and addExpense actions`
- Run `npm test` after each commit — all tests must pass
- Run `npm run build` to verify production build is clean
- Do not modify `lib/services/groups.service.ts` or `lib/repositories/` — the fix is contained to `lib/mongodb.ts`, `app/actions.ts`, and the two form components
- Do not add fallback timeouts as middleware — fix the MongoClient options directly

## Output Format

After completing all fixes, produce a verification checklist:

```
[ ] lib/mongodb.ts: serverSelectionTimeoutMS, connectTimeoutMS, socketTimeoutMS set
[ ] app/actions.ts: addMember signature is (_prevState, formData) — no leading groupName
[ ] app/actions.ts: addExpense signature is (_prevState, formData) — no leading groupName
[ ] AddMemberForm.tsx: no .bind() call; hidden input groupName present
[ ] AddExpenseForm.tsx: no .bind() call; hidden input groupName present
[ ] __tests__/actions.test.ts: FormData includes groupName; no extra first arg
[ ] npm test: all tests pass
[ ] npm run build: clean (no type errors, no warnings)
[ ] git: two commits on branch fix/member-stall-deprecated-init
[ ] PR merged into master
[ ] Docker deployed on GCP VM: docker compose down && docker compose up -d --build
[ ] https://expenses-distrib.deviaaps.com: add member form submits without stall
[ ] Browser console: no feature_collector.js deprecation warning
```

## Examples and Steps to Follow

### Verification of Fix 1 — timeout options

```ts
// lib/mongodb.ts — getClientPromise() after fix
function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI!;
  const options = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    return global._mongoClientPromise;
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, options).connect();
  }
  return clientPromise;
}
```

### Verification of Fix 2 — hidden input pattern

```tsx
// AddMemberForm.tsx — final shape after fix
'use client';
import { useActionState } from 'react';
import { useRef, useEffect } from 'react';
import { addMember } from '@/app/actions';

export default function AddMemberForm({ groupName }: { groupName: string }) {
  const [state, formAction, isPending] = useActionState(addMember, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && 'success' in state) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex gap-2">
      <input type="hidden" name="groupName" value={groupName} />
      {/* rest of form unchanged */}
    </form>
  );
}
```

### Deploy to GCP VM

```bash
ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186
cd ~/MISEIA170_expenses-distrib
git pull origin master
docker compose down
docker compose up -d --build
docker compose logs -f expenses-distrib
```

Confirm the container starts and the app responds at https://expenses-distrib.deviaaps.com.

## Output Checklist and Guardrails

- **Do not** set `NODE_ENV=production` as a global environment variable in any job or script — only inline in `npm run build` if regenerating CI/CD
- **Do not** upgrade Next.js or React versions as part of this fix
- **Do not** introduce Mongoose — the project uses the raw MongoDB Node.js driver
- **Do not** add a global error handler that silently swallows MongoDB errors — let them propagate so the form shows the error to the user via `state.error`
- **Verify** that `npm run lint` passes after changes — the project uses `eslint-config-next`
- **Verify** `npm run build` produces a `standalone` output (check `next.config.ts` is unchanged)
- **Never** commit `.env` files — only `.env.example` is allowed in git
- **Push** the fix branch and create a Pull Request; merge only after CI passes
