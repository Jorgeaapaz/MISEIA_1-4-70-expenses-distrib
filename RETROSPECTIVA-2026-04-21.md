# Retrospectiva de Sesion — 2026-04-21
### Expense Splitting App (Reparto de Gastos entre Amigos)

## Resumen / Overview
Se construyo desde cero una aplicacion completa de reparto de gastos entre amigos usando **Next.js 16.2.4**, **React 19.2.4**, **MongoDB native driver** y **Tailwind CSS v4**. El proyecto partia de un scaffold limpio de `create-next-app`. La sesion fue exitosa: la aplicacion compila sin errores y todas las funcionalidades estan implementadas.

**Funcionalidades implementadas:**
- Crear grupos de gastos con nombre unico (slug URL-friendly)
- Acceder a un grupo por su nombre
- Anadir miembros a un grupo
- Registrar gastos (importe + descripcion + quien pago)
- Liquidacion en tiempo real con algoritmo greedy que minimiza transacciones

## Proceso de instalacion / Installation

**Prerequisitos:**
- Node.js >= 20.9.0
- MongoDB instalado y corriendo en local (`mongodb://localhost:27017`)

```bash
# 1. Instalar dependencias del proyecto (ya existia package.json de create-next-app)
npm install

# 2. Instalar MongoDB native driver
npm install mongodb
```

**3. Configurar variables de entorno:** Crear archivo `.env.local` en la raiz del proyecto:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=expenses-distrib
```

> **Nota:** `.env*` ya esta incluido en `.gitignore`, por lo que `.env.local` nunca se sube al repositorio. Next.js carga automaticamente `.env.local` en desarrollo y produccion.

## Arquitectura y estructura de archivos / Architecture & File Structure

**Stack:** Next.js 16 (App Router) + MongoDB native driver + Tailwind CSS v4 + TypeScript

**Consideraciones Next.js 16:**
- `params` y `searchParams` son **Promises** (requieren `await`)
- Server Actions con `'use server'` y `revalidatePath` para mutaciones
- Acceso directo a DB desde Server Components (sin self-fetch)
- `useActionState` (React 19) para gestion de estado en formularios
- Las acciones usadas con `useActionState` requieren `(prevState, formData)` como firma

**Variables de entorno (`.env.local`):**
- `MONGODB_URI` — URI de conexion a MongoDB
- `MONGODB_DB` — Nombre de la base de datos

**Base de datos:** MongoDB local, database `expenses-distrib`
- Coleccion `groups`: `{ _id, name (unique slug), members: string[], createdAt }`
- Coleccion `expenses`: `{ _id, groupId: ObjectId, paidBy, amount, description, createdAt }`
- Indices: unique en `groups.name`, index en `expenses.groupId` (creados automaticamente)

**Archivos creados/modificados:**

```
.env.local              # Variables de entorno (MONGODB_URI, MONGODB_DB) - NO se sube a git

lib/
  types.ts              # Interfaces TypeScript: Group, Expense, Settlement
  mongodb.ts            # Singleton de conexion MongoDB (lee de env vars)
  settlement.ts         # Algoritmo greedy de liquidacion (funcion pura)

app/
  layout.tsx            # (modificado) Metadata "Reparto de Gastos", lang="es"
  globals.css           # (modificado) Tailwind + variables CSS simplificadas
  page.tsx              # (reescrito) Home: crear grupo + acceder a grupo existente
  actions.ts            # Server Actions: createGroup, addMember, addExpense

  components/
    CreateGroupForm.tsx   # Client: formulario crear grupo con useActionState
    NavigateToGroup.tsx   # Client: navegacion a grupo existente con useRouter
    AddMemberForm.tsx     # Client: anadir miembro con useActionState
    AddExpenseForm.tsx    # Client: anadir gasto (select pagador, importe, desc)
    SettlementPanel.tsx   # Server: panel de liquidacion (quien debe a quien)
    ExpenseList.tsx       # Server: tabla de gastos

  group/[name]/
    page.tsx              # Dashboard del grupo (Server Component async)
    loading.tsx           # Skeleton de carga
    not-found.tsx         # 404 para grupo inexistente
    error.tsx             # Error boundary

  api/groups/
    route.ts                        # POST: crear grupo
  api/groups/[name]/
    route.ts                        # GET: obtener grupo
  api/groups/[name]/members/
    route.ts                        # POST: anadir miembro ($addToSet)
  api/groups/[name]/expenses/
    route.ts                        # POST: anadir gasto, GET: listar gastos
  api/groups/[name]/settlement/
    route.ts                        # GET: calcular liquidacion
```

## Comandos ejecutados / Commands Run

| Comando | Descripcion |
|---------|-------------|
| `npm install mongodb` | Instalar driver nativo de MongoDB |
| `npm run build` | Compilar proyecto Next.js (verificacion) |

## Levantar y detener la aplicacion / Running & Stopping

```bash
# Asegurarse de que MongoDB esta corriendo en localhost:27017

# Modo desarrollo
npm run dev
# Acceder en http://localhost:3000

# Modo produccion
npm run build
npm start
# Acceder en http://localhost:3000

# Detener: Ctrl+C en la terminal
```

### Flujo de uso de la aplicacion

1. Abrir `http://localhost:3000`
2. Crear un grupo (ej: "Viaje Playa") → redirige a `/group/viaje-playa`
3. Anadir miembros (ej: Ana, Pedro, Maria)
4. Registrar gastos indicando quien pago, importe y descripcion
5. La liquidacion se muestra automaticamente (quien debe pagar a quien)

### Test con API REST (curl)

```bash
# Crear grupo
curl -X POST http://localhost:3000/api/groups -H "Content-Type: application/json" -d "{\"name\": \"test-group\"}"

# Obtener grupo
curl http://localhost:3000/api/groups/test-group

# Anadir miembro
curl -X POST http://localhost:3000/api/groups/test-group/members -H "Content-Type: application/json" -d "{\"memberName\": \"Ana\"}"

# Anadir gasto
curl -X POST http://localhost:3000/api/groups/test-group/expenses -H "Content-Type: application/json" -d "{\"paidBy\": \"Ana\", \"amount\": 30, \"description\": \"Cena\"}"

# Listar gastos
curl http://localhost:3000/api/groups/test-group/expenses

# Calcular liquidacion
curl http://localhost:3000/api/groups/test-group/settlement
```

## Configuracion de red / Network Configuration

La aplicacion corre en local (localhost:3000). No requiere configuracion de red especial ni NAT port forwarding ya que tanto MongoDB como Next.js corren en la maquina host Windows directamente.

## URLs de prueba / Test URLs

| URL | Descripcion |
|-----|-------------|
| `http://localhost:3000` | Pagina principal (crear/acceder grupo) |
| `http://localhost:3000/group/{nombre}` | Dashboard de un grupo |
| `http://localhost:3000/api/groups` | API REST: crear grupo |
| `http://localhost:3000/api/groups/{nombre}` | API REST: obtener grupo |
| `http://localhost:3000/api/groups/{nombre}/members` | API REST: anadir miembro |
| `http://localhost:3000/api/groups/{nombre}/expenses` | API REST: gastos |
| `http://localhost:3000/api/groups/{nombre}/settlement` | API REST: liquidacion |

## Problemas encontrados / Problems & Solutions

| Problema | Solucion |
|----------|----------|
| `useActionState` requiere que la Server Action tenga firma `(prevState, formData)`, no solo `(formData)` | Se anadio `_prevState: unknown` como primer parametro en `addMember`, `addExpense` y `createGroup` |
| La form `action` en Server Component no acepta funciones que retornan valores (solo `void`) | Se creo `CreateGroupForm` como Client Component con `useActionState` en lugar de usar la Server Action directamente en el form del Server Component |

## Resultados y conclusiones / Results & Conclusions

**Lo que funciono:**
- Build exitoso sin errores TypeScript
- Arquitectura limpia: Server Components para data fetching, Client Components solo para interactividad
- Algoritmo de liquidacion greedy que minimiza el numero de transacciones
- Server Actions con `revalidatePath` para actualizacion real-time de la UI tras mutaciones
- Indices MongoDB creados automaticamente en primera conexion

**Algoritmo de liquidacion:**
1. Calcula el total de gastos y la parte equitativa por miembro
2. Determina balance neto de cada persona (pagado - parte equitativa)
3. Ordena acreedores y deudores de mayor a menor
4. Empareja el mayor acreedor con el mayor deudor, transfiere el minimo de ambos
5. Repite hasta liquidar todo. Redondea a 2 decimales.

**Proximos pasos potenciales:**
- Anadir eliminacion de gastos y miembros
- Anadir porcentajes de reparto personalizados (no solo equitativo)
- Persistencia de sesion / autenticacion basica
- Tests unitarios para el algoritmo de liquidacion
