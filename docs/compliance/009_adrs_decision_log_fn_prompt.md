@~/.claude/prompts/new_functionality_prompt_spec.md

# Create Architecture Decision Records (ADRs) with Quantitative Justification

## Role
Act as a Software Architect expert in Architecture Decision Records (ADRs), technical documentation, and evidence-based design decisions.

## Context
Project: `expenses-distrib` — Next.js 16 App Router + MongoDB expense splitting application.  
Location: `D:\Master-IA-Dev\04-Bloque4\1-4-70-expenses-distrib\expenses-distrib`

**Non-compliant criteria:**
- `dc_adrs_o_decision_log` — ADRs (Architecture Decision Records) or structured decision log with context/decision/consequences per key decision.
- `dc_justificacion_cuantitativa` — At least one technical decision justified with numbers (benchmark, measured latency, estimated cost, comparison with alternative).

**Current state:**
- README has a "Design Patterns / Architecture" section with 5 patterns described
- These are NOT structured ADRs (missing: context, alternatives considered, consequences)
- No quantitative justification for any decision

**Key architectural decisions to document as ADRs:**
1. Next.js App Router + Server Components (vs. traditional React SPA)
2. MongoDB (vs. PostgreSQL or SQLite)
3. Server Actions for mutations (vs. traditional API routes only)
4. Raw MongoDB driver (vs. Mongoose ODM)
5. Greedy algorithm for settlement minimization (vs. brute force)

## Task
1. Create `docs/decisions/` directory with ADR files
2. Write at least 4 structured ADRs following the MADR format (Markdown ADR)
3. At least 1 ADR must include quantitative justification (measured performance, cost estimate, or benchmark comparison)
4. Create `docs/decisions/README.md` as index of all ADRs
5. Reference the ADR index from the main `README.md`

### ADR Guidelines
- Use MADR format: Status, Context, Decision, Alternatives Considered, Consequences
- Number ADRs sequentially: `ADR-001`, `ADR-002`, etc.
- "Status" must be one of: Proposed, Accepted, Deprecated, Superseded
- At least one ADR must have a "Quantitative Evidence" section with actual numbers
- Keep each ADR focused on a single decision

## Output Format

### Files to create:
1. `docs/decisions/README.md` — ADR index
2. `docs/decisions/ADR-001-nextjs-app-router.md`
3. `docs/decisions/ADR-002-mongodb-over-sql.md`
4. `docs/decisions/ADR-003-server-actions-mutations.md`
5. `docs/decisions/ADR-004-greedy-settlement-algorithm.md`
6. `README.md` — add link to `docs/decisions/` in a "Decisions" section

## Examples and Steps to Follow

**ADR Template (MADR format):**
```markdown
# ADR-XXX: [Short Title]

**Status:** Accepted  
**Date:** 2026-04-21  
**Deciders:** Jorge Aguilar Paz  

---

## Context
[Why was this decision needed? What constraints or forces shaped it?]

## Decision
[What was decided? State it clearly.]

## Alternatives Considered

| Alternative | Pros | Cons | Reason Rejected |
|---|---|---|---|
| Option A | ... | ... | ... |
| Option B | ... | ... | ... |

## Consequences
**Positive:**
- [Benefit 1]
- [Benefit 2]

**Negative/Trade-offs:**
- [Trade-off 1]

## Quantitative Evidence (if applicable)
[Numbers, benchmarks, cost estimates, or measurements that support the decision]
```

**Example ADR-002 (with quantitative justification):**
```markdown
# ADR-002: MongoDB over PostgreSQL for Expense Groups

**Status:** Accepted  
**Date:** 2026-04-21

## Context
The application needs to store groups (with embedded member arrays) and expenses 
(linked to groups). The data model has a natural document structure: a group has 
a name and a variable-length array of member names.

## Decision
Use MongoDB 7.0 with the raw Node.js driver (`mongodb` npm package).

## Alternatives Considered

| Alternative | Pros | Cons | Reason Rejected |
|---|---|---|---|
| PostgreSQL | ACID transactions, familiar SQL, structured | Requires JOIN for members (separate table), schema migration complexity for dynamic members | Overkill for this data shape; member array maps naturally to BSON |
| SQLite | Zero infrastructure, file-based | No concurrent writes, not suitable for production web apps | Not production-grade for multi-user scenarios |
| MongoDB Atlas | Fully managed, auto-scaling | Cost ($0.10/GB/month, connection overhead from serverless) | Local MongoDB on GCP VM is free within existing infra |

## Consequences
**Positive:**
- Member array stored as embedded BSON array — no JOIN needed to fetch group + members
- Flexible schema allows adding fields without migrations
- `$addToSet` operator prevents duplicate members atomically

**Negative:**
- No ACID multi-document transactions (acceptable: group + expense writes are independent)
- Requires explicit index management (`createIndex` on first `getDb()` call)

## Quantitative Evidence
- Group document with 10 members: 1 MongoDB query vs. 2 SQL queries (group + members JOIN)
- Expected read latency: ~2ms local, ~15ms over LAN vs. ~20ms for equivalent PostgreSQL JOIN
- MongoDB storage: ~200 bytes/group document vs. ~180 bytes PostgreSQL row + normalized members table
- Decision: MongoDB reduces round trips by 50% for the primary read pattern (group page load)
```

**Step to create ADR index (`docs/decisions/README.md`):**
```markdown
# Architecture Decision Records

| ADR | Title | Status | Date |
|---|---|---|---|
| [ADR-001](ADR-001-nextjs-app-router.md) | Next.js 16 App Router with Server Components | Accepted | 2026-04-21 |
| [ADR-002](ADR-002-mongodb-over-sql.md) | MongoDB over PostgreSQL for expense groups | Accepted | 2026-04-21 |
| [ADR-003](ADR-003-server-actions-mutations.md) | Server Actions for form mutations | Accepted | 2026-04-21 |
| [ADR-004](ADR-004-greedy-settlement-algorithm.md) | Greedy algorithm for debt minimization | Accepted | 2026-04-21 |
```

**Step to update main README.md:**
```markdown
## Architecture Decisions

Key architectural decisions are documented as ADRs in [`docs/decisions/`](docs/decisions/):

- [ADR-001: Next.js App Router](docs/decisions/ADR-001-nextjs-app-router.md)
- [ADR-002: MongoDB over SQL](docs/decisions/ADR-002-mongodb-over-sql.md)
- [ADR-003: Server Actions for mutations](docs/decisions/ADR-003-server-actions-mutations.md)
- [ADR-004: Greedy settlement algorithm](docs/decisions/ADR-004-greedy-settlement-algorithm.md)
```

## Output Checklist and Guardrails
- [ ] `docs/decisions/` directory created with at least 4 ADR files
- [ ] Each ADR has: Status, Context, Decision, Alternatives Considered (table), Consequences
- [ ] At least 1 ADR (`ADR-002` recommended) has a "Quantitative Evidence" section with actual numbers/estimates
- [ ] `docs/decisions/README.md` index lists all ADRs in a table
- [ ] Main `README.md` references the ADRs directory
- [ ] Alternatives in each ADR include reasons for rejection (not just pros/cons)
- [ ] Numbers in quantitative justification are plausible and specific (not vague estimates)
- [ ] ADRs reflect the actual code decisions (not theoretical alternatives that were never considered)
- [ ] Commit: `docs: add Architecture Decision Records (ADRs) with quantitative justification`
