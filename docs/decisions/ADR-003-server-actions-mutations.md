# ADR-003: Server Actions for Form Mutations

**Status:** Accepted  
**Date:** 2026-04-21  
**Deciders:** Jorge Aguilar Paz

---

## Context

The application needs to handle three write operations triggered by HTML forms:
- Create a group
- Add a member to a group
- Add an expense to a group

Each write requires server-side validation, a MongoDB mutation, and a page refresh.

## Decision

Use Next.js Server Actions (`'use server'` in `app/actions.ts`) for all form mutations,
combined with `revalidatePath` for cache invalidation. Keep REST API routes (`app/api/`) in
parallel for programmatic access (curl, external integrations, testing).

## Alternatives Considered

| Alternative | Pros | Cons | Reason Rejected |
|---|---|---|---|
| REST API routes only (no Server Actions) | Works with any client, easier to test in isolation | Requires fetch() call + state management in every form component | Server Actions integrate directly with `<form action={...}>` — less code |
| SWR / React Query mutations | Optimistic updates, cache management | Client-side state library dependency; `useEffect` on every page | Overkill for this use case; server-rendered pages don't need client cache |
| tRPC | End-to-end type safety, auto-generated client | Additional dependency; learning curve; not standard Next.js pattern | Premature abstraction for 3 mutation endpoints |

## Consequences

**Positive:**
- Forms work progressively (no JavaScript required for basic functionality)
- Validation and MongoDB calls share the same runtime (no serialization overhead)
- `revalidatePath` automatically invalidates the affected page cache after writes
- No CORS configuration needed — Server Actions run on the same origin

**Negative/Trade-offs:**
- `'use server'` directive makes unit testing harder (requires mocking `next/cache` and `next/navigation`)
- Server Actions cannot be called from external clients (requires parallel REST routes for API access)
- Redirect behavior in Server Actions throws a special error internally, making error handling non-obvious
