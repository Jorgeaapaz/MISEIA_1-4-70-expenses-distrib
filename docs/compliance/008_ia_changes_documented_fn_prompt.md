@~/.claude/prompts/new_functionality_prompt_spec.md

# Document AI-Assisted Changes and Critical Review

## Role
Act as a Software Developer and Technical Writer expert in documenting AI-assisted development practices and critical code review.

## Context
Project: `expenses-distrib` — Next.js 16 App Router + MongoDB expense splitting application.  
Location: `D:\Master-IA-Dev\04-Bloque4\1-4-70-expenses-distrib\expenses-distrib`

**Non-compliant criterion:** `dc_cambios_ia_documentados`  
> If AI was used to generate drafts, document what was changed vs. the draft (explicit critical review, not just acceptance).

**Current state:**
- No mention of AI usage in any file
- Retrospective file (`RETROSPECTIVA-2026-04-21.md`) exists but does not document AI changes
- No section in README about AI-assisted development

**What to document:**
Based on the git history and code structure, the project was initially generated with AI assistance (commit: `feat: Implement Expense Splitting App with Next.js, MongoDB, and Tailwind CSS`). The documentation must explain:
1. Which parts were AI-generated
2. What was reviewed and kept
3. What was changed or rejected from the AI draft
4. What was written manually by the developer

## Task
1. Add a "Development Notes — AI Assistance" section to `README.md`
2. Create `docs/ai-review.md` with detailed critical review of AI-generated code
3. Document at least 3 specific examples of what was changed vs. the AI draft
4. Document what was verified to work correctly from the AI output

### AI Review Guidelines
- Be specific: name the files and functions reviewed
- Include concrete examples of changes made (before/after or "AI suggested X but we did Y")
- Explain WHY changes were made (correctness, security, performance, style)
- Do NOT use generic statements like "reviewed for quality" — be specific
- Acknowledge what the AI got right and what required correction

## Output Format

### Files to create/modify:
1. `README.md` — add "AI-Assisted Development" section
2. `docs/ai-review.md` — detailed critical review document

## Examples and Steps to Follow

**Step 1:** Create `docs/ai-review.md` with content like:

```markdown
# AI-Assisted Development Review

## Overview
This project was developed with Claude Code (claude-sonnet-4-6) assistance.
The following documents the critical review process: what was accepted, modified, or rejected.

## What AI Generated Well

### Settlement Algorithm (`lib/settlement.ts`)
The greedy two-pointer settlement algorithm was generated correctly:
- Correct handling of floating-point rounding (`.toFixed(2)` with `parseFloat`)
- Proper edge case: single member returns empty array
- Correct direction: debtor → creditor (not reversed)

**Verified by:** Running manual test cases with pen-and-paper calculations:
- Alice pays 90€, Bob pays 30€, Charlie pays 0€ for a 120€ trip (40€ share each)
  - Expected: Charlie→Alice 40€, Bob→Alice 10€
  - Result: ✅ Matches

### MongoDB Singleton (`lib/mongodb.ts`)
The singleton pattern for `MongoClient` was generated correctly and matched the official
Next.js MongoDB documentation for avoiding connection pool exhaustion during hot-reloads.

## What Was Changed from the AI Draft

### 1. Input Validation in Server Actions
**AI draft:** Basic null check only.  
**Changed to:** Multi-step validation with specific error messages in Spanish:
```typescript
// AI draft (simplified):
if (!name) return { error: 'Required' };

// Our implementation:
if (!name || name.trim().length === 0) {
  return { error: 'El nombre del grupo es obligatorio' };
}
const slug = slugify(name);
if (slug.length === 0) {
  return { error: 'Nombre de grupo no válido' };
}
```
**Reason:** Domain-specific validation (slugify can reduce a non-empty name to empty string).

### 2. Error Handling for Duplicate Groups
**AI draft:** Generic 500 error on MongoDB duplicate key.  
**Changed to:** Explicit check for MongoDB error code 11000 with 409 Conflict response:
```typescript
if (error?.code === 11000) {
  return { error: 'Ya existe un grupo con ese nombre' };
}
```
**Reason:** MongoDB error code must be explicitly checked to distinguish from other errors.

### 3. Expense Validation — Member Check
**AI draft:** Did not validate that `paidBy` is an existing group member.  
**Added manually:**
```typescript
if (!group.members.includes(paidBy)) {
  return { error: 'La persona debe ser miembro del grupo' };
}
```
**Reason:** Data integrity — an expense cannot be paid by someone not in the group.

## What Was Rejected
- AI suggested using `mongoose` ODM — rejected in favor of raw MongoDB driver
  for simplicity (no schema needed beyond TypeScript types)
- AI suggested Redux for state management — rejected; Next.js Server Actions with
  `revalidatePath` is sufficient without client-side state
```

**Step 2:** Add "AI-Assisted Development" section to README.md (after "How It Works"):
```markdown
## AI-Assisted Development

This project was developed with [Claude Code](https://claude.ai/code) assistance.
A detailed critical review of AI-generated code, including what was modified and what was rejected,
is documented in [`docs/ai-review.md`](docs/ai-review.md).

Key changes from the AI draft:
- Added domain-specific input validation (slugify edge cases)
- Fixed error handling for MongoDB duplicate key errors (code 11000 → 409 Conflict)
- Added member existence check before recording expenses (data integrity)
```

**Step 3:** Commit and push:
```bash
git add README.md docs/ai-review.md
git commit -m "docs: add AI-assisted development review and critical change log"
git push
```

## Output Checklist and Guardrails
- [ ] `docs/ai-review.md` exists with at least 3 specific examples of changes from AI draft
- [ ] Examples include "before" (AI draft) and "after" (final code) comparisons
- [ ] Each change includes a WHY explanation (not just what changed)
- [ ] Document includes what AI generated correctly (balanced review)
- [ ] README references `docs/ai-review.md`
- [ ] No generic statements — all examples reference specific files and functions
- [ ] Commit: `docs: add AI-assisted development review and critical change log`
