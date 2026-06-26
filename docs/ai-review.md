# AI-Assisted Development Review

## Overview

This project was developed with [Claude Code](https://claude.ai/code) (claude-sonnet-4-6) assistance.
The following documents the critical review process: what was accepted, modified, or rejected from the AI draft.

---

## What AI Generated Correctly

### Settlement Algorithm (`lib/settlement.ts`)

The greedy two-pointer settlement algorithm was generated correctly:
- Correct handling of floating-point rounding (`Math.round(x * 100) / 100`)
- Proper edge case: both empty members and empty expenses return `[]`
- Correct direction: debtor (`from`) → creditor (`to`), not reversed
- Sorted queues (largest creditor and debtor first) minimize total transaction count

**Verified by manual test cases:**

| Scenario | Expected | Result |
|---|---|---|
| Alice pays 90€, Bob pays 30€, Charlie pays 0€ (total 120€, share 40€) | Charlie→Alice 40€, Bob→Alice 10€ | ✅ Matches |
| Alice and Bob each pay 50€ | No transfers | ✅ Matches |
| Single member pays everything | No transfers | ✅ Matches |

### MongoDB Singleton (`lib/mongodb.ts`)

The singleton pattern for `MongoClient` was generated correctly and matched the official Next.js MongoDB
documentation for avoiding connection pool exhaustion during hot-reloads. The `global._mongoClientPromise`
guard is the accepted pattern for Next.js development mode.

### TypeScript Interfaces (`lib/types.ts`)

The `Group`, `Expense`, and `Settlement` interfaces were generated with correct field types. The use of
`ObjectId` from the `mongodb` package for `groupId` is correct and avoids string/ObjectId type mismatches
in MongoDB queries.

---

## What Was Changed from the AI Draft

### 1. Input Validation in Server Actions — Slugify Edge Case

**AI draft:** Basic null/empty check only.

```typescript
// AI draft (simplified):
if (!name) return { error: 'Required' };
```

**Changed to:** Two-step validation that catches slugify collapsing a non-empty name to empty string.

```typescript
// Final implementation:
if (!name || name.trim().length === 0) {
  return { error: 'El nombre del grupo es obligatorio' };
}
const slug = slugify(name);
if (slug.length === 0) {
  return { error: 'Nombre de grupo no válido' };
}
```

**Why:** A name like `"!!!---!!!"` passes the empty check but `slugify()` collapses it to `""`, which
would insert a document with `name: ""` and break URL routing. The second guard catches this case.

---

### 2. Duplicate Group Error Handling — MongoDB Error Code 11000

**AI draft:** Generic 500 error on any insertion failure.

```typescript
// AI draft:
} catch (error) {
  return { error: 'Error creating group' };
}
```

**Changed to:** Explicit check for MongoDB duplicate key error (code 11000) returning 409 Conflict.

```typescript
// Final implementation:
} catch (error: unknown) {
  if (error && typeof error === 'object' && 'code' in error
      && (error as { code: number }).code === 11000) {
    return { error: 'Ya existe un grupo con ese nombre' };
  }
  return { error: 'Error al crear el grupo' };
}
```

**Why:** MongoDB throws error code 11000 on unique index violations. Without this check, a duplicate
group name shows a generic 500 error instead of a meaningful "already exists" message. The check must
narrow the type with `'code' in error` because TypeScript catch clauses type the error as `unknown`.

---

### 3. Expense Validation — Payer Must Be a Member

**AI draft:** Did not validate that `paidBy` is an existing group member before inserting the expense.

```typescript
// AI draft omitted this check entirely — any paidBy string was accepted.
```

**Added manually:**

```typescript
if (!group.members.includes(paidBy)) {
  return { error: 'La persona debe ser miembro del grupo' };
}
```

**Why:** Without this check, an expense can reference a non-member, which breaks the settlement
algorithm (the non-member would appear in the settlement output but not in the group's member list,
causing undefined behavior in balance calculations).

---

## What Was Rejected from the AI Draft

| Suggestion | Reason Rejected |
|---|---|
| Use Mongoose ODM | Overkill — no schema validation benefit for this simple data shape; raw MongoDB driver is simpler and sufficient |
| Redux for client state management | Unnecessary — Next.js Server Actions with `revalidatePath` handles all state; no client-side state cache needed |
| API route versioning (`/api/v1/`) | Not required for a single-version internal API; premature abstraction |
| `try/catch` around every `revalidatePath` | `revalidatePath` never throws — wrapping it adds noise without benefit |
