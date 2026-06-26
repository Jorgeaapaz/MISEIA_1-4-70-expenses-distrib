@~/.claude/prompts/new_functionality_prompt_spec.md

# Create a GitHub CI/CD Pipeline and Deploy App to VM at Google Cloud

## Role
Act as a Software Architect, you are an expert in GitHub Actions and Google Cloud Services.

## Context
Project: `expenses-distrib` — Next.js 16 App Router + MongoDB expense splitting application.  
GitHub repo: https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib  
App name: `expenses-distrib`  
MISEIA number: `170` (from 1-4-70)

**Remote GCP VM:**
- SSH: `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186`
- Deploy directory: `~/MISEIA170_expenses-distrib`
- Infrastructure: Traefik v3.3 on `miseia-net` Docker network
- MongoDB: `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`

**Non-compliant criterion:** `cq_ci_funcional`  
> Pipeline CI configured (`.github/workflows/`) that passes tests + linter on every push, and last build is green.

**Prerequisite:** Unit tests must exist (see `002_tests_minimos_unit_fn_prompt.md`) before this pipeline is useful.

**Required GitHub Secrets** (to be set via `gh secret set`):
- `SSH_PRIVATE_KEY` — content of `C:\ubuntuiso\.ssh\vboxuser`
- `SSH_HOST` — `34.174.56.186`
- `SSH_USER` — `gcvmuser`
- `MONGODB_URI` — `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`
- `MONGODB_DB` — `expenses-distrib`

## Task
Create GitHub Actions workflows that:
1. **CI pipeline** — runs on every push and PR: lint + test + build
2. **CD pipeline** — runs on push to `master`: builds Docker image, deploys to GCP VM via SSH
3. The service runs in Docker on the VM, accessible via Traefik at `expenses-distrib.deviaaps.com` on port `30001`
4. Set up all required secrets using `/gh-cli`

The app must be accessible through Traefik using the domain `expenses-distrib.deviaaps.com`, port `30001`, using the Traefik wildcard `*.deviaaps.com`.

Use `/gh-cli` for all secrets and GitHub operations.

### GitHub Actions Guidelines
- Use `node:20-alpine` or `ubuntu-latest` runners
- Cache `node_modules` with `actions/cache`
- Run `npm run lint`, `npm test`, `npm run build` (with `NODE_ENV=production` only for the build step)
- On deploy: SSH into VM, pull latest code, rebuild Docker container
- Docker container must join `miseia-net` network for Traefik discovery
- Use Traefik labels for automatic HTTPS routing

## Output Format

### Files to create:
1. `.github/workflows/ci.yml` — CI pipeline (lint + test + build)
2. `.github/workflows/deploy.yml` — CD pipeline (build + deploy to GCP VM)
3. `Dockerfile` — Multi-stage build for the Next.js app (if not already created by `005_deploy_docker_produc_fn_prompt.md`)

## Examples and Steps to Follow

**Step 1:** Set GitHub secrets using `/gh-cli`:
```bash
# Add SSH private key
gh secret set SSH_PRIVATE_KEY < "C:\ubuntuiso\.ssh\vboxuser"
gh secret set SSH_HOST --body "34.174.56.186"
gh secret set SSH_USER --body "gcvmuser"
gh secret set MONGODB_URI --body "mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin"
gh secret set MONGODB_DB --body "expenses-distrib"
```

**Step 2:** Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          MONGODB_DB: ${{ secrets.MONGODB_DB }}
```

**Step 3:** Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GCP VM

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: [] # CI job must be green first (reference ci.yml job if in same workflow)

    steps:
      - uses: actions/checkout@v4

      - name: Set up SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add VM to known hosts
        run: ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy to GCP VM
        run: |
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} << 'ENDSSH'
            set -e
            cd ~/MISEIA170_expenses-distrib
            git pull origin master
            docker compose down --remove-orphans || true
            docker compose up -d --build
          ENDSSH
        env:
          SSH_HOST: ${{ secrets.SSH_HOST }}
          SSH_USER: ${{ secrets.SSH_USER }}
```

**Step 4:** Create `docker-compose.yml` on the VM at `~/MISEIA170_expenses-distrib/docker-compose.yml`:
```yaml
version: '3.8'
services:
  expenses-distrib:
    build: .
    container_name: expenses-distrib
    restart: unless-stopped
    environment:
      - MONGODB_URI=mongodb://admin:MongoAdmin2024!@mongodb:27020/?authSource=admin
      - MONGODB_DB=expenses-distrib
      - NODE_ENV=production
    networks:
      - miseia-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.expenses-distrib.rule=Host(`expenses-distrib.deviaaps.com`)"
      - "traefik.http.routers.expenses-distrib.entrypoints=websecure"
      - "traefik.http.routers.expenses-distrib.tls=true"
      - "traefik.http.routers.expenses-distrib.tls.certresolver=cloudflare"
      - "traefik.http.services.expenses-distrib.loadbalancer.server.port=3000"

networks:
  miseia-net:
    external: true
```

**Step 5:** Push and verify CI is green:
```bash
git add .github/ Dockerfile docker-compose.yml
git commit -m "ci: add GitHub Actions CI/CD pipeline"
git push
# Monitor: gh run watch
```

## Output Checklist and Guardrails
- [ ] `.github/workflows/ci.yml` runs lint + test + build on every push
- [ ] `.github/workflows/deploy.yml` deploys to VM on push to master
- [ ] All GitHub secrets are configured via `gh secret set`
- [ ] `NODE_ENV=production` is set only in the build step, NOT as a job-level variable
- [ ] Docker container joins `miseia-net` network
- [ ] Traefik labels route `expenses-distrib.deviaaps.com` to the container
- [ ] Last GitHub Actions run is green (check with `gh run list`)
- [ ] `gh run watch` confirms successful deploy
- [ ] App accessible at `https://expenses-distrib.deviaaps.com` after deploy
