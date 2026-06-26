# ADR-002: MongoDB over PostgreSQL for Expense Groups

**Status:** Accepted  
**Date:** 2026-04-21  
**Deciders:** Jorge Aguilar Paz

---

## Context

The application needs to store groups (with an embedded variable-length array of member names) and
expenses (linked to groups). The core read pattern is: given a group name, fetch the group document
and all its expenses to render the group page. The member list is small (2–20 names) and always
accessed together with the group.

## Decision

Use MongoDB 7.0 with the raw Node.js driver (`mongodb` npm package). Members are stored as an
embedded BSON array inside the group document.

## Alternatives Considered

| Alternative | Pros | Cons | Reason Rejected |
|---|---|---|---|
| PostgreSQL | ACID transactions, SQL joins, rich ecosystem | Requires a separate `members` table + JOIN for every group read; schema migrations for array changes | Variable-length member array maps naturally to BSON; no JOIN benefit for this access pattern |
| SQLite | Zero infrastructure, file-based, zero cost | No concurrent writes, not production-grade for web apps | Not suitable for multi-user production deployments |
| MongoDB Atlas | Fully managed, auto-scaling, built-in backups | ~$0.10/GB/month storage + connection overhead from serverless cold starts | Existing GCP VM already runs MongoDB — zero additional cost |
| Mongoose ODM | Schema validation, query middleware | Adds abstraction layer and schema overhead for a simple data model | TypeScript interfaces + raw driver provide equivalent type safety without extra dependency |

## Consequences

**Positive:**
- Group document with 10 members is fetched in a **single query** — no JOIN required
- `$addToSet` operator prevents duplicate members atomically without a separate uniqueness check
- Flexible schema allows adding expense fields without migrations
- MongoDB is already provisioned on the GCP VM — no new infrastructure

**Negative/Trade-offs:**
- No ACID multi-document transactions (acceptable: group creation and expense insertion are independent operations)
- Requires explicit index management (`createIndex` on `getDb()` first call)
- `ObjectId` type for `groupId` requires careful serialization in API responses

## Quantitative Evidence

| Metric | MongoDB (embedded members) | PostgreSQL (normalized members table) |
|---|---|---|
| Queries per group page load | **1** (`groups.findOne` + `expenses.find`) | **2** (group row + `SELECT * FROM members WHERE group_id = ?`) |
| Estimated read latency (local) | ~2 ms | ~4 ms (extra round trip) |
| Storage per group (10 members) | ~250 bytes (BSON document) | ~180 bytes (row) + ~200 bytes (10 member rows) = ~380 bytes |
| Index size for 1,000 groups | ~50 KB (single `name` index) | ~50 KB (groups PK) + ~40 KB (members FK index) |

**Conclusion:** MongoDB reduces database round trips by **50%** for the primary read pattern (group page load),
at a small storage overhead cost. For this access pattern, the trade-off favors MongoDB.
