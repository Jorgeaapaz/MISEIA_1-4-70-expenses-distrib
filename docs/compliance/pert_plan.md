# PERT Compliance Plan — Expenses Distrib
**Project:** `1-4-70-expenses-distrib`  
**Date:** 2026-06-26  
**Total Non-Compliant Items:** 10 criteria → 11 prompt files

---

## PERT Compliance Plan

### Dependency Graph

```
START
  ├─► [001] .env.example ──────────────────────────────────► [005] Docker Deploy ──► [006] Public Deploy ─► END
  │                                                                                          ▲
  ├─► [002] Unit Tests ──► [003] GitHub CI/CD (PRIORITY) ────────────────────────────────────┤
  │                    └─► [004] GitLab CI/CD ─────────────────────────────────────────────► (END)
  │
  ├─► [007] Arch Diagram ──────────────────────────────────────────────────────────────────► END
  ├─► [008] AI Changes Doc ───────────────────────────────────────────────────────────────► END
  ├─► [009] ADRs + Quant Decisions ──────────────────────────────────────────────────────► END
  └─► [010] Architecture Refactor ───────────────────────────────────────────────────────► END
```

### Critical Path
`[001] → [005] → [006]` (3 tasks, ~6h)  
`[002] → [003] → [006]` (3 tasks, ~8h)

Both paths must complete before claiming `fn_deploy_publico_accesible`.

---

### PERT Task List

#### P1 — Base Requirements (No Dependencies)

| Task | Criteria Fixed | Prompt File | Est. Time | Deps |
|---|---|---|---|---|
| **[001]** Create `.env.example` | `dc_env_example` | [001_env_example_template_fn_prompt.md](001_env_example_template_fn_prompt.md) | 0.5h | None |

#### P2 — Notable Code Quality (No Dependencies)

| Task | Criteria Fixed | Prompt File | Est. Time | Deps |
|---|---|---|---|---|
| **[002]** Add Unit Tests + Coverage | `cq_tests_minimos` · `cq_cobertura_alta` | [002_tests_minimos_unit_fn_prompt.md](002_tests_minimos_unit_fn_prompt.md) | 4h | None |

#### P3 — Notable Documentation (No Dependencies, Parallel)

| Task | Criteria Fixed | Prompt File | Est. Time | Deps |
|---|---|---|---|---|
| **[007]** Add Architecture Diagram | `dc_diagrama_arquitectura` | [007_arch_diagram_mermaid_fn_prompt.md](007_arch_diagram_mermaid_fn_prompt.md) | 1h | None |
| **[008]** Document AI Changes | `dc_cambios_ia_documentados` | [008_ia_changes_documented_fn_prompt.md](008_ia_changes_documented_fn_prompt.md) | 0.5h | None |
| **[009]** Add ADRs + Quantitative Decisions | `dc_adrs_o_decision_log` · `dc_justificacion_cuantitativa` | [009_adrs_decision_log_fn_prompt.md](009_adrs_decision_log_fn_prompt.md) | 2h | None |
| **[010]** Refactor Architecture Layers | `cq_arquitectura_razonada` | [010_arch_layers_refactor_fn_prompt.md](010_arch_layers_refactor_fn_prompt.md) | 3h | None |

#### P4 — CI/CD (Depends on Tests)

| Task | Criteria Fixed | Prompt File | Est. Time | Deps |
|---|---|---|---|---|
| **[003]** GitHub CI/CD Pipeline ⭐ | `cq_ci_funcional` | [003_cicd_pipeline_github_fn_prompt.md](003_cicd_pipeline_github_fn_prompt.md) | 3h | [002] |
| **[004]** GitLab CI/CD Pipeline | `cq_ci_funcional` | [004_cicd_pipeline_gitlab_fn_prompt.md](004_cicd_pipeline_gitlab_fn_prompt.md) | 2h | [002] |

#### P5 — Deployment (Depends on .env.example + CI/CD)

| Task | Criteria Fixed | Prompt File | Est. Time | Deps |
|---|---|---|---|---|
| **[005]** Dockerfile + Deploy Instructions | `dc_instrucciones_deploy` | [005_deploy_docker_produc_fn_prompt.md](005_deploy_docker_produc_fn_prompt.md) | 3h | [001] |
| **[006]** Public Deploy + README URL | `fn_deploy_publico_accesible` | [006_deploy_publico_url_fn_prompt.md](006_deploy_publico_url_fn_prompt.md) | 2h | [003] + [005] |

---

## Execution PERT

Tasks ordered by PERT sequence (earliest start time first). Parallel tasks can run simultaneously.

| # | Task | Prompt File | Criteria | Priority | Est. Time | Depends On | Can Run In Parallel With |
|---|---|---|---|---|---|---|---|
| 1 | Create `.env.example` | [001_env_example_template_fn_prompt.md](001_env_example_template_fn_prompt.md) | `dc_env_example` | BASE | 0.5h | — | 2, 7, 8, 9, 10 |
| 2 | Add Unit Tests + Coverage | [002_tests_minimos_unit_fn_prompt.md](002_tests_minimos_unit_fn_prompt.md) | `cq_tests_minimos` · `cq_cobertura_alta` | NOTABLE | 4h | — | 1, 7, 8, 9, 10 |
| 3 | Add Architecture Diagram | [007_arch_diagram_mermaid_fn_prompt.md](007_arch_diagram_mermaid_fn_prompt.md) | `dc_diagrama_arquitectura` | NOTABLE | 1h | — | 1, 2, 8, 9, 10 |
| 4 | Document AI Changes | [008_ia_changes_documented_fn_prompt.md](008_ia_changes_documented_fn_prompt.md) | `dc_cambios_ia_documentados` | NOTABLE | 0.5h | — | 1, 2, 7, 9, 10 |
| 5 | Add ADRs + Quantitative Decisions | [009_adrs_decision_log_fn_prompt.md](009_adrs_decision_log_fn_prompt.md) | `dc_adrs_o_decision_log` · `dc_justificacion_cuantitativa` | EXCEPCIONAL | 2h | — | 1, 2, 7, 8, 10 |
| 6 | Refactor Architecture Layers | [010_arch_layers_refactor_fn_prompt.md](010_arch_layers_refactor_fn_prompt.md) | `cq_arquitectura_razonada` | EXCEPCIONAL | 3h | — | 1, 2, 7, 8, 9 |
| 7 | GitHub CI/CD Pipeline ⭐ | [003_cicd_pipeline_github_fn_prompt.md](003_cicd_pipeline_github_fn_prompt.md) | `cq_ci_funcional` | EXCEPCIONAL | 3h | Task 2 | Task 8 (GitLab CI) |
| 8 | GitLab CI/CD Pipeline | [004_cicd_pipeline_gitlab_fn_prompt.md](004_cicd_pipeline_gitlab_fn_prompt.md) | `cq_ci_funcional` | EXCEPCIONAL | 2h | Task 2 | Task 7 (GitHub CI) |
| 9 | Dockerfile + Deploy Instructions | [005_deploy_docker_produc_fn_prompt.md](005_deploy_docker_produc_fn_prompt.md) | `dc_instrucciones_deploy` | EXCEPCIONAL | 3h | Task 1 | Task 7, 8 |
| 10 | Public Deploy on GCP VM + README URL | [006_deploy_publico_url_fn_prompt.md](006_deploy_publico_url_fn_prompt.md) | `fn_deploy_publico_accesible` | EXCEPCIONAL | 2h | Task 7 + Task 9 | — |

**Total estimated time (sequential):** ~21h  
**Total estimated time (parallel critical path):** ~10h  
**⭐ GitHub CI is prioritized over GitLab CI in the PERT path**

---

## Expected Score After Full Compliance

| Category | Current | After Fixes | Delta |
|---|---|---|---|
| Funcionalidad | 9/10 | 10/10 | +1 |
| Calidad | 5/10 | 10/10 | +5 |
| Documentación | 4/10 | 10/10 | +6 |
| **Total** | **~18/30** | **30/30** | **+12** |
