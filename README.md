# Reparto de Gastos

## Demo en Producción

**[https://expenses-distrib.deviaaps.com](https://expenses-distrib.deviaaps.com)**

> Desplegado en VM de GCP (Ubuntu 24.04) con Docker + Traefik v3.3 + MongoDB 7.0
> Despliegue automático mediante GitHub Actions en cada `push` a `master`

---

Aplicación web **Next.js 16 (App Router) + TypeScript** que permite a grupos de personas registrar gastos compartidos y calcular automáticamente quién le debe a quién, minimizando el número de transferencias necesarias para liquidar las deudas.

---

## 1. Funcionalidades Implementadas

### 1.1 Gestión de Grupos

Creación de grupos con nombre libre (convertido a slug URL-seguro mediante `slugify`). Los grupos se almacenan en MongoDB con un índice único sobre `name`, garantizando que no existan duplicados. La navegación a cualquier grupo existente se realiza directamente desde la página de inicio.

- **Almacenamiento:** Colección `groups` en MongoDB — documento con `name`, `members[]`, `createdAt`
- **Restricción:** Nombres duplicados retornan error `409 Conflict` con mensaje en español
- **Slugificación:** Convierte a minúsculas, reemplaza espacios por `-`, elimina caracteres especiales

### 1.2 Registro de Gastos

Los miembros registran gastos indicando quién pagó, el importe (€) y una descripción. Los gastos se vinculan al grupo mediante `groupId` (ObjectId) y se presentan en orden cronológico inverso.

- **Validación:** El pagador debe ser miembro registrado del grupo (integridad de datos)
- **Almacenamiento:** Colección `expenses` con `groupId`, `paidBy`, `amount`, `description`, `createdAt`
- **Redondeo:** Importes almacenados con 2 decimales máximo (`Math.round(amount * 100) / 100`)

### 1.3 Calculadora de Liquidación

Algoritmo voraz (`lib/settlement.ts`) que calcula el conjunto mínimo de transferencias necesarias para que todos los saldos queden en cero.

- **Complejidad temporal:** O(n log n) — dominada por el ordenamiento de acreedores y deudores
- **Complejidad espacial:** O(n) — listas de acreedores y deudores proporcionales al número de miembros
- **Limitación:** Para grupos > 20 miembros con deudas cruzadas complejas, el resultado puede no ser globalmente óptimo (aunque es óptimo en todos los casos de división igualitaria)
- **Redondeo:** Residuos de punto flotante < 0.01 € se ignoran para evitar transferencias triviales

---

## 2. Estructura del Proyecto

```
expenses-distrib/
├── app/
│   ├── actions.ts                           — Server Actions: createGroup · addMember · addExpense
│   ├── page.tsx                             — Página de inicio: crear o navegar a grupo
│   ├── layout.tsx                           — Layout raíz con metadatos y estilos globales
│   ├── globals.css                          — Tailwind CSS v4: estilos globales
│   ├── api/
│   │   └── groups/
│   │       ├── route.ts                     — POST /api/groups (crear grupo)
│   │       └── [name]/
│   │           ├── route.ts                 — GET /api/groups/:name
│   │           ├── members/route.ts         — POST /api/groups/:name/members
│   │           ├── expenses/route.ts        — GET · POST /api/groups/:name/expenses
│   │           └── settlement/route.ts      — GET /api/groups/:name/settlement
│   ├── components/
│   │   ├── CreateGroupForm.tsx              — Formulario: crear grupo (Client Component)
│   │   ├── NavigateToGroup.tsx              — Input: navegar a grupo existente
│   │   ├── AddMemberForm.tsx                — Formulario: agregar miembro (hidden input groupName)
│   │   ├── AddExpenseForm.tsx               — Formulario: registrar gasto (hidden input groupName)
│   │   ├── ExpenseList.tsx                  — Lista de gastos del grupo
│   │   └── SettlementPanel.tsx              — Panel: quién le debe a quién
│   └── group/[name]/
│       ├── page.tsx                         — Página de grupo (Server Component)
│       ├── loading.tsx                      — UI de carga con Suspense
│       ├── error.tsx                        — Límite de error de React
│       └── not-found.tsx                    — 404 para grupos desconocidos
├── lib/
│   ├── mongodb.ts                           — Singleton MongoClient con inicialización diferida y timeouts
│   ├── settlement.ts                        — Algoritmo voraz de minimización de deudas
│   ├── types.ts                             — Interfaces TypeScript: Group · Expense · Settlement
│   ├── repositories/
│   │   ├── groups.repository.ts             — Capa de acceso a datos: colección groups
│   │   └── expenses.repository.ts           — Capa de acceso a datos: colección expenses
│   └── services/
│       └── groups.service.ts                — Lógica de negocio y validación; retorna ServiceResult<T>
├── __tests__/
│   ├── settlement.test.ts                   — 9 casos para calculateSettlement (bordes incluidos)
│   └── actions.test.ts                      — 6 casos para addMember y addExpense
├── docs/
│   ├── decisions/                           — 4 ADRs en formato MADR
│   ├── ai-review.md                         — Revisión crítica de los cambios generados con IA
│   ├── deploy.md                            — Instrucciones de despliegue en GCP VM
│   └── prompts/
│       └── feature_001_fix_member_stall_prompt.md — Prompt disciplinado: corrección de bug en producción
├── .github/
│   └── workflows/
│       ├── ci.yml                           — GitHub Actions: lint · test · build
│       └── deploy.yml                       — GitHub Actions: despliegue SSH a GCP VM
├── .gitlab-ci.yml                           — GitLab CI/CD: lint · test · build · deploy
├── Dockerfile                               — Build multietapa: deps → builder → runner (non-root)
├── docker-compose.yml                       — Servicio Docker con etiquetas Traefik y red miseia-net
├── .dockerignore                            — Exclusiones: node_modules · .next · .env* · docs
├── next.config.ts                           — Configuración Next.js: output standalone
├── vitest.config.ts                         — Configuración Vitest: alias @/ · coverage v8
├── tsconfig.json                            — TypeScript strict mode + path alias @/
├── package.json                             — Scripts: dev · build · test · test:coverage · lint
├── package-lock.json                        — Lockfile npm: versiones exactas de todas las dependencias
└── .env.example                             — Variables de entorno requeridas (MONGODB_URI · MONGODB_DB)
```

---

## 3. Patrones de Diseño / Arquitectura

### Patrón Singleton — `lib/mongodb.ts`

Un único `MongoClient` por proceso de Node.js. En desarrollo, se persiste en `global._mongoClientPromise` para sobrevivir hot-reloads. La inicialización es **diferida**: el cliente solo se crea cuando `getDb()` es llamado por primera vez en tiempo de ejecución, nunca durante la importación del módulo (evita crasheo en build cuando `MONGODB_URI` no está definida).

### Patrón Repository — `lib/repositories/`

Única capa que importa `getDb()`. Encapsula todas las operaciones MongoDB (`findOne`, `insertOne`, `updateOne`, `find`). Permite sustituir MongoDB por otro motor sin tocar la capa de servicio.

### Patrón Service — `lib/services/groups.service.ts`

Contiene toda la lógica de negocio y validación. Retorna `ServiceResult<T>` (unión discriminada):

```typescript
type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };
```

Los Server Actions y las rutas API solo importan desde la capa de servicio. Nunca llaman a `getDb()` directamente.

### Server Components + Server Actions (Next.js 16)

`app/group/[name]/page.tsx` es un Server Component que obtiene datos de MongoDB directamente en el servidor — sin `useEffect`, sin React Query, sin spinners de carga para el contenido principal. Las mutaciones se realizan a través de Server Actions (`'use server'`), que reciben `(prevState, formData)` con parámetros extra en campos ocultos (`<input type="hidden">`).

### Algoritmo Voraz — `lib/settlement.ts`

Función pura `calculateSettlement(members, expenses)`. Sin efectos secundarios, sin I/O. Complejidad O(n log n).

### 3.1 Dependencias Bloqueadas

El repositorio incluye el lockfile de npm para garantizar instalaciones reproducibles en cualquier entorno:

```
package-lock.json   — versiones exactas de todas las dependencias directas y transitivas
```

Este archivo **está comprometido en el repositorio** y debe actualizarse (`npm install`) cada vez que se modifique `package.json`. Los pipelines de CI/CD usan `npm ci` (no `npm install`) para respetar estrictamente las versiones del lockfile.

---

## 4. Cómo Funciona

Un usuario crea un grupo (ej. `viaje-berlin`), agrega miembros y registra gastos indicando quién pagó. La página del grupo — un React Server Component — consulta MongoDB, ejecuta el algoritmo de liquidación en el servidor y renderiza la interfaz completa en un solo roundtrip. Cuando se envía un formulario, un Server Action muta la base de datos y llama a `revalidatePath`, lo que hace que Next.js vuelva a renderizar la página con datos frescos.

```typescript
// lib/settlement.ts — núcleo del algoritmo
const share = total / members.length;                          // división igualitaria
const balance = Math.round(((paid[member] || 0) - share) * 100) / 100;
if (balance > 0.01) creditors.push({ name: member, amount: balance });
if (balance < -0.01) debtors.push({ name: member, amount: -balance });

// emparejamiento voraz: mayor acreedor con mayor deudor
const transfer = Math.min(creditors[i].amount, debtors[j].amount);
settlements.push({ from: debtors[j].name, to: creditors[i].name, amount: rounded });
```

---

## 5. Primeros Pasos

### Requisitos Previos

- Node.js 20+
- Una instancia de MongoDB (local o Atlas)
- npm 10+ (incluido con Node.js 20)

### Clonar e Instalar

```bash
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib.git
cd MISEIA_1-4-70-expenses-distrib
npm ci
```

> Se usa `npm ci` para respetar `package-lock.json` y garantizar instalación reproducible.

### Variables de Entorno

Copiar `.env.example` a `.env.local` y completar con valores reales:

```bash
cp .env.example .env.local
```

| Variable | Requerida | Descripción |
|---|---|---|
| `MONGODB_URI` | ✅ | URI de conexión MongoDB (local o producción) |
| `MONGODB_DB` | ✅ | Nombre de la base de datos |

### Ejecutar

```bash
# Desarrollo (hot-reload)
npm run dev

# Build de producción
npm run build
npm start
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 6. Salida de Ejemplo

### Caso exitoso — crear grupo y agregar miembros

```
POST /api/groups
Body: { "name": "Viaje Berlín" }
→ 201 { "name": "viaje-berlin" }

POST /api/groups/viaje-berlin/members
Body: { "memberName": "Alice" }
→ 200 { "success": true }

POST /api/groups/viaje-berlin/members
Body: { "memberName": "Bob" }
→ 200 { "success": true }
```

### Caso exitoso — registrar gastos y obtener liquidación

```
POST /api/groups/viaje-berlin/expenses
Body: { "paidBy": "Alice", "amount": 90, "description": "Hotel" }
→ 200 { "success": true }

POST /api/groups/viaje-berlin/expenses
Body: { "paidBy": "Bob", "amount": 30, "description": "Cena" }
→ 200 { "success": true }

GET /api/groups/viaje-berlin/settlement
→ 200 [{ "from": "Charlie", "to": "Alice", "amount": 40 },
        { "from": "Bob", "to": "Alice", "amount": 10 }]
```

### Caso borde — grupo con un solo miembro o sin gastos

```
GET /api/groups/solo-trip/settlement
→ 200 []   ← sin transferencias necesarias
```

### Caso de error — nombre de grupo duplicado

```
POST /api/groups
Body: { "name": "Viaje Berlín" }
→ 409 { "error": "Ya existe un grupo con ese nombre" }
```

### Caso de error — pagador no miembro del grupo

```
POST /api/groups/viaje-berlin/expenses
Body: { "paidBy": "Carlos", "amount": 50, "description": "Taxi" }
→ 400 { "error": "La persona debe ser miembro del grupo" }
```

---

## 7. Requisitos

### 7.1 Requisitos Funcionales

```
FR-001: El usuario anónimo deberá poder crear un grupo de gastos con nombre libre
        de forma que el sistema genere un identificador URL-seguro (slug) y redirija
        al panel del grupo recién creado.

FR-002: El usuario del grupo deberá poder agregar miembros por nombre de forma que
        queden registrados en el documento del grupo y participen en el reparto de gastos.

FR-003: El miembro del grupo deberá poder registrar un gasto indicando quién pagó,
        el importe y una descripción de forma que el gasto quede vinculado al grupo
        y se recalcule automáticamente la liquidación.

FR-004: El sistema deberá validar que el pagador de un gasto sea un miembro registrado
        del grupo de forma que se garantice la integridad de los datos de liquidación.

FR-005: El sistema deberá calcular automáticamente la liquidación mínima de deudas
        tras cada mutación de forma que se minimice el número de transferencias
        necesarias entre miembros.

FR-006: El usuario deberá poder navegar a cualquier grupo existente por nombre desde
        la página de inicio de forma que acceda directamente a su panel sin volver
        a registrar el grupo.

FR-007: La API REST deberá exponer el endpoint POST /api/groups de forma que servicios
        externos puedan crear grupos de forma programática sin usar la interfaz web.

FR-008: La API REST deberá exponer el endpoint GET /api/groups/:name/settlement de forma
        que servicios externos puedan obtener la liquidación calculada en formato JSON.

FR-009: El sistema deberá rechazar la creación de grupos con nombres que produzcan el
        mismo slug con un error 409 de forma que los usuarios reciban retroalimentación
        clara sobre el conflicto.

FR-010: El sistema deberá ordenar los gastos de un grupo en orden cronológico inverso
        (más reciente primero) de forma que el historial sea legible sin desplazamiento.
```

### 7.2 Requisitos No Funcionales

```
NFR-PERF-001: Tiempo de carga del panel de grupo (Server Component + MongoDB) < 300 ms
              en el percentil 95 para grupos con hasta 20 miembros y 100 gastos.
              → Índices MongoDB en name y groupId + renderizado en servidor

NFR-PERF-002: El algoritmo de liquidación debe completar su ejecución en < 1 ms para
              grupos de hasta 20 miembros.
              → Complejidad O(n log n); 20 miembros requieren ~86 operaciones

NFR-AVAIL-001: Disponibilidad del servicio ≥ 99.5% mensual medida desde Traefik.
               → Docker restart:unless-stopped + VM auto-start en GCP

NFR-SEC-001: Todas las rutas HTTP deben servirse exclusivamente mediante HTTPS con
             certificado válido.
             → Traefik redirección 301 permanente + Let's Encrypt DNS-01 (Cloudflare)

NFR-SEC-002: Las credenciales de MongoDB no deben estar presentes en imágenes Docker
             ni en el repositorio de código.
             → Variables de entorno en .env (excluido por .gitignore); .env.example
               documenta las variables requeridas sin valores reales

NFR-SCAL-001: El sistema debe soportar 50 grupos activos concurrentes con hasta
              20 miembros cada uno sin degradación de rendimiento.
              → MongoClient connection pool (maxPoolSize=100 por defecto)

NFR-USAB-001: La interfaz debe renderizarse correctamente en dispositivos con
              viewport ≥ 320px sin scroll horizontal.
              → Tailwind CSS v4 mobile-first; flex-wrap en formularios

NFR-MAINT-001: La cobertura de pruebas del código de dominio (lib/settlement.ts)
               debe mantenerse en ≥ 60% de líneas.
               → Vitest + @vitest/coverage-v8; umbral configurado en vitest.config.ts

NFR-OBS-001: Todos los errores de Server Actions deben ser visibles en los logs del
             contenedor Docker en un plazo máximo de 30 segundos.
             → docker compose logs --follow expenses-distrib

NFR-MAINT-002: Cualquier desarrollador con acceso al repositorio debe poder iniciar
               el entorno de desarrollo local en < 5 minutos siguiendo el README.
               → .env.example + npm ci + npm run dev
```

### 7.3 Requisitos Regulatorios (México)

```
REG-001 — LFPDPPP (Ley Federal de Protección de Datos Personales en Posesión de
          los Particulares, 2010): Los nombres de los miembros del grupo constituyen
          datos personales. El sistema solo debe almacenar los datos estrictamente
          necesarios para la funcionalidad de reparto (nombre, gastos). No se deben
          recopilar datos sensibles adicionales. En producción debe existir un Aviso
          de Privacidad accesible antes de la captura de datos.

REG-002 — Ley de Firma Electrónica Avanzada (LFEA, 2012): Si la aplicación evoluciona
          para registrar compromisos de pago con validez legal entre personas, deberá
          implementar mecanismos de autenticación y no repudio compatibles con la LFEA.
          La versión actual es informativa y no genera obligaciones jurídicas.

REG-003 — NOM-151-SCFI-2016 (Conservación de mensajes de datos y digitalización de
          documentos): Los registros de gastos almacenados en MongoDB con campo
          createdAt de tipo BSON Date cumplen el requisito de marca temporal. Para
          uso con fines fiscales o de auditoría, se deberá implementar una cadena de
          custodia digital certificada por un tercero autorizado.
```

### 7.4 Requisitos Operativos

```
OPS-001: Despliegue mediante CI/CD (GitHub Actions + GitLab CI/CD). Cualquier fallo
         en las etapas lint, test o build detendrá automáticamente el despliegue.
         El pipeline debe completarse en < 5 minutos.

OPS-002: Los contenedores Docker deben configurarse con restart: unless-stopped para
         reiniciarse automáticamente tras reinicios del servidor.
         RPO < 1 hora · RTO < 30 minutos para fallos de contenedor.

OPS-003: El sistema debe registrar todos los eventos de error en los logs del
         contenedor (stdout/stderr) y dichos logs deben estar disponibles vía
         docker compose logs en un plazo máximo de 30 segundos tras el evento.

OPS-004: El procedimiento de recuperación ante desastres para fallos de VM debe
         restaurar el servicio en < 2 horas: iniciar VM (gcloud compute instances
         start) + verificar contenedores + confirmar HTTP 200 en URL pública.

OPS-005: La base de datos MongoDB debe estar en la red Docker miseia-net, aislada
         del tráfico externo. El puerto 27020 solo debe usarse para administración
         desde IPs autorizadas, nunca expuesto en la API pública.
```

### 7.5 Atributos de Calidad

#### 7.5.1 Rendimiento: Latencia del Panel de Grupo [PERF-GROUP-PAGE]

**Atributo de Calidad:** Rendimiento
**Métrica:** Latencia (ms) — tiempo desde solicitud HTTP hasta primer byte útil (TTFB)

**Especificación:**
- Percentil 99: < 500 ms
- Percentil 95: < 300 ms
- Percentil 50: < 150 ms

**Condiciones:**
- Grupo con hasta 20 miembros y 100 gastos en MongoDB
- MongoDB en la misma red Docker (miseia-net) que la aplicación
- Carga: hasta 10 solicitudes concurrentes

**Excepciones:**
- Primera solicitud tras reinicio de contenedor (cold start): < 2 000 ms aceptable
- Solicitudes durante `git pull + docker compose up --build`: sin SLA durante deploy

**Verificación:**
- Prueba de carga con k6 o Artillery desde una máquina externa
- Monitoreo de TTFB con curl: `curl -s -o /dev/null -w "%{time_starttransfer}" URL`

#### 7.5.2 Escalabilidad: Grupos Concurrentes [SCAL-CONCURRENT-GROUPS]

**Atributo de Calidad:** Escalabilidad
**Métrica:** Número de grupos activos concurrentes sin degradación de rendimiento

**Especificación:**
- Mínimo 50 grupos concurrentes sin aumento de latencia > 20%
- El pool de conexiones MongoDB (maxPoolSize=100) debe cubrir la demanda
- Sin estado en el contenedor Next.js (posible escalar horizontalmente)

**Condiciones:**
- VM GCP n2-custom-4-16384 (4 vCPU, 16 GB RAM)
- MongoDB en el mismo host con connection pool por defecto

**Excepciones:**
- Picos de tráfico virales: se acepta degradación hasta 1 000 ms P95 si duran < 5 min
- Grupos con > 500 gastos: latencia puede superar el umbral P50 aceptablemente

**Verificación:** Prueba de carga con 50 usuarios virtuales concurrentes (k6)

#### 7.5.3 Confiabilidad: Consistencia del Algoritmo de Liquidación [REL-SETTLEMENT]

**Atributo de Calidad:** Confiabilidad
**Métrica:** Tasa de error en el cálculo de liquidación (errores / total de cálculos)

**Especificación:**
- Tasa de error: 0% (función pura, sin I/O, completamente determinista)
- El algoritmo debe producir el mismo resultado para los mismos inputs siempre
- La suma de todas las transferencias debe igualar la suma de saldos positivos (±0.01 €)

**Condiciones:**
- Grupos de 2 a 20 miembros
- Gastos con importes entre 0.01 € y 10 000 €
- Sin gastos con importe negativo

**Excepciones:**
- Residuos de punto flotante < 0.01 € se ignoran deliberadamente (diseño intencional)

**Verificación:** Suite Vitest con 9 casos incluyendo bordes (empty, single, three-way)

#### 7.5.4 Disponibilidad: Uptime del Servicio [AVAIL-SERVICE]

**Atributo de Calidad:** Disponibilidad
**Métrica:** Porcentaje de uptime mensual

**Especificación:**
- Uptime objetivo: ≥ 99.5% mensual (~3.6 horas de inactividad permitidas/mes)
- Tiempo de recuperación ante fallo de contenedor: < 30 segundos (restart automático)
- Tiempo de recuperación ante fallo de VM: < 2 horas (procedimiento manual documentado)

**Condiciones:**
- Infraestructura: GCP VM + Docker + Traefik
- Sin balanceador de carga activo-activo (instancia única)

**Excepciones:**
- Ventanas de mantenimiento planificadas (despliegues CI/CD): < 60 segundos de downtime
- Reinicios de VM programados por GCP: fuera de SLA

**Verificación:** Monitoreo HTTP externo cada 5 minutos (UptimeRobot o similar)

#### 7.5.5 Seguridad: Protección de Credenciales [SEC-CREDENTIALS]

**Atributo de Calidad:** Seguridad
**Métrica:** Número de credenciales expuestas en código fuente o imágenes Docker

**Especificación:**
- 0 credenciales en código fuente (verificado por `.gitignore` + `git-secrets`)
- 0 credenciales en imágenes Docker (variables inyectadas en runtime)
- 100% de rutas HTTP redirigidas a HTTPS (Traefik middleware)

**Condiciones:**
- Repositorio público en GitHub y GitLab
- Imagen Docker publicada localmente (no en registro público)

**Excepciones:**
- `.env.example` contiene placeholders sin valores reales: permitido y requerido

**Verificación:**
- `git log --all --full-diff -p | grep -i "mongodb://"` → debe retornar vacío
- Scan de imagen: `docker history IMAGE` no debe mostrar URIs de conexión

### 7.6 Criterios de Aceptación BDD

```gherkin
Feature: Gestión de grupos de gastos
  
  Scenario: Crear un grupo con nombre válido
    Given el usuario está en la página de inicio
    And el campo de nombre de grupo está vacío
    When el usuario escribe "Viaje Berlín" y envía el formulario
    Then el sistema crea el grupo con slug "viaje-berlin"
    And redirige al usuario a la página /group/viaje-berlin
    And el grupo aparece en MongoDB con members: []

  Scenario: Intentar crear un grupo duplicado
    Given existe un grupo con slug "viaje-berlin"
    When el usuario intenta crear otro grupo con nombre "Viaje Berlin"
    Then el sistema retorna un error 409
    And el mensaje de error dice "Ya existe un grupo con ese nombre"
    And no se crea ningún documento nuevo en la colección groups

  Scenario: Agregar un miembro al grupo
    Given existe el grupo "viaje-berlin" con 0 miembros
    When el usuario agrega el miembro "Alice"
    Then el sistema actualiza el documento del grupo con members: ["Alice"]
    And el formulario se limpia automáticamente (useEffect + formRef.reset)
    And la página se re-renderiza mostrando a Alice en la lista

  Scenario: Registrar un gasto con pagador inválido
    Given existe el grupo "viaje-berlin" con miembros ["Alice", "Bob"]
    When el usuario intenta registrar un gasto con paidBy "Carlos"
    Then el sistema retorna un error 400
    And el mensaje dice "La persona debe ser miembro del grupo"
    And no se crea ningún documento en la colección expenses

  Scenario: Calcular la liquidación mínima para tres miembros
    Given existe el grupo "viaje-berlin" con miembros ["Alice", "Bob", "Charlie"]
    And se han registrado los gastos: Alice pagó 90 €, Bob pagó 30 €
    When el usuario carga la página del grupo
    Then el panel de liquidación muestra exactamente 2 transferencias
    And la suma total de transferencias es 50 €
    And todas las transferencias tienen a Alice como destino
```

---

## 8. Especificaciones

### 8.1 Desarrollo Orientado por Especificaciones

#### Especificación Funcional: Sistema de Reparto de Gastos

**Caso de Uso: Crear Grupo**
**Actores:** Usuario anónimo, Sistema MongoDB

**Precondiciones:**
- El usuario tiene acceso a la aplicación web
- La conexión con MongoDB está disponible

**Flujo Principal:**
1. El usuario escribe un nombre de grupo en el formulario de la página de inicio
2. El formulario envía el nombre al Server Action `createGroup`
3. El servicio aplica `slugify` al nombre
4. El repositorio ejecuta `insertOne` en la colección `groups`
5. Si no hay conflicto, el servicio retorna `{ ok: true, data: { slug } }`
6. El Server Action redirige al usuario a `/group/{slug}`

**Criterios de Aceptación:**
- Dado un usuario con nombre "Viaje Berlín"
- Cuando el formulario se envía
- Entonces existe un documento `{ name: "viaje-berlin", members: [], createdAt: Date }`
- Y el usuario es redirigido a `/group/viaje-berlin`

---

**Caso de Uso: Calcular Liquidación**
**Actores:** Usuario del grupo, Motor de liquidación

**Precondiciones:**
- El grupo existe con al menos 2 miembros
- Existen al menos 2 gastos con pagadores distintos

**Flujo Principal:**
1. El usuario carga la página `/group/{name}`
2. El Server Component llama a `groupsService.getSettlement(name)`
3. El servicio obtiene el grupo y sus gastos via repositorios
4. El servicio llama a `calculateSettlement(members, expenses)`
5. El algoritmo calcula saldos netos, ordena acreedores y deudores
6. El resultado se renderiza en el componente `SettlementPanel`

**Criterios de Aceptación:**
- Dado "Alice pagó 90, Bob pagó 30, Charlie pagó 0" (total 120, cuota 40)
- Cuando se carga el panel de liquidación
- Entonces se muestran máximo 2 transferencias
- Y la suma total de importes es 50 €

---

#### Especificación Estructural

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cliente (Browser)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Client Components (React 19)                             │   │
│  │  AddMemberForm · AddExpenseForm · CreateGroupForm         │   │
│  │  useActionState(action, null) + <input type="hidden">     │   │
│  └────────────────────┬────────────────────────────────────-─┘   │
└───────────────────────│────────────────────────────────────────-─┘
                        │  POST (Server Action) / HTTP
┌───────────────────────▼─────────────────────────────────────────┐
│                   Servidor Next.js 16                            │
│                                                                  │
│  ┌──────────────────┐   ┌──────────────────────────────────┐    │
│  │  Server Components│   │  Server Actions (app/actions.ts)  │    │
│  │  page.tsx        │   │  createGroup · addMember          │    │
│  │  (SSR, no hooks) │   │  addExpense                       │    │
│  └────────┬─────────┘   └──────────────┬───────────────────┘    │
│           │                             │                        │
│  ┌────────▼─────────────────────────────▼───────────────────┐   │
│  │              Capa de Servicio (lib/services/)             │   │
│  │  groups.service.ts — ServiceResult<T>                     │   │
│  │  Validación · Slugificación · Integridad de datos         │   │
│  └────────────────────────┬──────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐   │
│  │             Capa de Repositorio (lib/repositories/)        │   │
│  │  groups.repository.ts · expenses.repository.ts             │   │
│  │  → única capa que importa getDb()                         │   │
│  └────────────────────────┬──────────────────────────────────┘   │
└───────────────────────────│──────────────────────────────────────┘
                            │  MongoClient (TCP)
┌───────────────────────────▼──────────────────────────────────────┐
│                   MongoDB 7.0 (Docker: mongodb:27017)            │
│   Colección: groups  → { name, members[], createdAt }            │
│   Colección: expenses → { groupId, paidBy, amount, desc, date }  │
│   Índice: groups.name (unique) · expenses.groupId                │
└──────────────────────────────────────────────────────────────────┘

Módulo independiente:
┌──────────────────────────────────┐
│  lib/settlement.ts               │
│  calculateSettlement(m[], e[])   │
│  Función pura · O(n log n)       │
│  Sin I/O · Sin efectos           │
└──────────────────────────────────┘
```

---

#### Especificación de Comportamiento — Máquinas de Estado

**Ciclo de vida de un grupo:**

```mermaid
stateDiagram-v2
    [*] --> Inexistente
    Inexistente --> Creado : createGroup(name) / slug generado
    Creado --> ConMiembros : addMember(name) / members.push
    ConMiembros --> ConMiembros : addMember(name) / members.push
    ConMiembros --> ConGastos : addExpense(...) / expenses.insertOne
    ConGastos --> ConGastos : addExpense(...) / expenses.insertOne
    ConGastos --> ConGastos : addMember(name) / members.push
    ConGastos --> Liquidado : getSettlement() / calculateSettlement
    Liquidado --> ConGastos : addExpense(...) / nuevo gasto
    Liquidado --> ConMiembros : addMember(name) / rebalance pendiente
```

**Ciclo de vida de un Server Action:**

```mermaid
stateDiagram-v2
    [*] --> Inactivo
    Inactivo --> Pendiente : Usuario envía formulario / isPending=true
    Pendiente --> Validando : Server Action recibe (prevState, formData)
    Validando --> ErrorValidacion : campo vacío o inválido
    Validando --> LlamandoServicio : campos válidos
    LlamandoServicio --> ErrorServicio : service.ok === false
    LlamandoServicio --> Exitoso : service.ok === true
    ErrorValidacion --> Inactivo : state={error} / isPending=false
    ErrorServicio --> Inactivo : state={error} / isPending=false
    Exitoso --> Inactivo : revalidatePath() / isPending=false / form.reset()
```

---

#### Especificación Operativa

**Despliegue**
- Build multietapa Docker (deps → builder → runner, usuario non-root `nextjs`)
- Next.js `output: 'standalone'` — imagen final sin `node_modules` completo
- CI/CD automático: GitHub Actions en cada `push` a `master`
- Rollback: `git revert + push` → el pipeline despliega la versión anterior

**Escalado**
- Instancia única en GCP VM n2-custom-4-16384
- Sin escala horizontal en la versión actual
- Si CPU > 80% sostenido: considerar réplicas con load balancer en Traefik

**Monitoreo**
- Logs del contenedor: `docker compose logs -f expenses-distrib`
- URL pública: `curl -s -o /dev/null -w "%{http_code}" https://expenses-distrib.deviaaps.com`
- Latencia P95 objetivo: < 300 ms · Tasa de error objetivo: < 0.1%

**Runbook: Aplicación no responde (HTTP 5xx o timeout)**
1. Verificar estado del contenedor: `docker compose ps`
2. Revisar logs recientes: `docker compose logs --tail=50 expenses-distrib`
3. Verificar conexión MongoDB: `docker compose exec expenses-distrib node -e "require('./lib/mongodb').getDb().then(()=>console.log('OK'))"`
4. Si contenedor caído: `docker compose up -d`
5. Si VM detenida: `gcloud compute instances start ubuntu-vm-docker28 --zone=us-south1-c`
6. Confirmar recuperación: `curl https://expenses-distrib.deviaaps.com`

---

### 8.2 Invariantes y Contratos

**Contrato: `calculateSettlement(members, expenses)`**

```
PRECONDICIÓN:
- members: string[] no nulo; puede estar vacío
- expenses: Expense[] no nulo; puede estar vacío
- Todos los expense.paidBy deben ser strings no vacíos
- Todos los expense.amount deben ser números positivos

POSTCONDICIÓN:
- Retorna Settlement[] (puede ser vacío)
- Para cada s en resultado: s.from ≠ s.to
- La suma de s.amount ≈ suma de saldos positivos (±0.01 por redondeo)
- Ningún miembro aparece como deudor y acreedor en el mismo resultado

INVARIANTE:
- El número de elementos nunca excede (members.length - 1)
- members vacío → resultado siempre []
- expenses vacío → resultado siempre []
- Gastos perfectamente balanceados → resultado []

EJEMPLOS:
- calculateSettlement([], [expense]) → []
- calculateSettlement(['Alice'], [expense(Alice, 100)]) → []
- calculateSettlement(['Alice','Bob'], [expense(Alice, 100)]) → [{from:'Bob',to:'Alice',amount:50}]
- calculateSettlement(['A','B','C'], [expense(A,90),expense(B,30)]) → [{from:'C',to:'A',amount:40},{from:'B',to:'A',amount:10}]
```

**Contrato: `createGroup(name)`**

```
PRECONDICIÓN:
- name: string no nulo y no vacío tras trim()
- slugify(name).length > 0 (el nombre contiene caracteres alfanuméricos)

POSTCONDICIÓN:
- Si éxito: { ok: true, data: { slug } } donde slug = slugify(name)
- Si nombre duplicado: { ok: false, error: '...', status: 409 }
- Si nombre inválido: { ok: false, error: '...', status: 400 }
- El documento en MongoDB tiene members: [] y createdAt: Date

INVARIANTE:
- El slug siempre es lowercase y solo contiene [a-z0-9-]
- Dos nombres distintos que producen el mismo slug son equivalentes (conflicto)
- createGroup nunca lanza excepciones — siempre retorna ServiceResult<T>

EJEMPLOS:
- createGroup("Viaje Berlín") → { ok: true, data: { slug: "viaje-berlin" } }
- createGroup("") → { ok: false, error: "El nombre del grupo es obligatorio" }
- createGroup("!!!") → { ok: false, error: "Nombre de grupo no válido" }
- createGroup("viaje-berlin") [duplicado] → { ok: false, error: "Ya existe...", status: 409 }
```

---

### 8.3 Registros de Decisiones de Arquitectura (ADRs)

#### ADR-001: Next.js 16 App Router con Server Components

**Estado:** Aceptado — Fecha: 2026-04-21

**Contexto:** La aplicación necesita un framework web para múltiples páginas. La página de detalle del grupo obtiene datos de MongoDB y ejecuta el algoritmo de liquidación — es intensiva en lectura y debe renderizarse rápidamente sin spinners del lado del cliente.

**Opciones Consideradas:**
1. **Next.js Pages Router** — maduro, documentado, pero con boilerplate `getServerSideProps` y sin Server Components
2. **React SPA + Express API** — desacoplado, pero requiere dos deployments y CORS
3. **Remix** — loaders basados en archivos, buen DX, pero ecosistema más pequeño
4. **Next.js 16 App Router** ← **elegido**

**Decisión:** Next.js 16 con App Router y Server Components.

**Consecuencias Positivas:**
- Página de grupo: MongoDB + liquidación en un solo roundtrip servidor
- Sin librería de fetching del lado del cliente (React Query, SWR)
- TypeScript compartido entre servidor y cliente sin serialización extra

**Consecuencias Negativas:**
- Server Components no pueden usar hooks — los formularios requieren Client Components
- El caché del App Router es más complejo que el del Pages Router

---

#### ADR-002: MongoDB sobre PostgreSQL para grupos de gastos

**Estado:** Aceptado — Fecha: 2026-04-21

**Contexto:** La lista de miembros es variable (2–20 nombres), siempre se accede junto al documento del grupo, y el patrón de lectura principal es: dado un nombre de grupo, obtener el documento y todos sus gastos.

**Evidencia Cuantitativa:**

| Métrica | MongoDB (miembros embebidos) | PostgreSQL (tabla normalizada) |
|---|---|---|
| Queries por carga de página | **1** | **2** (GROUP + JOIN members) |
| Latencia estimada (local) | ~2 ms | ~4 ms (roundtrip extra) |
| Almacenamiento (10 miembros) | ~250 bytes | ~380 bytes (rows + FK index) |

**Conclusión:** MongoDB reduce los roundtrips de base de datos en **50%** para el patrón de lectura principal. El array de miembros variable se mapea naturalmente a BSON sin migraciones de esquema.

---

#### ADR-003: Server Actions para mutaciones de formularios

**Estado:** Aceptado — Fecha: 2026-04-21

**Contexto:** Los formularios de creación de grupo, adición de miembros y registro de gastos necesitan persistir datos en MongoDB. La alternativa clásica es un fetch POST a una ruta API desde un `useEffect` o un manejador de eventos.

**Decisión:** Server Actions (`'use server'`) con `useActionState` de React 19.

**Consecuencias Positivas:**
- Sin fetch manual del lado del cliente
- `revalidatePath` invalida el caché y re-renderiza la página automáticamente
- Funciona con JavaScript deshabilitado (progressive enhancement)
- Parámetros extra (groupName) se pasan como `<input type="hidden">`, no con `.bind()`

**Consecuencias Negativas:**
- Las pruebas requieren mockear módulos de Next.js (`next/cache`, `next/navigation`)
- El patrón de `.bind()` para currying está **deprecado en Next.js 16** — usar hidden inputs

---

#### ADR-004: Algoritmo Voraz para Minimización de Deudas

**Estado:** Aceptado — Fecha: 2026-04-21

**Contexto:** Dado un conjunto de saldos netos, encontrar el número mínimo de transferencias. El problema es NP-difícil en el caso general; para la división igualitaria, el algoritmo voraz es óptimo.

**Comparación de Complejidad:**

| Tamaño (n) | Fuerza bruta (n!) | Voraz O(n log n) | Factor de mejora |
|---|---|---|---|
| 5 miembros | 120 | ~12 ops | 10× |
| 10 miembros | 3 628 800 | ~33 ops | 110 000× |
| 20 miembros | 2.4 × 10¹⁸ | ~86 ops | inviable |

**Decisión:** Algoritmo voraz de dos punteros — ordenar acreedores y deudores, emparejar el mayor con el mayor iterativamente.

---

#### ADR-005: Inicialización Diferida de MongoClient con Timeouts Explícitos

**Estado:** Aceptado — Fecha: 2026-06-26

**Contexto:** La versión original de `lib/mongodb.ts` creaba un `new MongoClient(uri)` a nivel de módulo, sin opciones de timeout. Esto causó dos problemas críticos en producción: (1) crash del build de Next.js cuando `MONGODB_URI` no estaba definida en el entorno de construcción; (2) el Server Action `addMember` quedaba bloqueado indefinidamente (`isPending = true`) cuando MongoDB tardaba en responder, ya que `serverSelectionTimeoutMS` por defecto es 30 segundos.

**Opciones Consideradas:**
1. **Middleware de timeout** — envolver `getDb()` con `Promise.race` + timeout manual
2. **Cliente creado a nivel de módulo** — simple, pero crashea el build
3. **Inicialización diferida con opciones explícitas** ← **elegido**

**Decisión:** `getClientPromise()` es una función privada invocada solo desde `getDb()`. El cliente se crea en tiempo de ejecución (no importación). Se configuran `serverSelectionTimeoutMS: 5 000`, `connectTimeoutMS: 10 000`, `socketTimeoutMS: 45 000`.

**Consecuencias Positivas:**
- Build de Next.js exitoso aunque `MONGODB_URI` no esté definida en tiempo de compilación
- Fallo rápido: si MongoDB no responde en 5 s, el Server Action retorna error en lugar de bloquearse
- Los errores de MongoDB llegan al usuario vía `state.error` en lugar de colgarse

**Consecuencias Negativas:**
- Primera llamada a `getDb()` en producción puede tardar hasta 5 s si MongoDB está caído (comportamiento deseado — falla rápido)

---

## 9. Pruebas Unitarias e Integración

### Alcance y Cobertura

```bash
npm test              # Ejecuta todos los tests una vez
npm run test:watch    # Modo interactivo (desarrollo)
npm run test:coverage # Genera reporte de cobertura en coverage/
```

| Archivo | % Sentencias | % Ramas | % Funciones | % Líneas |
|---|---|---|---|---|
| `lib/settlement.ts` | **100%** | 95% | **100%** | **100%** |
| `app/actions.ts` | 78.57% | 80% | 66.66% | 78.57% |
| `lib/mongodb.ts` | 0% | 0% | 0% | 0% (requiere MongoDB real) |
| `lib/repositories/*` | 0% | 100% | 0% | 0% (requiere MongoDB real) |
| `lib/services/*` | 0% | 0% | 0% | 0% (requiere MongoDB real) |
| **Total global** | **43.06%** | **36.48%** | **28.57%** | **38.88%** |

**Cobertura de código de dominio** (`lib/settlement.ts` — lógica de negocio pura): **100% de líneas**.

### Archivos de Prueba

**`__tests__/settlement.test.ts`** — 9 casos para `calculateSettlement`:
- Lista de miembros vacía → `[]`
- Lista de gastos vacía → `[]`
- Miembro único que pagó todo → `[]`
- Dos miembros, liquidación simple → `[{from:'Bob',to:'Alice',amount:50}]`
- Gastos perfectamente balanceados → `[]`
- Tres miembros, número mínimo de transferencias (≤ 2)
- Tres miembros, importes correctos y destino correcto
- Redondeo a 2 decimales (caso 100/3)
- Múltiples pagadores con deudor único

**`__tests__/actions.test.ts`** — 6 casos para Server Actions:
- `addMember`: error cuando el servicio falla
- `addMember`: éxito cuando el servicio responde ok
- `addMember`: error cuando falta `groupName` en FormData
- `addExpense`: error de validación del servicio
- `addExpense`: importe parseado correctamente a float
- `addExpense`: error cuando falta `groupName` en FormData

### Dependencias de Prueba

```json
"devDependencies": {
  "vitest": "^4.1.9",
  "@vitest/coverage-v8": "^4.1.9"
}
```

El runner de tests usa el entorno `node` (sin DOM), con alias `@/` resuelto al directorio raíz del proyecto via `vitest.config.ts`.

---

## 10. Despliegue

### 10.1 URL de Despliegue

```
https://expenses-distrib.deviaaps.com
```

Desplegado en GCP VM (Ubuntu 24.04) · Docker + Traefik v3.3 · MongoDB 7.0 · TLS automático via Let's Encrypt + Cloudflare DNS-01.

### 10.2 Lockfile

El repositorio incluye `package-lock.json` comprometido en control de versiones. Esto garantiza instalaciones **reproducibles y deterministas** en todos los entornos (desarrollo, CI/CD, producción).

```
package-lock.json   — versiones exactas de todas las dependencias npm (directas y transitivas)
```

Los pipelines de CI/CD usan `npm ci` en lugar de `npm install` para respetar estrictamente el lockfile y detectar discrepancias entre `package.json` y `package-lock.json`.

### 10.3 Instrucciones de Despliegue

#### Despliegue Local con Docker

```bash
# Construir imagen
docker build -t expenses-distrib .

# Ejecutar con variables de entorno
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://localhost:27017 \
  -e MONGODB_DB=expenses_distrib \
  expenses-distrib

# Abrir http://localhost:3000
```

#### Despliegue en GCP VM (primera vez)

```bash
# 1. Conectar a la VM
ssh -i C:/ubuntuiso/.ssh/vboxuser gcvmuser@34.174.56.186

# 2. Clonar el repositorio
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-70-expenses-distrib.git ~/MISEIA170_expenses-distrib
cd ~/MISEIA170_expenses-distrib

# 3. Crear archivo de entorno (valores reales de producción)
cp .env.example .env
nano .env  # MONGODB_URI=mongodb://admin:pass@mongodb:27017/?authSource=admin

# 4. Iniciar el contenedor
docker compose up -d --build

# 5. Verificar
curl https://expenses-distrib.deviaaps.com
```

#### Despliegue Subsecuente (manual)

```bash
ssh -i C:/ubuntuiso/.ssh/vboxuser gcvmuser@34.174.56.186
cd ~/MISEIA170_expenses-distrib
git pull origin master
docker compose down
docker compose up -d --build
docker compose logs -f expenses-distrib
```

#### Despliegue Automático (GitHub Actions)

Cada `push` a `master` activa el workflow `.github/workflows/deploy.yml`:
1. Checkout del código
2. SSH a la VM via `webfactory/ssh-agent`
3. `git pull + docker compose down + docker compose up -d --build`

Ver instrucciones completas en [`docs/deploy.md`](docs/deploy.md).

---

## 11. Mejoras Potenciales

- **Exportar a PDF:** Generar un resumen de liquidación descargable con la lista de transferencias y el historial de gastos del grupo
- **Paginación de gastos:** Para grupos con > 50 gastos, implementar cursor-based pagination en la colección `expenses` para mantener el rendimiento
- **Filtros de gastos:** Filtrar por pagador, rango de fechas o descripción
- **Editar / eliminar gastos:** Actualmente los gastos son inmutables; agregar `PATCH /api/groups/:name/expenses/:id` y `DELETE`
- **Autenticación:** Proteger grupos con contraseña o autenticación mediante Magic Link para evitar acceso no autorizado
- **Soporte de divisas:** Actualmente solo € — agregar selector de moneda por grupo
- **Historial de liquidaciones:** Marcar una liquidación como "pagada" y archivar el estado del grupo en ese punto
- **Notificaciones:** Enviar un correo o mensaje a los miembros con el resumen de su deuda via la API de MailHog/SMTP disponible en la infraestructura
- **PWA:** Convertir la app en Progressive Web App para uso offline y acceso desde pantalla de inicio móvil

---

## 12. Cambios Documentados (Revisión Crítica de Asistencia IA)

Ver documento completo en [`docs/ai-review.md`](docs/ai-review.md).

### Cambios Aceptados con Modificaciones

**1. Slugificación de nombres de grupo — caso borde de caracteres especiales**

La IA generó `name.toLowerCase().replace(/\s+/g, '-')` sin eliminar caracteres no alfanuméricos. En producción, un nombre como `"Café & Amigos"` generaría el slug `"café-&-amigos"`, rompiendo el índice único de MongoDB y la URL.

Cambio aplicado: se agregó `.replace(/[^a-z0-9-]/g, '')` después de normalizar espacios. Además se agregó la validación de longitud cero post-slugificación.

```typescript
// IA generó:
return name.toLowerCase().trim().replace(/\s+/g, '-');

// Versión final (corregida):
return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
```

**2. Manejo del error 11000 de MongoDB (nombre duplicado)**

La IA retornaba el error bruto `MongoServerError: E11000 duplicate key` directamente al usuario. En producción esto expone detalles internos de infraestructura.

Cambio aplicado: se detecta el código de error `11000` y se retorna un mensaje en español con status 409.

```typescript
// Versión corregida:
if ((error as { code: number }).code === 11000) {
  return { ok: false, error: 'Ya existe un grupo con ese nombre', status: 409 };
}
```

**3. Validación de existencia del pagador**

La IA omitió verificar que el pagador de un gasto sea miembro del grupo. Sin esta validación, es posible registrar gastos con pagadores ficticios que corrompen el cálculo de liquidación.

Cambio aplicado: verificación explícita `group.members.includes(paidBy)` antes de insertar el gasto.

**4. Inicialización diferida de MongoClient (bug crítico de producción)**

La IA generó `const client = new MongoClient(uri)` a nivel de módulo. En el build de producción con `NODE_ENV=production`, Next.js importa módulos durante la fase de recolección de datos estáticos, cuando `MONGODB_URI` no está definida. Resultado: `TypeError: Cannot read properties of undefined (reading 'startsWith')`.

Cambio aplicado: la creación del cliente se movió dentro de `getClientPromise()`, invocada solo desde `getDb()` en tiempo de ejecución. Ver ADR-005.

**5. Patrón `.bind()` deprecado en Next.js 16**

La IA inicialmente usó `addMember.bind(null, groupName)` para pasar `groupName` al Server Action. Este patrón genera una advertencia de deprecación en Next.js 16 (`feature_collector.js:23`) y causó que el formulario de agregar miembro se bloqueara indefinidamente en producción.

Cambio aplicado: las firmas de `addMember` y `addExpense` se simplificaron a `(_prevState, formData)`. El `groupName` se pasa como `<input type="hidden">` en el formulario.

### Sugerencias de IA Rechazadas

| Sugerencia | Razón del rechazo |
|---|---|
| Usar Mongoose en lugar del driver raw | Agrega abstracción innecesaria para un modelo de datos simple; TypeScript + raw driver proveen tipado equivalente |
| Redux para estado global del cliente | La arquitectura de Server Components elimina la necesidad de estado global en el cliente |
| Versionado de API (v1, v2) | Sobreingeniería para un proyecto de módulo educativo con una sola versión en producción |
| Agregar logging estructurado (Winston/Pino) | El nivel de observabilidad de `docker compose logs` es suficiente para la escala actual |
| Separar el algoritmo en un paquete npm independiente | Prematura abstracción; `lib/settlement.ts` es una función de 59 líneas sin dependencias externas |
