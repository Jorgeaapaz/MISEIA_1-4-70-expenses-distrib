# Compliance Report — Expenses Distrib
**Project:** `1-4-70-expenses-distrib`  
**Repo:** https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib  
**Stack:** Next.js 16 · TypeScript · MongoDB · Tailwind CSS v4  
**Evaluated:** 2026-06-26  
**Evaluator:** Claude Code (claude-sonnet-4-6)

---

## Summary

| Category | Compliant | Non-Compliant | Score |
|---|---|---|---|
| Funcionalidad y cumplimiento | 9 | 1 | **9/10** |
| Calidad de código y arquitectura | 6 | 5 | **5/10** |
| Documentación y decisiones | 4 | 7 | **4/10** |
| **TOTAL** | **19** | **13** | **~18/30** |

---

## Funcionalidad y cumplimiento del enunciado

### Base (4/4) ✅

| ID | Criterio | Estado | Evidencia |
|---|---|---|---|
| `fn_se_instala` | Dependencias instalables sin errores | ✅ | `npm install` documentado en README; `package-lock.json` presente |
| `fn_arranca_local` | Arranca con comando documentado | ✅ | `npm run dev` → `localhost:3000`; documentado en README |
| `fn_flujo_principal_funciona` | Flujo principal end-to-end | ✅ | Grupos, miembros, gastos y liquidación implementados completamente |
| `fn_persistencia_efectiva` | Datos sobreviven reinicio | ✅ | MongoDB con índices en colecciones `groups` y `expenses` |

### Notable (3/3) ✅

| ID | Criterio | Estado | Evidencia |
|---|---|---|---|
| `fn_validaciones_de_entrada` | Inputs validados con errores claros | ✅ | `app/actions.ts`: campos obligatorios, importe positivo, miembro existente; 409 en duplicados |
| `fn_manejo_errores_consistente` | Errores controlados y consistentes | ✅ | Respuestas `{ error: string }` en Server Actions; status codes 409/404/400 en API routes |
| `fn_funciones_completas_del_enunciado` | Todas las funcionalidades del enunciado | ✅ | Crear grupo, añadir miembros, registrar gastos, calcular liquidación mínima |

### Excepcional (2/3) ⚠️

| ID | Criterio | Estado | Evidencia |
|---|---|---|---|
| `fn_features_extra_pertinentes` | Funcionalidades extra pertinentes | ✅ | REST API layer paralela a Server Actions; algoritmo greedy de minimización de transferencias |
| `fn_estados_intermedios_ui` | Estados de carga, error y vacío | ✅ | `app/group/[name]/loading.tsx`, `error.tsx`, `not-found.tsx` presentes |
| `fn_deploy_publico_accesible` | Deploy público accesible con URL | ❌ | **No existe URL pública documentada en README; no hay Dockerfile ni instrucciones de deploy** |

---

## Calidad de código y arquitectura

### Base (4/4) ✅

| ID | Criterio | Estado | Evidencia |
|---|---|---|---|
| `cq_estructura_carpetas_clara` | Estructura de carpetas refleja arquitectura | ✅ | `app/`, `lib/`, `app/components/`, `app/api/`, `app/group/[name]/` bien separados |
| `cq_nombres_descriptivos` | Nombres descriptivos en funciones y archivos | ✅ | `createGroup`, `addMember`, `addExpense`, `getDb`, `calculateSettlements` |
| `cq_separacion_responsabilidades` | Capas separadas | ✅ | `lib/` (acceso datos + lógica), `app/api/` (controllers), `app/components/` (UI) |
| `cq_dependencias_lockeadas` | Lockfile presente y commiteado | ✅ | `package-lock.json` en raíz, commiteado |

### Notable (1/3) ⚠️

| ID | Criterio | Estado | Evidencia |
|---|---|---|---|
| `cq_tests_minimos` | Tests automatizados ejecutables | ❌ | **No hay archivos de test en el proyecto; no hay script `test` en `package.json`** |
| `cq_linter_configurado` | Linter configurado con config versionada | ✅ | `eslint.config.mjs` con `eslint-config-next`; script `lint` en `package.json` |
| `cq_sin_secretos_en_repo` | Sin credenciales en el código | ✅ | `.env*` gitignoreado; git log no muestra credenciales; `.env.local` tiene solo localhost |

### Excepcional (0/3) ❌

| ID | Criterio | Estado | Evidencia |
|---|---|---|---|
| `cq_arquitectura_razonada` | Arquitectura por capas explícita y formal | ❌ | **`app/actions.ts` mezcla lógica de negocio con acceso a datos; no hay service layer explícito** |
| `cq_cobertura_alta` | Cobertura >60% líneas dominio, >40% global | ❌ | **No hay tests, por lo tanto cobertura = 0%** |
| `cq_ci_funcional` | Pipeline CI pasa tests + linter en cada push | ❌ | **`.gitlab-ci.yml` solo ejecuta `build`; no hay etapa `test` ni `lint`; no existe `.github/workflows/`** |

---

## Documentación y decisiones

### Base (3/4) ⚠️

| ID | Criterio | Estado | Evidencia |
|---|---|---|---|
| `dc_readme_presente` | README con qué hace, instalación, ejecución, endpoints | ✅ | README completo con features, estructura, arquitectura, instalación, ejemplos |
| `dc_env_example` | `.env.example` con variables sin valores reales | ❌ | **No existe `.env.example`; solo `.env.local` (gitignoreado) con valores locales** |
| `dc_comandos_verificacion` | Comandos exactos para verificar el trabajo | ✅ | `npm run dev`, `npm run build`, `npm start`, ejemplos de curl en README |
| `dc_seccion_uso` | Ejemplo de uso real con request/response | ✅ | Sección "Example Output" con requests curl y respuestas JSON |

### Notable (1/3) ⚠️

| ID | Criterio | Estado | Evidencia |
|---|---|---|---|
| `dc_diagrama_arquitectura` | Diagrama de arquitectura (ASCII, Mermaid, etc.) | ❌ | **Solo hay árbol de carpetas; no hay diagrama de componentes/flujos** |
| `dc_decisiones_documentadas` | Al menos 2 trade-offs reales documentados | ✅ | Sección "Design Patterns / Architecture" documenta 5 decisiones (Server Components, Server Actions, Singleton, REST layer, Greedy algorithm) |
| `dc_cambios_ia_documentados` | Documenta qué cambió del borrador IA | ❌ | **No hay mención de uso de IA ni revisión crítica de cambios** |

### Excepcional (0/3) ❌

| ID | Criterio | Estado | Evidencia |
|---|---|---|---|
| `dc_adrs_o_decision_log` | ADRs con contexto/decisión/consecuencias | ❌ | **No existe ningún ADR ni decision log estructurado** |
| `dc_justificacion_cuantitativa` | Al menos una decisión con justificación numérica | ❌ | **Ninguna decisión técnica está justificada con benchmarks, métricas o costes** |
| `dc_instrucciones_deploy` | Sección de despliegue verificable (Dockerfile + comandos) | ❌ | **No hay Dockerfile, docker-compose.yml ni instrucciones de despliegue en producción** |

---

## Non-Compliant Issues — Fix Plan

| # | Criterio | Prompt File | Prioridad |
|---|---|---|---|
| 1 | `dc_env_example` | [001_env_example_template_fn_prompt.md](001_env_example_template_fn_prompt.md) | BASE |
| 2 | `cq_tests_minimos` + `cq_cobertura_alta` | [002_tests_minimos_unit_fn_prompt.md](002_tests_minimos_unit_fn_prompt.md) | NOTABLE |
| 3 | `cq_ci_funcional` (GitHub) | [003_cicd_pipeline_github_fn_prompt.md](003_cicd_pipeline_github_fn_prompt.md) | EXCEPCIONAL |
| 4 | `cq_ci_funcional` (GitLab) | [004_cicd_pipeline_gitlab_fn_prompt.md](004_cicd_pipeline_gitlab_fn_prompt.md) | EXCEPCIONAL |
| 5 | `dc_instrucciones_deploy` | [005_deploy_docker_produc_fn_prompt.md](005_deploy_docker_produc_fn_prompt.md) | EXCEPCIONAL |
| 6 | `fn_deploy_publico_accesible` | [006_deploy_publico_url_fn_prompt.md](006_deploy_publico_url_fn_prompt.md) | EXCEPCIONAL |
| 7 | `dc_diagrama_arquitectura` | [007_arch_diagram_mermaid_fn_prompt.md](007_arch_diagram_mermaid_fn_prompt.md) | NOTABLE |
| 8 | `dc_cambios_ia_documentados` | [008_ia_changes_documented_fn_prompt.md](008_ia_changes_documented_fn_prompt.md) | NOTABLE |
| 9 | `dc_adrs_o_decision_log` + `dc_justificacion_cuantitativa` | [009_adrs_decision_log_fn_prompt.md](009_adrs_decision_log_fn_prompt.md) | EXCEPCIONAL |
| 10 | `cq_arquitectura_razonada` | [010_arch_layers_refactor_fn_prompt.md](010_arch_layers_refactor_fn_prompt.md) | EXCEPCIONAL |

---

## Technical Observations

### Strengths
- Clean Next.js 16 App Router implementation with correct `'use server'` usage
- MongoDB singleton pattern prevents connection pool exhaustion across hot reloads
- Greedy settlement algorithm is well-isolated in `lib/settlement.ts`
- Proper HTTP status codes (409, 404, 400) in API routes
- UI loading/error/not-found boundary files correctly placed

### Weaknesses
- `app/actions.ts` violates single responsibility: mixes input validation, DB access, and redirect logic
- No service layer between Server Actions and MongoDB calls
- No test infrastructure whatsoever (no Jest/Vitest config, no test script)
- GitLab CI pipeline only runs `build` — no test or lint gate
- No Dockerfile means deployment is manual and undocumented
- `.env.example` missing forces developers to guess required variables

### Security Note
- `.env*` is properly gitignored; no credentials found in git log
- MongoDB URI uses `localhost` in `.env.local` (safe for local dev)
- Production MongoDB connection string must be managed via CI/CD secrets
