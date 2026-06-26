@~/.claude/prompts/new_functionality_prompt_spec.md

# Update GitLab CI/CD Pipeline — Add Test and Lint Stages

## Role
Act as a Software Architect and DevOps Engineer expert in GitLab CI/CD and Next.js deployment.

## Context
Project: `expenses-distrib` — Next.js 16 App Router + MongoDB expense splitting application.  
GitLab repo: `gitlab.codecrypto.academy/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib` (or equivalent)

**Non-compliant criterion:** `cq_ci_funcional`  
> Pipeline CI configured (`.gitlab-ci.yml`) that passes tests + linter on every push, and last build is green.

**Current state of `.gitlab-ci.yml`:**
```yaml
stages:
  - build

build:
  stage: build
  image: node:20-alpine
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next/
    expire_in: 1 hour
```
Issues: Only `build` stage; no `test` or `lint` stages; `NODE_ENV=production` not scoped to build step only.

**Prerequisite:** Unit tests must exist (see `002_tests_minimos_unit_fn_prompt.md`) before adding a test stage.

**Remote GCP VM:**
- SSH: `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186`
- Deploy directory: `~/MISEIA170_expenses-distrib`
- MongoDB: `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`

**GitLab CI/CD Variables to set** (use `/glab` to set them):
- `MONGODB_URI` — `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`
- `MONGODB_DB` — `expenses-distrib`
- `SSH_PRIVATE_KEY` — content of SSH private key for GCP VM access
- `SSH_HOST` — `34.174.56.186`
- `SSH_USER` — `gcvmuser`

## Task
Update `.gitlab-ci.yml` to:
1. Add `lint` stage before `build`
2. Add `test` stage before `build`
3. Add `deploy` stage after `build` (runs only on `master` branch)
4. Set `NODE_ENV=production` ONLY in the build script command, not as a job-level variable
5. Configure GitLab CI/CD variables via `/glab`

Use `/glab` for all GitLab operations.

### GitLab CI Guidelines
- Always set `NODE_ENV=production` only for the `npm run build` command, not as a job-level variable
- Use `interruptible: true` on non-deploy jobs for faster feedback
- Cache `node_modules` across all stages with consistent cache key
- Deploy stage: SSH into GCP VM, pull code, rebuild Docker container
- Only deploy on `master` branch pushes

## Output Format

### Files to modify:
1. `.gitlab-ci.yml` — replace current content with full pipeline

## Examples and Steps to Follow

**Step 1:** Set GitLab CI/CD variables via `/glab`:
```bash
glab variable set MONGODB_URI "mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin"
glab variable set MONGODB_DB "expenses-distrib"
glab variable set SSH_HOST "34.174.56.186"
glab variable set SSH_USER "gcvmuser"
# SSH key (multiline):
glab variable set SSH_PRIVATE_KEY --value "$(cat C:\ubuntuiso\.ssh\vboxuser)"
```

**Step 2:** Replace `.gitlab-ci.yml` with:
```yaml
stages:
  - lint
  - test
  - build
  - deploy

default:
  image: node:20-alpine
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  before_script:
    - npm ci

lint:
  stage: lint
  interruptible: true
  script:
    - npm run lint

test:
  stage: test
  interruptible: true
  script:
    - npm test
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    when: always
    expire_in: 1 week

build:
  stage: build
  interruptible: true
  script:
    - NODE_ENV=production npm run build
  artifacts:
    paths:
      - .next/
    expire_in: 1 hour

deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh && chmod 700 ~/.ssh
    - ssh-keyscan -H $SSH_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $SSH_USER@$SSH_HOST << 'ENDSSH'
        set -e
        cd ~/MISEIA170_expenses-distrib
        git pull origin master
        docker compose down --remove-orphans || true
        docker compose up -d --build
      ENDSSH
  rules:
    - if: $CI_COMMIT_BRANCH == "master"
      when: on_success
  environment:
    name: production
    url: https://expenses-distrib.deviaaps.com
```

**Step 3:** Verify the pipeline is green:
```bash
glab ci list
glab ci view
```

**Step 4:** Commit and push:
```bash
git add .gitlab-ci.yml
git commit -m "ci: add lint, test and deploy stages to GitLab pipeline"
git push
```

## Output Checklist and Guardrails
- [ ] `.gitlab-ci.yml` has stages: lint, test, build, deploy
- [ ] `NODE_ENV=production` is set ONLY as `NODE_ENV=production npm run build` in the script, NOT as a job-level or global variable
- [ ] `test` stage runs `npm test` and reports coverage
- [ ] `lint` stage runs `npm run lint`
- [ ] `deploy` stage only runs on `master` branch (`rules: if: $CI_COMMIT_BRANCH == "master"`)
- [ ] All GitLab CI/CD variables configured via `glab variable set`
- [ ] Last pipeline run is green (`glab ci list` shows passed)
- [ ] Pipeline does NOT use `NODE_ENV` as a job-level variable
