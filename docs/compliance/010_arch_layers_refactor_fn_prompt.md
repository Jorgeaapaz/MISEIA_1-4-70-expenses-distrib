@~/.claude/prompts/new_functionality_prompt_spec.md

# Refactor to Explicit Layered Architecture

## Role
Act as a Software Architect expert in Next.js App Router architecture, clean code principles, and layered architecture patterns (Layered / MVC / Service Layer).

## Context
Project: `expenses-distrib` — Next.js 16 App Router + MongoDB expense splitting application.  
Location: `D:\Master-IA-Dev\04-Bloque4\1-4-70-expenses-distrib\expenses-distrib`

**Non-compliant criterion:** `cq_arquitectura_razonada`  
> Explicit layered architecture (hexagonal, clean, layered, MVC well-applied) with dependencies correctly directed; no cross-layer imports that shouldn't touch.

**Current state:**
- `app/actions.ts` mixes three concerns: input validation, business rules, and MongoDB calls
- No explicit service layer between Server Actions/API routes and MongoDB
- `app/api/` routes also call `getDb()` directly (duplicated data access logic)
- Validation logic is inline (not reusable)

**Current architecture (problematic):**
```
app/actions.ts          → getDb() directly (mixed concerns)
app/api/groups/route.ts → getDb() directly (duplicated)
lib/mongodb.ts          → MongoDB client only
lib/settlement.ts       → Business logic (good - isolated)
lib/types.ts            → Types only (good - isolated)
```

**Target architecture (layered):**
```
app/actions.ts          → calls lib/services/groups.service.ts
app/api/groups/route.ts → calls lib/services/groups.service.ts (shared!)
lib/services/           → Business logic + validation (new)
lib/repositories/       → Data access (wraps getDb calls)
lib/mongodb.ts          → MongoDB client (unchanged)
lib/settlement.ts       → Algorithm (unchanged)
lib/types.ts            → Types (unchanged)
```

## Task
Refactor the codebase to introduce a clean service + repository layer:

1. Create `lib/repositories/groups.repository.ts` — all MongoDB operations for groups and expenses
2. Create `lib/services/groups.service.ts` — business logic, validation, and orchestration
3. Update `app/actions.ts` to call the service layer (no direct `getDb()` calls)
4. Update `app/api/groups/**` routes to call the service layer (removes duplication)
5. Ensure Server Actions and API routes share the same validation and business logic
6. All existing functionality must continue to work after refactoring

### Refactoring Guidelines
- `lib/repositories/` should be the ONLY layer that imports from `lib/mongodb.ts`
- `lib/services/` should import from `lib/repositories/` and `lib/settlement.ts`
- `app/actions.ts` and `app/api/` should import from `lib/services/` only
- No circular dependencies
- TypeScript strict mode must still pass
- All tests must still pass after refactoring

## Output Format

### Files to create:
1. `lib/repositories/groups.repository.ts` — data access layer
2. `lib/repositories/expenses.repository.ts` — data access for expenses
3. `lib/services/groups.service.ts` — service layer

### Files to modify:
4. `app/actions.ts` — remove direct `getDb()` calls, use service layer
5. `app/api/groups/route.ts` — use service layer
6. `app/api/groups/[name]/route.ts` — use service layer
7. `app/api/groups/[name]/members/route.ts` — use service layer
8. `app/api/groups/[name]/expenses/route.ts` — use service layer
9. `app/api/groups/[name]/settlement/route.ts` — use service layer

## Examples and Steps to Follow

**Step 1:** Create `lib/repositories/groups.repository.ts`:
```typescript
import { getDb } from '@/lib/mongodb';
import type { Group } from '@/lib/types';

export async function findGroupByName(name: string): Promise<Group | null> {
  const db = await getDb();
  return db.collection<Group>('groups').findOne({ name });
}

export async function createGroup(slug: string): Promise<void> {
  const db = await getDb();
  await db.collection('groups').insertOne({
    name: slug,
    members: [],
    createdAt: new Date(),
  });
}

export async function addMemberToGroup(groupName: string, memberName: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection('groups').updateOne(
    { name: groupName },
    { $addToSet: { members: memberName } }
  );
  return result.matchedCount > 0;
}
```

**Step 2:** Create `lib/services/groups.service.ts`:
```typescript
import * as groupsRepo from '@/lib/repositories/groups.repository';
import * as expensesRepo from '@/lib/repositories/expenses.repository';
import { calculateSettlements } from '@/lib/settlement';

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

export async function createGroup(name: string): Promise<ServiceResult<{ slug: string }>> {
  if (!name?.trim()) {
    return { ok: false, error: 'El nombre del grupo es obligatorio', status: 400 };
  }
  const slug = slugify(name);
  if (!slug) {
    return { ok: false, error: 'Nombre de grupo no válido', status: 400 };
  }
  try {
    await groupsRepo.createGroup(slug);
    return { ok: true, data: { slug } };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
      return { ok: false, error: 'Ya existe un grupo con ese nombre', status: 409 };
    }
    return { ok: false, error: 'Error al crear el grupo', status: 500 };
  }
}

export async function addMember(groupName: string, memberName: string): Promise<ServiceResult<void>> {
  if (!memberName?.trim()) {
    return { ok: false, error: 'El nombre del miembro es obligatorio', status: 400 };
  }
  const found = await groupsRepo.addMemberToGroup(groupName, memberName.trim());
  if (!found) {
    return { ok: false, error: 'Grupo no encontrado', status: 404 };
  }
  return { ok: true, data: undefined };
}
```

**Step 3:** Update `app/actions.ts` to use service layer:
```typescript
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as groupsService from '@/lib/services/groups.service';

export async function createGroup(_prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string;
  const result = await groupsService.createGroup(name);
  if (!result.ok) return { error: result.error };
  revalidatePath('/');
  redirect(`/group/${result.data.slug}`);
}
```

**Step 4:** Run existing tests and lint to verify nothing broke:
```bash
npm test
npm run lint
npm run build
```

**Step 5:** Commit:
```bash
git add lib/repositories/ lib/services/ app/actions.ts app/api/
git commit -m "refactor: introduce service and repository layers for clean architecture"
git push
```

## Output Checklist and Guardrails
- [ ] `lib/repositories/` contains all MongoDB `getDb()` calls (only layer that touches MongoDB directly)
- [ ] `lib/services/` contains all validation and business logic (imports only from repositories + lib/)
- [ ] `app/actions.ts` has NO direct `getDb()` calls (delegates to service layer)
- [ ] `app/api/` routes have NO direct `getDb()` calls (delegates to service layer)
- [ ] No circular imports between layers (repositories do not import services; services do not import from app/)
- [ ] TypeScript strict mode passes: `npx tsc --noEmit`
- [ ] All existing tests pass: `npm test`
- [ ] ESLint passes: `npm run lint`
- [ ] `npm run build` succeeds with no type errors
- [ ] All API endpoints return the same responses as before the refactor
- [ ] Commit: `refactor: introduce service and repository layers for clean architecture`
