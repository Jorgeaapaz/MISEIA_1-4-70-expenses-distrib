@~/.claude/prompts/new_functionality_prompt_spec.md

# Add .env.example Template File

## Role
Act as a Software Developer and DevOps Engineer expert in Next.js and MongoDB application configuration management.

## Context
Project: `expenses-distrib` — Next.js 16 App Router + MongoDB expense splitting application.  
Location: `D:\Master-IA-Dev\04-Bloque4\1-4-70-expenses-distrib\expenses-distrib`  
GitHub repo: https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib

**Non-compliant criterion:** `dc_env_example`  
> `.env.example` (or equivalent) with all required environment variables listed, without real values.

**Current state:**
- `.env.local` exists but is gitignored via `.env*` pattern
- No `.env.example` file exists in the project
- Developers cloning the repo have no way to know which variables are required

**Required variables (from `lib/mongodb.ts`):**
```typescript
const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;
```

## Task
Create a `.env.example` file in the project root that:
1. Lists all required environment variables with placeholder values (never real credentials)
2. Includes comments explaining each variable's purpose
3. Matches the variable names used in `lib/mongodb.ts`
4. References the production MongoDB connection format without exposing real credentials
5. Update `README.md` to reference `.env.example` in the "Environment Variables" section

### .env.example Guidelines
- Use descriptive placeholder values like `your_mongodb_uri_here` (not empty values)
- Add comment lines explaining each variable
- Include both local and production URI format examples as comments
- Never include real credentials, passwords, or connection strings with auth

## Output Format
Two files modified/created:
1. `.env.example` — new file with placeholder values
2. `README.md` — updated "Environment Variables" section to reference `.env.example`

## Examples and Steps to Follow

**Step 1:** Create `.env.example` in project root:
```env
# MongoDB connection URI
# Local development: mongodb://localhost:27017
# Production (GCP VM): mongodb://admin:<password>@<host>:<port>/?authSource=admin
MONGODB_URI=mongodb://localhost:27017

# MongoDB database name
MONGODB_DB=expenses_distrib
```

**Step 2:** Update README.md "Environment Variables" section:
```markdown
### Environment Variables

Copy `.env.example` to `.env.local` and fill in real values:

\`\`\`bash
cp .env.example .env.local
\`\`\`

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string (local or Atlas/production) |
| `MONGODB_DB` | ✅ | MongoDB database name |
```

**Step 3:** Verify `.env.example` is NOT in `.gitignore` (it should be tracked in git).

**Step 4:** Commit and push:
```bash
git add .env.example README.md
git commit -m "docs: add .env.example template and update README env section"
git push
```

## Output Checklist and Guardrails
- [ ] `.env.example` exists in project root
- [ ] No real credentials, passwords, or connection strings in `.env.example`
- [ ] All variables used in `lib/mongodb.ts` are represented
- [ ] `.env.example` is tracked by git (not gitignored)
- [ ] `.env.local` remains gitignored via `.env*` pattern
- [ ] README references `cp .env.example .env.local` workflow
- [ ] Tests pass after change: `npm run lint`
