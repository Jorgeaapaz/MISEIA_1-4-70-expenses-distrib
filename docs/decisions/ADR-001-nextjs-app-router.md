# ADR-001: Next.js 16 App Router with Server Components

**Status:** Accepted  
**Date:** 2026-04-21  
**Deciders:** Jorge Aguilar Paz

---

## Context

The application needs a web framework for a multi-page expense splitting tool. The main pages are:
a home page (create/navigate to groups) and a group detail page (members, expenses, settlement).
The group detail page fetches MongoDB data and runs the settlement algorithm — it is read-heavy
and needs to render quickly without client-side loading spinners.

## Decision

Use Next.js 16 with the App Router and React Server Components as the primary rendering model.
Server Actions (`'use server'`) handle all form mutations.

## Alternatives Considered

| Alternative | Pros | Cons | Reason Rejected |
|---|---|---|---|
| Next.js 13 Pages Router | Mature, well-documented | `getServerSideProps` boilerplate per page, no Server Components | App Router is the current standard; Pages Router is in maintenance mode |
| React SPA + separate Express API | Full decoupling, flexible backend | Two deployments, CORS config, client-side loading states, extra boilerplate | Adds operational complexity for a single-developer project |
| Remix | File-based loaders, good DX | Smaller ecosystem, less Next.js tooling support | Less relevant to MISEIA course stack |

## Consequences

**Positive:**
- Group detail page fetches MongoDB + calculates settlement server-side in a single round trip
- No client-side data fetching library needed (React Query, SWR, etc.)
- Server Actions remove the need for manual API routes for form submissions
- TypeScript shared between server and client without extra serialization

**Negative/Trade-offs:**
- Server Components cannot use React hooks directly — forms require Client Component wrappers
- `'use server'` directive makes testing Server Actions more complex (requires mocking Next.js modules)
- App Router caching behavior is more complex than Pages Router
