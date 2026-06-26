@~/.claude/prompts/new_functionality_prompt_spec.md

# Add Unit Tests and Coverage Report

## Role
Act as a Software Developer expert in TypeScript, Vitest, and Next.js testing strategies.

## Context
Project: `expenses-distrib` — Next.js 16 App Router + MongoDB expense splitting application.  
Location: `D:\Master-IA-Dev\04-Bloque4\1-4-70-expenses-distrib\expenses-distrib`  
GitHub repo: https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib

**Non-compliant criteria:**
- `cq_tests_minimos` — At least one set of automated tests (unit or integration) covering critical flows; runnable with a single README command.
- `cq_cobertura_alta` — Test coverage reported and reasonable (>60% domain code, >40% global).

**Current state:**
- No test files exist in the project (only `node_modules` test files from dependencies)
- No `test` script in `package.json`
- No test framework configured

**Critical business logic to test:**
- `lib/settlement.ts` — Greedy debt-minimization algorithm (pure function, highest value to test)
- `app/actions.ts` — Server Actions with validation logic (requires mocking MongoDB)
- `lib/mongodb.ts` — Singleton MongoDB client (integration test territory)

**Recommended testing stack:** Vitest (compatible with Next.js 16, supports ESM, fast, built-in coverage via v8)

## Task
1. Install Vitest and test utilities as devDependencies
2. Create `vitest.config.ts` configuration
3. Write unit tests for `lib/settlement.ts` (no mocking needed — pure functions)
4. Write unit tests for validation logic in `app/actions.ts` (mock MongoDB)
5. Add `test` and `test:coverage` scripts to `package.json`
6. Configure coverage thresholds (>60% lines in `lib/`, >40% global)
7. Update README with test commands
8. Ensure `npm test` runs all tests and passes

### Test Guidelines
- Use Vitest + `@vitest/coverage-v8` for coverage
- Test `lib/settlement.ts` exhaustively: empty groups, single member, two members, three+ members, rounding edge cases
- For Server Actions, test the validation logic by extracting pure validator functions or using `vi.mock`
- Do NOT test MongoDB connection directly in unit tests — mock `getDb()`
- Place test files in `__tests__/` directory or alongside source files as `*.test.ts`
- Coverage report should output to `coverage/` directory

## Output Format

### Files to create/modify:
1. `vitest.config.ts` — Vitest configuration
2. `package.json` — add `test`, `test:coverage` scripts and devDependencies
3. `__tests__/settlement.test.ts` — comprehensive unit tests for settlement algorithm
4. `__tests__/actions.test.ts` — unit tests for validation in Server Actions
5. `README.md` — add "Testing" section with commands

## Examples and Steps to Follow

**Step 1:** Install dependencies:
```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom
```

**Step 2:** Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'app/**/*.ts'],
      exclude: ['app/api/**', 'node_modules/**', '**/*.d.ts'],
      thresholds: {
        lines: 40,
        functions: 40,
      },
    },
  },
});
```

**Step 3:** Example tests for `lib/settlement.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateSettlements } from '../lib/settlement';

describe('calculateSettlements', () => {
  it('returns empty array for no members', () => {
    expect(calculateSettlements([], [])).toEqual([]);
  });

  it('returns empty array for single member', () => {
    expect(calculateSettlements(['Alice'], [{ paidBy: 'Alice', amount: 100 }])).toEqual([]);
  });

  it('calculates simple two-person settlement', () => {
    const result = calculateSettlements(
      ['Alice', 'Bob'],
      [{ paidBy: 'Alice', amount: 100 }]
    );
    expect(result).toEqual([{ from: 'Bob', to: 'Alice', amount: 50 }]);
  });

  it('minimizes transactions for three members', () => {
    const result = calculateSettlements(
      ['Alice', 'Bob', 'Charlie'],
      [
        { paidBy: 'Alice', amount: 90 },
        { paidBy: 'Bob', amount: 30 },
      ]
    );
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('returns empty array when expenses are balanced', () => {
    const result = calculateSettlements(
      ['Alice', 'Bob'],
      [
        { paidBy: 'Alice', amount: 50 },
        { paidBy: 'Bob', amount: 50 },
      ]
    );
    expect(result).toEqual([]);
  });
});
```

**Step 4:** Add scripts to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Step 5:** README Testing section:
```markdown
## Testing

\`\`\`bash
# Run all tests once
npm test

# Watch mode (development)
npm run test:watch

# Run with coverage report
npm run test:coverage
\`\`\`
Coverage report is generated in `coverage/` directory.
```

**Step 6:** Run tests and verify all pass:
```bash
npm test
npm run test:coverage
```

## Output Checklist and Guardrails
- [ ] `npm test` runs without errors and all tests pass
- [ ] At least 5 test cases for `lib/settlement.ts` covering edge cases
- [ ] Coverage report generated in `coverage/` directory
- [ ] `coverage/` added to `.gitignore`
- [ ] README has Testing section with exact commands
- [ ] `package.json` has `test` and `test:coverage` scripts
- [ ] No real MongoDB connection in unit tests (mocked)
- [ ] ESLint passes after adding test files: `npm run lint`
- [ ] Commit and push with message: `test: add unit tests for settlement algorithm and actions`
