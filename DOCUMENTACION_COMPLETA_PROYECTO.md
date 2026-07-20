# DOCUMENTACION_COMPLETA_PROYECTO — FitAndes (Frontend/BFF)

> Documento fuente para **otras apps, desarrolladores y agentes**: explica propósito, arquitectura, flujos, puntos de integración con el **core/API central**, y detalles operativos relevantes.

---

## 1) Resumen ejecutivo

FitAndes es una aplicación web hecha con **Next.js (App Router)**, **React**, **TypeScript** y **Tailwind CSS**. Su rol es actuar como **Frontend/BFF (Backend for Frontend)** entre el navegador y la **API central** del sistema de ventas.

FitAndes provee:

- **Catálogo público** (home + catálogo + detalle de producto)
- **Autenticación** para clientes (NextAuth)
- **Portal privado** del cliente (panel, historial y detalle de pedido)
- **Checkout BFF**: sincroniza carrito remoto en el core y ejecuta el checkout/pedido (incluye creación de pago **QR** si aplica)
- **Chat** de apoyo (reglas + motor de conversación, con control de costos/operación)
- **Reserva local** en el navegador como apoyo UX (localStorage)

Este repositorio **no reemplaza** el backend principal de negocio. El BFF depende fuertemente del contrato de la API central.

Archivo de referencia para el core:
- `API_DOCUMENTACION.md`

---

## 2) Stack tecnológico

- Next.js `15.5.9`
- React `19.1.0`
- TypeScript `5`
- NextAuth `4.24.13`
- Tailwind CSS `4`
- ESLint `9`

---

## 3) Alcance real (qué cubre este repo)

### Cubre

- Rutas con **App Router** (public y portal)
- Sesiones con **NextAuth** usando `CredentialsProvider`
- Autorización por rol (solo `CLIENTE`)
- Consumo de API central (vía helpers de integración)
- **Endpoints BFF** en `src/app/api/*`:
  - `/api/chat`
  - `/api/checkout`
  - (otros endpoints existen en `src/app/api/*`)
- Persistencia UX: **reserva local** con `localStorage`

### No cubre (o no es responsabilidad directa aquí)

- Persistencia de negocio y base de datos
- Lógica de precios/inventario/ventas como sistema de verdad (vive en el core)
- Contratos y estados transaccionales “definitivos” (se consultan/ejecutan contra la API central)

---

## 4) Estructura del repo (mapa funcional)

```text
fitAndes/
|-- src/
|   |-- app/
|   |   |-- (public)/
|   |   |-- (portal)/
|   |   |-- api/
|   |   |   |-- chat/route.ts
|   |   |   |-- checkout/route.ts
|   |   |   `-- ...otros route handlers
|   |   |-- globals.css
|   |   `-- layout.tsx
|   |-- components/
|   |   `-- ...UI por dominio (catalogo, chat, pedidos, layout, providers)
|   |-- lib/
|   |   |-- central-api.ts        (helpers de headers/retry)
|   |   |-- central-client.ts    (fetch con fallback + sync remoto)
|   |   |-- auth-options.ts      (NextAuth)
|   |   |-- chat/*               (motor, parser, memoria, formatter, gemini)
|   |   |-- checkout/*          (auth, validation, QR, notificaciones)
|   |   |-- adapters/*         (traducción y compatibilidad con core)
|   |   `-- schemas/*           (validaciones Zod)
|   |-- services/
|   |   `-- ...acceso a datos (ej: orders.service)
|   `-- types/
|       `-- ...tipos de contrato del core/portal
|
|-- public/
|-- docs/adr/ (decisiones arquitectónicas)
|-- docs/operations/ (runbooks)
|-- DOCUMENTACION_COMPLETA_PROYECTO.md
|-- README.md
|-- package.json
|-- next.config.ts
```

---

## 5) Arquitectura de aplicación

### 5.1 App Router: partición de rutas

- `(public)` → rutas abiertas para el usuario:
  - `/`, `/catalogo`, `/catalogo/:id`, `/login`, `/registro`, etc.
- `(portal)` → rutas autenticadas:
  - `/dashboard`, `/pedidos`, `/pedidos/:id`

Los grupos entre paréntesis **no** forman parte de la URL.

### 5.2 Autenticación/Autorización

- NextAuth configura providers en `src/lib/auth-options.ts`.
- Roles: se permite **solo** `CLIENTE`.
- La sesión usa estrategia `jwt`.
- El portal está protegido en:
  - `src/app/(portal)/layout.tsx` (redirect a `/login`)
  - `src/middleware.ts` (matcher real con `config.matcher`)

**Regla práctica para agentes**: la protección efectiva para el portal la define el layout y el middleware. Si cambias rutas del portal, ajusta ambos.

### 5.3 Integración con API central (contrato y compatibilidad)

La integración está encapsulada en:

- `src/lib/central-api.ts`
  - `CENTRAL_API_URL = NEXT_PUBLIC_API_URL ?? API_URL ?? ""`
  - Construye headers con:
    - `x-user-id`
    - `x-user-role`
    - `Authorization: Bearer ...` (si existe `accessToken`)
  - `fetchCentralApiWithFallback(...)` (reintentos con abort timeout)
- `src/lib/central-client.ts`
  - `fetchCentralJson(...)`
  - `syncRemoteCart(...)` (sincroniza el carrito local hacia el core)

**Por qué existe “fallback”/compatibilidad**: el core tiene rutas/contratos que conviven (legacy y canonical). El BFF intenta ambos.

---

## 6) Variables de entorno (lo que realmente usa el código)

### Variables clave

- `NEXT_PUBLIC_API_URL` (recomendada/clave)
  - base URL pública de la API central.
  - usada por integración (`CENTRAL_API_URL`) y fetch server components cuando aplica.
- `API_URL` (fallback server-side)
  - si no existe `NEXT_PUBLIC_API_URL`.
- `NEXTAUTH_SECRET` (obligatoria)
  - firma/cifrado de sesión JWT.
- `NEXTAUTH_URL` (recomendada)
  - ayuda a OAuth/flows y generación de URLs.

### Variables para Google (si se usa)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (verificación requerida según tu configuración de NextAuth/Google)

### Chat
- `GOOGLE_GENERATIVE_AI_API_KEY` y configuración Gemini (si el motor lo usa en tu despliegue)

> Nota: el repo puede tener variables adicionales relacionadas a backend central (ej: Mongo/JWT) pero no son necesariamente consumidas en este frontend.

---

## 7) Rutas y flujos de usuario

### 7.1 Catálogo público

`src/app/(public)/page.tsx` (home)

- Renderiza secciones y catálogo usando componentes como `CarruselImagenes`.

`src/app/(public)/catalogo/page.tsx`

- Llama a:
  - `GET {NEXT_PUBLIC_API_URL}/productos/publicos`
- Aplica filtro de stock por variante (la grilla solo muestra productos con variantes disponibles).
- Usa `revalidate: 60`.

### 7.2 Detalle de producto

`src/app/(public)/catalogo/[id]/page.tsx`

- Consulta detalle público.
- Renderiza `ProductoDetalleCliente`.
- Permite seleccionar variante (color/talla) y agregar a reserva local.

### 7.3 Registro/Login

- Login NextAuth (credentials): `src/lib/auth-options.ts` y rutas UI en `/login`.
- Login con Google token (si está configurado): `src/lib/auth-options.ts` usa `POST /auth/google`.
- Registro: UI en `/registro` (el core define `POST /auth/signup` o similar; revisar tu contrato si difiere).

### 7.4 Portal privado

`src/app/(portal)/layout.tsx`

- Obtiene `session` por server-side.
- Si no existe o el rol no es `CLIENTE`, redirige a `/login`.

`/dashboard`

- Llama a `getOrders(...)` desde `src/services/orders.service`.
- Calcula métricas (total gastado, pedidos recientes).

`/pedidos` y `/pedidos/:id`

- Renderiza listado y detalle de pedidos.
- Se apoya en helpers de `src/types/pedidos.ts` para estado, total, etc.

---

## 8) Endpoints BFF (src/app/api)

### 8.1 `POST /api/chat`

Implementación: `src/app/api/chat/route.ts`

Comportamiento:

1. **Rate limiting** por IP con límites:
   - `CHAT_RATE_LIMIT = 20`
   - `CHAT_RATE_LIMIT_WINDOW_MS = 60_000`
2. Valida el request con Zod (`chatRequestSchema`).
3. Obtiene sesión server-side (`getServerSession(authOptions)`) para incluir contexto de usuario.
4. Ejecuta motor de chat (`runChat`) con:
   - `message`
   - `memory` (normalizada con o sin userId)
   - `attachments`
   - `auth` (userId y accessToken cuando aplica)
5. Errores:
   - 429 con headers `Retry-After`, `X-RateLimit-*`
   - 400 con mensaje de validación
   - 500 con respuesta de fallback y `sourceMode: "rules"`

**Contrato esperado**: ver `src/lib/schemas/chat.schema.ts`.

### 8.2 `GET /api/checkout` y `POST /api/checkout`

Implementación: `src/app/api/checkout/route.ts`

#### GET /api/checkout

- Requiere sesión rol `CLIENTE`.
- Llama a core:
  - `GET /clientes/me`
  - `GET /customers/me` (fallback por contrato)
- Normaliza y responde un “customer context” usado por UI del checkout.

#### POST /api/checkout

Flujo:

1. Requiere sesión rol `CLIENTE`.
2. Parse y valida payload con `checkoutPayloadSchema` (Zod).
3. Aplica validación adicional de negocio (`validateCheckoutPayload`).
4. Sincroniza carrito local → carrito remoto en el core (`syncRemoteCart`).
5. Envía el checkout al core con compatibilidad canonical/legacy:
   - `POST /pedidos/checkout` (canonical)
   - `POST /pedidos/checkout` (legacy)
   - `POST /orders/checkout` (legacy)
6. Extrae `orderId`/`orderNumber` y calcula total.
7. Si `paymentMethod === "QR"`:
   - crea pago QR (`createQrPayment`)
   - retorna `paymentId` y `receiptRequired`
8. Si no QR:
   - retorna URL WhatsApp si aplica (según delivery)

**Errores importantes**:
- 401 si no hay sesión o rol no es `CLIENTE`
- 400 por schema o validación de negocio
- 5xx si el core falla

---

## 9) Reserva local (estado global)

Implementación: `src/components/providers/ReservationCartProvider.tsx`

Características:

- Persistencia en `localStorage`:
  - key: `fitandes-reservas`
- Estado modelado por `ReservationItem`:
  - `id` (clave interna del item)
  - `productoId?`, `variantId?`, `nombre`, `modelo?`, `imagen?`
  - `color`, `colorSecundario?`, `talla`, `cantidad`
  - `precio`, `stockDisponible`
- Operaciones:
  - `addItem(item)` (fusiona si ya existe por `id`)
  - `removeItem(id)`
  - `updateQuantity(id, cantidad)` (clamp con stockDisponible)
  - `clearCart()`

**Importante para agentes**:
- La reserva local es UX solamente.
- El “checkout real” es el endpoint BFF `/api/checkout` que sincroniza remoto en el core.

---

## 10) Integración: headers y autenticación hacia el core

Cuando el BFF llama al core, típicamente usa:

- `x-user-id`: sesión `session.user.id`
- `x-user-role`: rol `CLIENTE`/otro
- `Authorization: Bearer <accessToken>` (si el core lo requiere)

Helpers:
- `buildCentralApiHeaders(auth, ...)` en `src/lib/central-api.ts`

---

## 11) Contratos y tipos relevantes

- Chat schema:
  - `src/lib/schemas/chat.schema.ts`
  - tipos de motor en `src/lib/chat/types.ts`
- Checkout schema:
  - `src/lib/schemas/checkout.schema.ts`
  - tipos en `src/types/checkout.ts`
- Pedido (portal):
  - `src/types/pedidos.ts`

---

## 12) ADRs y decisiones arquitectónicas

Documentación de referencia:

- `docs/adr/ADR-001-bff-core-boundary.md`
- `docs/adr/ADR-002-central-api-compatibility.md`
- `docs/adr/ADR-003-chat-cost-control.md`
- `docs/adr/ADR-004-session-and-csrf-boundary.md`

---

## 13) Operación / Deploy

Runbooks:
- `docs/operations/deployment-checklist.md`
- `docs/operations/logging.md`

Checklist operativo (resumen):

1. Variables de entorno completas (API + NextAuth + (si aplica) Gemini)
2. Validar:
   - `npm run lint`
   - `npm run build`
3. Verificar conectividad con la API central
4. Validar login, portal y checkout (incluyendo QR)
5. Validar `/api/chat` bajo carga (rate limiting)

---

## 14) Convenciones para modificar y extender

- Endpoints BFF:
  - colocar lógica de orquestación en `src/app/api/*`
  - mover lógica transversal a `src/lib/*` (schemas, adaptadores, clientes)
- Integración con core:
  - mantener compatibilidad canonical/legacy en `adapters/*`
  - mantener retry/timeout en `central-api.ts`
- Autenticación:
  - actualizar rol-checks siempre que cambie el contrato del core

---

## 15) Guía rápida para levantar el proyecto

1. Instalar dependencias:

```bash
npm install
```

2. Configurar `.env` con al menos:

```env
NEXT_PUBLIC_API_URL=https://tu-backend/api
NEXTAUTH_SECRET=tu-secreto
NEXTAUTH_URL=http://localhost:3000
```

3. Ejecutar:

```bash
npm run dev
```

4. Abrir:

- `http://localhost:3000`

---

## 16) Limitaciones conocidas (alineadas con código actual)

- La reserva local vive en el navegador; el estado transaccional final ocurre en el core vía `/api/checkout`.
- Si el core cambia contratos (canonical/legacy), deben actualizarse los adaptadores (`adapters/*`) para evitar regresiones.
- El chat tiene rate limiting y fallback; para robustez adicional se puede endurecer observabilidad y seguridad.

---

## 17) Conclusión

Este repositorio es un **BFF** que orquesta la experiencia de catálogo, autenticación, portal de pedidos y checkout contra una **API central**. La integración está encapsulada en helpers (`central-api`, `central-client`, adaptadores) y la extensión se espera a través de nuevos endpoints en `src/app/api/*` con schemas Zod, manteniendo los contratos y compatibilidad con el core.

