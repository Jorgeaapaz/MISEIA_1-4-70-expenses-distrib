@~/.claude/prompts/new_functionality_prompt_spec.md

# Deploy Application Publicly and Document URL in README

## Role
Act as a Software Architect and DevOps Engineer expert in Docker, Traefik, GCP VM deployments, and GitHub Actions.

## Context
Project: `expenses-distrib` — Next.js 16 App Router + MongoDB expense splitting application.  
GitHub repo: https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib  
Target public URL: `https://expenses-distrib.deviaaps.com`

**Non-compliant criterion:** `fn_deploy_publico_accesible`  
> There is a publicly accessible deploy (URL) with the project running, documented in the README.

**Prerequisites (MUST complete first):**
- `005_deploy_docker_produc_fn_prompt.md` — Dockerfile and docker-compose.yml must exist
- `003_cicd_pipeline_github_fn_prompt.md` — GitHub Actions CI/CD must be set up

**Production infrastructure:**
- GCP VM: `gcvmuser@34.174.56.186`
- SSH key: `C:\ubuntuiso\.ssh\vboxuser`
- Traefik wildcard: `*.deviaaps.com` via Cloudflare DNS-01
- Docker network: `miseia-net` (external, already running)
- Deploy directory: `~/MISEIA170_expenses-distrib`
- MongoDB (internal): `mongodb://admin:MongoAdmin2024!@mongodb:27017/?authSource=admin`
  (MongoDB is reachable via container name `mongodb` inside `miseia-net`)

## Task
1. Execute the full deployment to the GCP VM
2. Verify the application is accessible at `https://expenses-distrib.deviaaps.com`
3. Update `README.md` to include the public URL prominently
4. Add a status badge (optional but recommended)
5. Verify the full end-to-end flow works on the live deployment

### Deployment Guidelines
- Use SSH to connect to the GCP VM
- Clone or pull the repository to `~/MISEIA170_expenses-distrib`
- Create `.env` with production values (MongoDB uses internal container name within `miseia-net`)
- Start with `docker compose up -d --build`
- Verify container is running and Traefik has picked up the route
- Test the public URL with `curl` and confirm HTTP 200

## Output Format

### Files to modify:
1. `README.md` — add public URL badge and "Live Demo" section at the top

## Examples and Steps to Follow

**Step 1:** SSH into GCP VM and set up the application:
```bash
ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186

# On the VM:
mkdir -p ~/MISEIA170_expenses-distrib
cd ~/MISEIA170_expenses-distrib

# Clone repo (first time) or pull updates
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib.git . 2>/dev/null || git pull origin master

# Create production .env (MongoDB reachable by container name inside miseia-net)
cat > .env << 'EOF'
MONGODB_URI=mongodb://admin:MongoAdmin2024!@mongodb:27017/?authSource=admin
MONGODB_DB=expenses-distrib
NODE_ENV=production
EOF

# Start the application
docker compose up -d --build

# Verify it's running
docker compose ps
```

**Step 2:** Verify Traefik has picked up the route:
```bash
# On the VM:
docker inspect expenses-distrib | grep -A5 Labels

# Test HTTP response (from inside VM):
curl -sk -o /dev/null -w "%{http_code}\n" https://expenses-distrib.deviaaps.com
# Expected: 200
```

**Step 3:** Test from external network:
```bash
# From local machine (Windows):
curl -o NUL -s -w "%{http_code}" https://expenses-distrib.deviaaps.com
# Expected: 200
```

**Step 4:** Update `README.md` — add Live Demo section at the top (below title):
```markdown
## Live Demo

**[https://expenses-distrib.deviaaps.com](https://expenses-distrib.deviaaps.com)**

> Deployed on GCP VM (Ubuntu 24.04) with Docker + Traefik v3.3 + MongoDB
> Auto-deployed via GitHub Actions on every push to `master`
```

**Step 5:** Verify end-to-end flow on the live URL:
- Open `https://expenses-distrib.deviaaps.com`
- Create a new group (e.g., "viaje-test")
- Add members (Alice, Bob)
- Add expenses
- Verify settlement calculation works

**Step 6:** Commit and push the README update:
```bash
git add README.md
git commit -m "docs: add live demo URL to README"
git push
```

**Step 7:** Verify GitHub Actions redeploys automatically after push.

## Output Checklist and Guardrails
- [ ] Application accessible at `https://expenses-distrib.deviaaps.com` (HTTP 200)
- [ ] TLS certificate valid (HTTPS, not HTTP only)
- [ ] README has the public URL in a visible "Live Demo" or "Deploy" section near the top
- [ ] Full end-to-end flow works on the live deployment (create group → add members → add expenses → see settlement)
- [ ] Docker container is running: `docker compose ps` shows `Up` status
- [ ] GitHub Actions deploy workflow runs green after code push
- [ ] MongoDB connection works in production (data persists across container restarts)
- [ ] No hardcoded credentials in any committed file
