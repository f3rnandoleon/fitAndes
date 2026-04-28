# FitAndes

Frontend/BFF en Next.js para la experiencia web de FitAndes. El proyecto expone:

- catalogo publico
- login y registro de clientes
- checkout con sincronizacion hacia el sistema central
- portal de cliente con pedidos y comprobantes
- chatbot de apoyo con reglas + Gemini

## Arquitectura

FitAndes no es un frontend estatico ni un backend completo. Funciona como **BFF (Backend for Frontend)** entre la UI web y el sistema central de ventas.

### Vista de alto nivel

```text
Browser
  |
  v
FitAndes (Next.js App Router + Route Handlers)
  |
  v
API central de control de ventas
```

### Responsabilidades del BFF

- proteger al cliente web de detalles del core
- adaptar payloads y respuestas del sistema central
- resolver autenticacion web con NextAuth
- orquestar checkout, pedidos y carga de comprobantes
- aplicar logica local de UI, carrito y chat

### Estructura principal

```text
src/
  app/
    (public)/               rutas publicas
    (portal)/               rutas autenticadas de cliente
    api/                    route handlers del BFF
  components/               componentes por dominio
  lib/                      utilidades, integracion y logica transversal
  services/                 acceso a datos/servicios del sistema central
  types/                    tipos y helpers de dominio
  data/                     fallbacks estaticos
```

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Setup local

1. Instala dependencias:

```bash
npm install
```

2. Crea tu configuracion local a partir del ejemplo:

```bash
copy .env.example .env
```

3. Ajusta variables segun tu entorno.

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

5. Abre `http://localhost:3000`

## Variables de entorno

### Requeridas

| Variable | Uso |
|---|---|
| `NEXTAUTH_SECRET` | firma de sesion NextAuth |
| `NEXTAUTH_URL` | URL base del frontend |
| `NEXT_PUBLIC_API_URL` | base URL publica de la API central |
| `GOOGLE_GENERATIVE_AI_API_KEY` | acceso a Gemini |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | login con Google en cliente |

### Recomendadas

| Variable | Uso |
|---|---|
| `API_URL` | base URL server-side de la API central si se quiere separar de la publica |
| `GEMINI_CHAT_MODEL` | modelo Gemini a utilizar |
| `WHATSAPP_NUMBER` | numero de atencion para checkout por WhatsApp |
| `LOG_LEVEL` | nivel de logging para futuras fases |

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Integracion con la API central

La documentacion de referencia del core esta en:

- [API_DOCUMENTACION.md](API_DOCUMENTACION.md)

Hoy el BFF convive con contratos heterogeneos del sistema central. Hay compatibilidad transitoria con rutas modernas y legacy, por ejemplo:

- `/pedidos` y `/orders`
- `/pagos` y `/payments`
- `/clientes/me` y `/customers/me`

Ese comportamiento existe para no romper flujos mientras se estabiliza el contrato del core. No debe multiplicarse fuera de la capa de integracion.

## Flujos principales

### Catalogo publico

- obtiene productos desde la API central
- renderiza catalogo y detalle de producto

### Portal autenticado

- inicia sesion con NextAuth
- consulta pedidos del cliente
- permite ciertas acciones del pedido y carga de comprobante

### Checkout

- sincroniza el carrito local con el carrito remoto
- crea pedido en el sistema central
- crea pago QR cuando aplica
- redirige al detalle del pedido o a WhatsApp segun el flujo

### Chat

- parser basado en reglas
- enriquecimiento opcional con Gemini
- consulta catalogo y pedidos segun autenticacion

## Estado actual del proyecto

Baseline tecnico actual:

- `npm run lint`: OK
- `npm run build`: OK

Riesgos conocidos hoy:

- no hay testing automatizado
- `/api/chat` aun no tiene rate limiting
- la frontera con el core aun depende de compatibilidad ad hoc
- falta observabilidad operativa real

## Documentacion interna

- [evaluation_report-fitandes.md](evaluation_report-fitandes.md)
- [implementation_plan-fitandes.md](implementation_plan-fitandes.md)
- [DOCUMENTACION_COMPLETA_PROYECTO.md](DOCUMENTACION_COMPLETA_PROYECTO.md)
- [docs/adr/ADR-001-bff-core-boundary.md](docs/adr/ADR-001-bff-core-boundary.md)
- [docs/adr/ADR-002-central-api-compatibility.md](docs/adr/ADR-002-central-api-compatibility.md)
- [docs/adr/ADR-003-chat-cost-control.md](docs/adr/ADR-003-chat-cost-control.md)
- [docs/adr/ADR-004-session-and-csrf-boundary.md](docs/adr/ADR-004-session-and-csrf-boundary.md)
- [docs/operations/logging.md](docs/operations/logging.md)

## Deploy

Antes de desplegar:

1. definir todas las variables de entorno
2. validar `npm run lint`
3. validar `npm run build`
4. verificar conectividad con la API central
5. validar login, checkout y consulta de pedidos

## Limitaciones conocidas

- el carrito vive en `localStorage`
- la compatibilidad con el core aun no esta formalizada con contract tests
- el chat todavia requiere endurecimiento operativo

## Siguiente paso recomendado

Ejecutar Fase 1 del plan: validacion runtime, rate limiting del chat y endurecimiento de seguridad basica.
