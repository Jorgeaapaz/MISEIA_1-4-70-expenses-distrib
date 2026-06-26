@~/.claude/prompts/new_functionality_prompt_spec.md

# Add Dockerfile and Production Deployment Instructions

## Role
Act as a Software Architect and DevOps Engineer expert in Docker, Next.js containerization, and GCP VM deployments.

## Context
Project: `expenses-distrib` — Next.js 16 App Router + MongoDB expense splitting application.  
Location: `D:\Master-IA-Dev\04-Bloque4\1-4-70-expenses-distrib\expenses-distrib`  
GitHub repo: https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib

**Non-compliant criterion:** `dc_instrucciones_deploy`  
> Deployment section with verifiable steps (Dockerfile + command, deploy script, cloud instructions) beyond local environment.

**Production infrastructure:**
- GCP VM: Ubuntu 24.04 + Docker 28 + Traefik v3.3
- SSH: `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186`
- Deploy directory: `~/MISEIA170_expenses-distrib`
- Docker network: `miseia-net` (existing, external)
- Traefik wildcard: `*.deviaaps.com` (Cloudflare DNS-01)
- Target domain: `expenses-distrib.deviaaps.com`
- Internal port: `3000` (Next.js default); external via Traefik HTTPS

**Production MongoDB:**
- Connection: `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`
- Database: `expenses-distrib`

**Prerequisite:** `.env.example` must exist (see `001_env_example_template_fn_prompt.md`).

## Task
1. Create a multi-stage `Dockerfile` optimized for Next.js production
2. Create `docker-compose.yml` for production deployment on the GCP VM
3. Add a `docs/deploy.md` with step-by-step verified deployment instructions
4. Update `README.md` with a "Production Deployment" section referencing `docs/deploy.md`
5. Add `.dockerignore` to exclude unnecessary files from Docker build context

### Dockerfile Guidelines
- Use multi-stage build: `deps` → `builder` → `runner`
- Use `node:20-alpine` for all stages
- Enable Next.js standalone output (`output: 'standalone'` in `next.config.ts`)
- Final image should be minimal (only `runner` stage)
- Set `NODE_ENV=production` inside the builder stage only
- Create non-root user `nextjs` for security

### Docker Compose Guidelines
- Service name: `expenses-distrib`
- Join `miseia-net` external network
- Traefik labels for automatic HTTPS routing on `expenses-distrib.deviaaps.com`
- `restart: unless-stopped`
- Environment variables via `.env` file on the VM (NOT hardcoded in compose file)

## Output Format

### Files to create/modify:
1. `Dockerfile` — multi-stage Next.js production build
2. `docker-compose.yml` — production compose for GCP VM
3. `.dockerignore` — exclude node_modules, .next, .env files
4. `next.config.ts` — add `output: 'standalone'`
5. `docs/deploy.md` — full deployment guide
6. `README.md` — add "Production Deployment" section

## Examples and Steps to Follow

**Step 1:** Update `next.config.ts` to add standalone output:
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

**Step 2:** Create `.dockerignore`:
```
node_modules
.next
.env*
.git
coverage
docs
*.md
```

**Step 3:** Create `Dockerfile`:
```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

**Step 4:** Create `docker-compose.yml`:
```yaml
services:
  expenses-distrib:
    build: .
    container_name: expenses-distrib
    restart: unless-stopped
    env_file: .env
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

**Step 5:** Create `.env` for production on the VM (via SSH):
```bash
ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186 << 'EOF'
mkdir -p ~/MISEIA170_expenses-distrib
cat > ~/MISEIA170_expenses-distrib/.env << 'ENVEOF'
MONGODB_URI=mongodb://admin:MongoAdmin2024!@mongodb:27017/?authSource=admin
MONGODB_DB=expenses-distrib
NODE_ENV=production
ENVEOF
EOF
```

> Note: Inside `miseia-net` Docker network, MongoDB is reachable as `mongodb:27017` (container name), not via external host/port.

**Step 6:** Initial deploy via SSH:
```bash
ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186 << 'EOF'
  cd ~/MISEIA170_expenses-distrib
  git clone https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib.git . || git pull origin master
  docker compose up -d --build
  docker compose ps
EOF
```

**Step 7:** Verify at `https://expenses-distrib.deviaaps.com`

## Output Checklist and Guardrails
- [ ] `Dockerfile` uses multi-stage build with `node:20-alpine`
- [ ] Final image runs as non-root `nextjs` user
- [ ] `next.config.ts` has `output: 'standalone'`
- [ ] `.dockerignore` excludes `node_modules`, `.next`, `.env*`
- [ ] `docker-compose.yml` joins `miseia-net` external network
- [ ] Traefik labels use `expenses-distrib.deviaaps.com`
- [ ] No hardcoded credentials in `docker-compose.yml` (uses `env_file: .env`)
- [ ] `docs/deploy.md` has step-by-step instructions with verifiable commands
- [ ] README references deployment docs
- [ ] Local Docker build works: `docker build -t expenses-distrib .`
- [ ] Commit: `feat: add Dockerfile and production deployment docs`
