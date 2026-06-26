# Production Deployment Guide

**Target:** GCP VM (Ubuntu 24.04) + Docker 28 + Traefik v3.3  
**Public URL:** https://expenses-distrib.deviaaps.com  
**VM:** `gcvmuser@34.174.56.186`

---

## Prerequisites

- SSH access to the GCP VM: `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186`
- Docker and Docker Compose installed on the VM
- Traefik running on `miseia-net` Docker network
- MongoDB running and accessible inside `miseia-net`

---

## First-Time Deploy

### 1. SSH into the VM

```bash
ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186
```

### 2. Clone the repository

```bash
mkdir -p ~/MISEIA170_expenses-distrib
cd ~/MISEIA170_expenses-distrib
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib.git .
```

### 3. Create the production `.env` file

```bash
cat > .env << 'EOF'
MONGODB_URI=mongodb://admin:MongoAdmin2024!@mongodb:27017/?authSource=admin
MONGODB_DB=expenses-distrib
NODE_ENV=production
EOF
```

> **Note:** Inside the `miseia-net` Docker network, MongoDB is reachable as `mongodb:27017` (container name), not via the external host/port `34.174.56.186:27020`.

### 4. Start the application

```bash
docker compose up -d --build
```

### 5. Verify it is running

```bash
docker compose ps
# Expected: expenses-distrib ... Up
```

### 6. Verify Traefik has picked up the route

```bash
docker inspect expenses-distrib | grep -A5 Labels
curl -sk -o /dev/null -w "%{http_code}\n" https://expenses-distrib.deviaaps.com
# Expected: 200
```

---

## Subsequent Deploys (manual)

```bash
ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186
cd ~/MISEIA170_expenses-distrib
git pull origin master
docker compose down --remove-orphans
docker compose up -d --build
```

---

## Automated Deploy (GitHub Actions)

Every push to `master` automatically:
1. Runs lint + tests + build (CI job)
2. SSHes into the VM and runs `git pull && docker compose up -d --build`

Pipeline status: https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib/actions

---

## Local Docker Build (verify before deploy)

```bash
# Build image locally
docker build -t expenses-distrib .

# Run locally (no Traefik)
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://localhost:27017 \
  -e MONGODB_DB=expenses_distrib \
  expenses-distrib
```

Open http://localhost:3000 to verify.

---

## Environment Variables

| Variable | Value on VM | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://admin:...@mongodb:27017/?authSource=admin` | MongoDB inside miseia-net |
| `MONGODB_DB` | `expenses-distrib` | Database name |
| `NODE_ENV` | `production` | Next.js production mode |

---

## Troubleshooting

**Container exits immediately:**
```bash
docker compose logs expenses-distrib
```

**Traefik not routing traffic:**
```bash
# Check Traefik dashboard or:
docker logs traefik 2>&1 | grep expenses-distrib
```

**MongoDB connection refused:**
Ensure `mongodb` container is on `miseia-net` and the URI uses the container name, not `34.174.56.186`.
