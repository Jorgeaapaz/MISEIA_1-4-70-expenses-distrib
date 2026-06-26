# ADR-004: Greedy Algorithm for Debt Minimization

**Status:** Accepted  
**Date:** 2026-04-21  
**Deciders:** Jorge Aguilar Paz

---

## Context

After recording all group expenses, the application must compute the minimum set of bank transfers
that settles all balances. Each member's net balance is: `sum(paid) − (total / n)`. Members with
positive balance are creditors; members with negative balance are debtors. The algorithm must
output a list of `{ from, to, amount }` transfers.

## Decision

Use a **greedy two-pointer algorithm** (`lib/settlement.ts`):
1. Sort creditors and debtors by amount descending
2. Repeatedly match the largest creditor with the largest debtor
3. Transfer the minimum of the two amounts; advance the exhausted pointer

## Alternatives Considered

| Alternative | Pros | Cons | Reason Rejected |
|---|---|---|---|
| Brute-force (all permutations) | Finds provably optimal solution in all cases | O(n!) time complexity — 10 members = 3.6 million permutations | Unusable for groups larger than ~8 members |
| Simple O(n²) loop (each debtor pays each creditor) | Easy to implement | Produces up to n×m transfers; not minimized | Produces more transfers than needed (e.g., 4 instead of 2 for 3 members) |
| ILP (Integer Linear Programming) | Provably optimal | External solver dependency; significant complexity | Massive overkill for ≤20 members |
| Greedy (chosen) | O(n log n), minimizes transactions in practice | Not proven optimal for all inputs (though optimal for most real-world cases) | Optimal enough for realistic group sizes |

## Consequences

**Positive:**
- O(n log n) time complexity (dominated by sort) — fast for any realistic group size
- Produces the minimum number of transfers in the common case
- Pure function (`calculateSettlement(members, expenses)`) — no I/O, easy to test
- No external dependencies

**Negative/Trade-offs:**
- Not proven to be globally optimal in all edge cases (though optimal for equal-split scenarios)
- Floating-point rounding (`Math.round(x * 100) / 100`) can leave a small residual balance that is ignored

## Quantitative Evidence

| Group Size (n) | Greedy: Max Transfers | Brute Force: Ops | Greedy: Ops |
|---|---|---|---|
| 3 members | 2 | 6 (3!) | ~3 (sort + 2 iterations) |
| 5 members | 4 | 120 (5!) | ~5·log(5) ≈ 12 |
| 10 members | 9 | 3,628,800 (10!) | ~10·log(10) ≈ 33 |
| 20 members | 19 | 2.4 × 10¹⁸ (20!) | ~20·log(20) ≈ 86 |

The greedy algorithm is **10⁵× faster** than brute force at 10 members and is the only feasible
choice at 20+ members. For the expected group size (3–10), it produces the optimal result in all
tested cases.
