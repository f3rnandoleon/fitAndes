# Plan de Implementacion y Profesionalizacion - FitAndes

**Version**: 2026-04-28  
**Fuente**: alineado con `evaluation_report-fitandes.md`  
**Objetivo**: llevar el proyecto de un estado funcional e integrable a un estado operable, verificable y mantenible.

## 1. Resumen ejecutivo

FitAndes ya tiene una base valida:

- `npm run lint` OK
- `npm run build` OK
- BFF funcional con Next.js App Router
- integracion real con el sistema central

El problema ya no es "hacer que funcione". El problema es **bajar el riesgo operativo y arquitectonico**.

Las debilidades prioritarias son:

1. testing inexistente
2. endpoint publico de chat sin control de costo/abuso
3. frontera fragil con la API central
4. falta de observabilidad
5. checkout con consistencia parcial
6. componentes y BFF con demasiada responsabilidad por archivo

## Meta de salida

Al terminar este plan, el proyecto deberia alcanzar estas condiciones minimas:

- tests unitarios e integracion basicos en las rutas y dominios criticos
- validacion runtime de payloads
- rate limiting y controles de uso en `/api/chat`
- capa de adaptacion formal hacia la API central
- logging estructurado y correlacion de requests
- componentes de checkout y BFF particionados en unidades mas mantenibles
- setup de proyecto documentado y repetible

---

## 2. Principios de ejecucion

1. **No tocar primero la UI por gusto**. Primero bajar riesgo en seguridad, contrato, observabilidad y testing.
2. **Encapsular antes de refactorizar**. Donde haya deuda de integracion, primero crear adaptadores y helpers.
3. **Medir antes de simplificar**. Todo cambio de arquitectura debe terminar con criterio de salida verificable.
4. **Reducir compatibilidad ad hoc**. Los fallbacks con el core son tacticos; deben quedar aislados.
5. **Subir calidad sin congelar el producto**. El plan esta pensado para implementarse por capas, sin parar el negocio.

---

## 3. Mapa de dimensiones y objetivos

| Dimension | Objetivo de remediacion | Resultado esperado |
|---|---|---|
| Seguridad | Reducir abuso, endurecer mutaciones y configuracion | Chat protegido, headers definidos, payloads validados |
| Integracion con API central | Formalizar contrato y adaptadores | Menos drift y menos mapping disperso |
| BFF / Route Handlers | Bajar complejidad por archivo | Rutas mas chicas y helpers compartidos |
| Tipos y modelos | Separar shape externo de modelo interno | Menos `as`, mejor normalizacion |
| Testing | Cubrir flujos y funciones criticas | Red de seguridad real |
| Observabilidad | Hacer trazable el sistema | Logs, request IDs, metricas basicas |
| Checkout y carrito | Mejorar consistencia y recuperacion | Menos estados parciales y mejor UX |
| Performance | Evitar trabajo innecesario | Menos carga de catalogo, menos JS inicial |
| UI / componentes | Consolidar primitives y dividir monolitos | Mantenimiento mas barato |
| DX / documentacion | Hacer setup y evolucion repetibles | Onboarding real y menos dependencia tribal |

---

## 4. Fases de implementacion

El plan se divide en 7 fases. Cada fase tiene:

- objetivo
- dimensiones cubiertas
- entregables
- archivos probables
- criterio de salida

---

## Fase 0 - Baseline, guardrails y preparacion

### Objetivo

Crear el minimo marco de trabajo para ejecutar las fases posteriores sin mezclar decisiones improvisadas con cambios de alto impacto.

### Dimensiones

- DX / documentacion
- Observabilidad
- Integracion con API central

### Entregables

#### 0.1 Crear `.env.example`

Archivo nuevo con variables necesarias, sin secretos:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_API_URL`
- `API_URL` si se decide mantener
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `GEMINI_CHAT_MODEL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `WHATSAPP_NUMBER`
- `LOG_LEVEL`

#### 0.2 Reescribir `README.md`

Debe incluir:

- objetivo del proyecto
- arquitectura de alto nivel
- variables necesarias
- scripts
- como correr localmente
- relacion con la API central
- limitaciones conocidas

#### 0.3 Crear ADR iniciales

Agregar carpeta `docs/adr/` con al menos:

- ADR-001: BFF como anti-corruption layer del sistema central
- ADR-002: estrategia transitoria de compatibilidad `/pedidos` vs `/orders`
- ADR-003: politica de chat con IA y control de costo

#### 0.4 Definir convenciones de observabilidad

Documento corto con:

- formato de logs
- nombre de eventos principales
- campos base por request
- tratamiento de errores de integracion

### Archivos objetivo

- `.env.example`
- `README.md`
- `docs/adr/ADR-001-bff-core-boundary.md`
- `docs/adr/ADR-002-central-api-compatibility.md`
- `docs/adr/ADR-003-chat-cost-control.md`
- `docs/operations/logging.md`

### Criterio de salida

- cualquier desarrollador puede levantar el proyecto con la documentacion
- hay decision explicita sobre el rol del BFF y la compatibilidad con el core

---

## Fase 1 - Seguridad y endurecimiento de entrada

### Objetivo

Reducir el riesgo inmediato de abuso y de datos invalidos entrando al sistema.

### Dimensiones

- Seguridad
- BFF / Route Handlers
- Tipos

### Trabajo por dimension

### 1A. Validacion runtime con schemas

#### Problema actual

Las rutas criticas siguen aceptando `request.json()` y trabajando con datos externos sin schemas formales.

#### Acciones

1. Instalar `zod`
2. Crear `src/lib/schemas/`
3. Definir schemas para:
   - `chat`
   - `checkout`
   - `orders patch`
   - `delivery-options admin`
4. Crear helper comun para transformar `ZodError` en payload de error consistente

#### Archivos probables

- `src/lib/schemas/chat.schema.ts`
- `src/lib/schemas/checkout.schema.ts`
- `src/lib/schemas/order.schema.ts`
- `src/lib/schemas/common.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/orders/[id]/route.ts`
- `src/app/api/admin/delivery-options/route.ts`

#### Criterio de salida

- todas las rutas criticas rechazan payloads invalidos con `400`
- no quedan casts directos como sustituto de validacion de entrada

### 1B. Rate limiting y control de uso del chat

#### Problema actual

`/api/chat` es publico y puede disparar consumo de Gemini sin control.

#### Acciones

1. Crear rate limiter basico server-side
2. Aplicarlo a `/api/chat`
3. Agregar limites por IP y, si hay sesion, por usuario
4. Definir fallback cuando Gemini este deshabilitado o bloqueado
5. Dejar preparado un backend de rate limiting reemplazable si se escala a Redis/Upstash

#### Archivos probables

- `src/lib/rate-limit.ts`
- `src/app/api/chat/route.ts`
- `docs/operations/chat-limits.md`

#### Criterio de salida

- exceso de requests retorna `429`
- existe configuracion de limites por entorno

### 1C. Seguridad de configuracion y headers

#### Acciones

1. Mover `WHATSAPP_NUMBER` a env
2. Endurecer `next.config.ts` con security headers
3. Definir postura explicita respecto a CSRF en mutaciones basadas en sesion
4. Revisar si `NEXT_PUBLIC_API_URL` y `API_URL` deben coexistir o consolidarse

#### Archivos probables

- `next.config.ts`
- `src/app/api/checkout/route.ts`
- `README.md`
- `docs/adr/ADR-004-session-and-csrf-boundary.md`

#### Criterio de salida

- headers de seguridad presentes
- no quedan secretos o numeros operativos hardcodeados sin justificacion
- decision documentada sobre CSRF

---

## Fase 2 - Formalizacion de la frontera con la API central

### Objetivo

Convertir la compatibilidad actual con el sistema central en una capa de adaptacion clara, testeable y menos dispersa.

### Dimensiones

- Arquitectura de integracion con API central
- Tipos
- BFF / Route Handlers

### Trabajo por dimension

### 2A. Crear modelo canonico del BFF

#### Problema actual

Los tipos de `Pedido`, `Pago` y `Entrega` mezclan shape externo, shape legacy y shape de consumo interno.

#### Acciones

1. Definir modelos canonicos internos del BFF:
   - `CanonicalOrder`
   - `CanonicalPayment`
   - `CanonicalDelivery`
   - `CanonicalCustomerContext`
2. Mantener los tipos externos como DTOs separados
3. Evitar que UI y servicios consuman DTOs de la API directamente

#### Archivos probables

- `src/types/central-api.ts`
- `src/types/canonical-order.ts`
- `src/types/canonical-payment.ts`
- `src/types/canonical-customer.ts`

#### Criterio de salida

- UI y servicios de alto nivel trabajan con modelos canonicos
- los nombres legacy quedan encapsulados en adaptadores

### 2B. Extraer adaptadores dedicados

#### Acciones

1. Crear adaptadores por dominio:
   - pedidos
   - pagos
   - checkout
   - cliente
2. Mover normalizaciones y mappings fuera de los route handlers
3. Aislar todas las diferencias entre `/pedidos` y `/orders`, y entre campos en espanol/ingles

#### Archivos probables

- `src/lib/adapters/orders.adapter.ts`
- `src/lib/adapters/payments.adapter.ts`
- `src/lib/adapters/customers.adapter.ts`
- `src/lib/adapters/checkout.adapter.ts`

#### Criterio de salida

- `api/checkout`, `api/orders/[id]` y `services/orders.service.ts` ya no contienen mapping disperso

### 2C. Consolidar cliente del core

#### Acciones

1. Expandir `src/lib/central-api.ts` o crear `src/lib/central-client.ts`
2. Exponer funciones de dominio:
   - `fetchCustomerContext`
   - `syncCart`
   - `createOrder`
   - `createPayment`
   - `updateOrder`
   - `uploadPaymentReceipt`
3. Centralizar timeout, headers, retries y fallback de rutas

#### Archivos probables

- `src/lib/central-api.ts`
- `src/lib/central-client.ts`
- `src/services/orders.service.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/orders/[id]/route.ts`
- `src/app/api/payments/[id]/upload-comprobante/route.ts`

#### Criterio de salida

- una sola capa conoce los detalles de compatibilidad con la API central

### 2D. Contract tests

#### Acciones

1. Diseñar fixtures reales a partir de `API_DOCUMENTACION.md`
2. Crear tests que validen que los adaptadores soportan las respuestas actuales del core
3. Si existe entorno de staging, agregar smoke contract tests opcionados por env

#### Archivos probables

- `src/lib/adapters/__tests__/orders.adapter.test.ts`
- `src/lib/adapters/__tests__/payments.adapter.test.ts`
- `src/lib/adapters/__tests__/customers.adapter.test.ts`
- `src/tests/fixtures/central-api/*.json`

#### Criterio de salida

- una regresion del contrato del core rompe tests antes de romper UI

---

## Fase 3 - Testing sistematico

### Objetivo

Construir red de seguridad real para dominios criticos y para la capa BFF.

### Dimensiones

- Testing
- Tipos
- BFF / Route Handlers
- Integracion con API central

### Trabajo por dimension

### 3A. Setup de framework

#### Acciones

1. Instalar `vitest`, `jsdom`, `@testing-library/*`
2. Agregar scripts:
   - `test`
   - `test:watch`
   - `test:coverage`
3. Configurar alias `@`

#### Archivos probables

- `package.json`
- `vitest.config.ts`
- `src/tests/setup.ts`

### 3B. Prioridad alta: funciones puras

#### Cobertura inicial

- `src/types/pedidos.ts`
- `src/types/catalogo.ts`
- `src/lib/delivery-options.ts`
- `src/lib/chat/parser.ts`
- `src/lib/chat/memory.ts`

#### Criterio de salida

- coverage util en dominios puros
- edge cases documentados como tests

### 3C. Prioridad alta: adaptadores y cliente central

#### Cobertura inicial

- adaptadores de pedidos, pagos y cliente
- comportamiento de fallback por rutas
- extraccion de errores del core

### 3D. Prioridad alta: API routes criticas

#### Cobertura inicial

- `api/chat`
- `api/checkout`
- `api/orders/[id]`
- `api/payments/[id]/upload-comprobante`

#### Casos minimos

- request invalido
- autenticacion faltante
- error del core
- caso exitoso
- fallback contractual

### 3E. Smoke tests E2E

#### Flujos minimos

1. login cliente
2. agregar producto al carrito
3. checkout QR
4. subida de comprobante
5. consulta de pedido

#### Herramienta sugerida

- Playwright

### Criterio de salida de la fase

- existe pipeline basico de tests locales
- cambios en checkout o adaptadores no dependen solo de prueba manual

---

## Fase 4 - Observabilidad, resiliencia y operacion

### Objetivo

Hacer que el sistema deje huella suficiente para explicar fallas y tomar decisiones operativas.

### Dimensiones

- Observabilidad y operaciones
- Seguridad
- BFF / Route Handlers
- Checkout y carrito

### Trabajo por dimension

### 4A. Logging estructurado

#### Acciones

1. Introducir logger comun
2. Loggear:
   - fallas de API central
   - fallas de Gemini
   - rechazos de validacion
   - rate limiting del chat
3. No loggear datos sensibles completos

#### Archivos probables

- `src/lib/logger.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/orders/[id]/route.ts`
- `src/app/api/payments/[id]/upload-comprobante/route.ts`

### 4B. Correlation IDs

#### Acciones

1. Generar request ID si no llega uno
2. Propagarlo al core
3. Incluirlo en logs y errores internos

#### Archivos probables

- `src/lib/request-context.ts`
- `src/lib/central-client.ts`
- route handlers criticos

### 4C. Metricas operativas basicas

#### Eventos a medir

- chat requests
- chat requests bloqueados
- fallas de Gemini
- checkout iniciado
- checkout fallido por validacion
- checkout fallido por core
- pago QR creado
- comprobante subido

#### Implementacion inicial

Puede comenzar como logging estructurado; luego migrar a backend de metricas.

### 4D. Resiliencia del checkout

#### Problema actual

El checkout sigue siendo una orquestacion no transaccional.

#### Acciones

1. Introducir `idempotency key` consistente en checkout y pagos
2. Loggear cada etapa del flujo
3. Definir una estrategia de recuperacion:
   - cuando hay carrito remoto sincronizado pero no pedido
   - cuando hay pedido pero no pago
4. Evaluar con backend central si puede existir endpoint de checkout atomico

#### Entregables

- documento de failure modes
- manejo de reintento controlado
- mejor semantica de errores para UI

### Criterio de salida

- un error en produccion deja suficiente evidencia
- el equipo puede reconstruir un checkout fallido

---

## Fase 5 - Refactor de BFF y composicion de UI

### Objetivo

Bajar complejidad por archivo y separar responsabilidades que hoy conviven en componentes y rutas demasiado grandes.

### Dimensiones

- BFF / Route Handlers
- Arquitectura UI / componentes
- Tipos

### Trabajo por dimension

### 5A. Partir `src/app/api/checkout/route.ts`

#### Problema actual

Sigue siendo el archivo de mayor densidad de reglas, mapping y orquestacion.

#### Objetivo

Separarlo en modulos por responsabilidad:

- auth
- validacion
- payload mapping
- sync de carrito
- creacion de pedido
- creacion de pago
- respuestas de UI

#### Archivos probables

- `src/lib/checkout/checkout-auth.ts`
- `src/lib/checkout/checkout-validation.ts`
- `src/lib/checkout/checkout-cart-sync.ts`
- `src/lib/checkout/checkout-order.ts`
- `src/lib/checkout/checkout-payment.ts`
- `src/lib/checkout/checkout-response.ts`

### 5B. Consolidar helpers duplicados

#### Acciones

1. Unificar `formatPrice`, `formatDate`, `normalizeText`, `normalizePhone`, `compactText`
2. Consolidar `Field`
3. Consolidar estilos de estado de pedidos

#### Archivos probables

- `src/lib/format.ts`
- `src/lib/text.ts`
- `src/lib/status-styles.ts`
- `src/components/ui/Field.tsx`

### 5C. Crear primitives de UI

#### Componentes base

- `Button`
- `Input`
- `Select`
- `Textarea`
- `Alert`
- `Badge`
- `Card`

#### Beneficio

- menos estilos duplicados
- menos drift visual
- mas velocidad para cambios posteriores

### 5D. Partir monolitos de cliente

#### Objetivos principales

- `src/components/checkout/CheckoutPageClient.tsx`
- `src/components/pedidos/OrderDeliveryEditSection.tsx`
- `src/components/layout/SiteHeader.tsx`

#### Posible particion

Checkout:

- `CartItemsList`
- `DeliveryMethodSection`
- `PaymentMethodSection`
- `CheckoutSummary`
- `CheckoutSessionPanel`
- hook `useCheckoutForm`

Header:

- `CartDrawer`
- `UserMenu`
- `MobileNav`

Pedido:

- `PickupDeliveryEditor`
- `ShippingDeliveryEditor`
- hook `useDeliveryOptions`

### Criterio de salida

- ningun archivo de UI critica supera un umbral razonable sin justificacion
- la composicion es mas testeable y reutilizable

---

## Fase 6 - Performance y UX tecnica

### Objetivo

Reducir costo de render, carga innecesaria y dependencia de catalogo completo en memoria.

### Dimensiones

- Performance
- UI / componentes
- Integracion con API central

### Trabajo por dimension

### 6A. Chat y catalogo

#### Problema actual

`searchProducts()` y `findSimilarProducts()` cargan catalogo completo y filtran en memoria.

#### Acciones

1. Definir si el core puede aceptar filtros server-side
2. Si no puede, al menos introducir cache local controlada para catalogo publico
3. Separar estrategia de "catalog search for chat" del servicio generico de catalogo

#### Archivos probables

- `src/services/chat-catalogo.service.ts`
- `src/services/catalogo.service.ts`
- `docs/adr/ADR-005-catalog-search-strategy.md`

### 6B. Carga del chat

#### Acciones

1. cargar `ChatWidget` con `dynamic(..., { ssr: false })`
2. evaluar si debe montarse en todo `(public)` o solo en paginas donde agrega valor

#### Archivos probables

- `src/app/(public)/layout.tsx`

### 6C. Imagenes

#### Acciones

1. configurar `remotePatterns` reales
2. eliminar `unoptimized` donde no sea estrictamente necesario
3. verificar compatibilidad con imagenes del core y Cloudinary

#### Archivos probables

- `next.config.ts`
- componentes que usan `Image`

### 6D. Cache razonable

#### Acciones

1. revisar donde `cache: "no-store"` es realmente necesario
2. aplicar `revalidate` o cache explicita en catalogo publico y delivery options cuando sea seguro

### Criterio de salida

- menor trabajo de red para catalogo y chat
- menor JS inicial en paginas publicas

---

## Fase 7 - Cierre de madurez y hardening final

### Objetivo

Cerrar deuda de DX, produccion y calidad general para dejar el proyecto en estado defendible.

### Dimensiones

- DX / documentacion
- Preparacion para produccion
- Seguridad
- Accesibilidad

### Trabajo por dimension

### 7A. CI minima

#### Acciones

1. pipeline con:
   - install
   - lint
   - build
   - test
2. falla obligatoria si alguna etapa rompe

#### Archivos probables

- `.github/workflows/ci.yml`

### 7B. Checklist de despliegue

#### Crear documento de release

- variables requeridas
- smoke checks post deploy
- rollback basico
- verificacion de conectividad al core

### 7C. Accesibilidad minima

#### Acciones

1. restaurar focus visible
2. revisar botones icon-only
3. agregar skip link
4. revisar feedback de error en formularios

### 7D. Limpieza de codigo muerto

#### Acciones

1. eliminar `src/types/index.ts` si sigue sin uso
2. revisar helpers y tipos legacy no utilizados
3. documentar claramente lo que sigue siendo compatibilidad transitoria

### Criterio de salida

- existe pipeline automatica
- existe checklist operativa de despliegue
- la deuda remanente queda documentada, no implícita

---

## 5. Plan detallado por dimension

Esta seccion sirve como matriz de seguimiento. Cada dimension debe poder marcarse como:

- no iniciada
- en progreso
- mitigada parcialmente
- cerrada

### Seguridad

#### Debilidades detectadas

- `/api/chat` sin rate limiting
- payloads sin validacion runtime formal
- `WHATSAPP_NUMBER` hardcoded
- sin security headers
- postura CSRF no explicitada

#### Acciones obligatorias

- Fase 1 completa
- revision final en Fase 7

#### Definicion de cierre

- controles de abuso activos
- headers activos
- schemas activos
- configuracion externalizada

### Integracion con API central

#### Debilidades detectadas

- compatibilidad ad hoc
- mapeos dispersos
- falta de modelos canonicos
- falta de contract tests

#### Acciones obligatorias

- Fase 2 completa
- testing asociado en Fase 3

#### Definicion de cierre

- adaptadores dedicados
- cliente central consolidado
- contract tests activos

### BFF / Route Handlers

#### Debilidades detectadas

- `api/checkout` demasiado grande
- errores y auth todavia parcialmente dispersos
- semantica de fallback del chat mejorable

#### Acciones obligatorias

- Fases 1, 2 y 5

#### Definicion de cierre

- rutas finas
- orchestration separada en modulos
- auth y errores comunalizados

### Tipos y modelos

#### Debilidades detectadas

- casts sobre datos externos
- mezcla de DTO y modelo interno
- duplicacion de conceptos base

#### Acciones obligatorias

- Fases 1 y 2

#### Definicion de cierre

- modelo canonico interno
- schemas runtime
- menos deuda de tipos legacy expuestos a UI

### Testing

#### Debilidades detectadas

- suite inexistente

#### Acciones obligatorias

- Fase 3 completa

#### Definicion de cierre

- unit tests en dominios puros
- integration tests en BFF critico
- smoke E2E en flujo principal

### Observabilidad

#### Debilidades detectadas

- sin logs estructurados
- sin request correlation
- sin metricas

#### Acciones obligatorias

- Fase 4 completa

#### Definicion de cierre

- errores trazables de punta a punta
- eventos operativos visibles

### Checkout y carrito

#### Debilidades detectadas

- consistencia parcial
- carrito local como unica fuente de verdad

#### Acciones obligatorias

- Fases 4 y 5

#### Definicion de cierre

- flujo trazable
- mejor recuperacion ante fallas
- deuda de consistencia documentada

### Performance

#### Debilidades detectadas

- catalogo completo en memoria
- chat montado en todo layout
- `unoptimized`
- `no-store` excesivo

#### Acciones obligatorias

- Fase 6 completa

#### Definicion de cierre

- menor costo de catalogo
- menor JS inicial
- estrategia de imagenes razonable

### UI / componentes

#### Debilidades detectadas

- monolitos de cliente
- primitives ausentes
- estilos repetidos

#### Acciones obligatorias

- Fase 5 completa

#### Definicion de cierre

- primitives existentes
- checkout y header descompuestos

### DX / documentacion

#### Debilidades detectadas

- falta `.env.example`
- `README` pobre
- sin ADRs
- sin guia operativa

#### Acciones obligatorias

- Fases 0 y 7

#### Definicion de cierre

- onboarding reproducible
- decisiones de arquitectura documentadas

---

## 6. Orden recomendado de ejecucion

### Camino critico

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4

### Trabajo paralelo posible

- Fase 5 puede empezar cuando Fase 2 deje estabilizada la frontera con el core
- Fase 6 puede arrancar en paralelo parcial con Fase 5
- Fase 7 debe cerrar el ciclo, no abrirlo

---

## 7. Criterios de verificacion

## Verificacion automatizada

```bash
npm run lint
npm run build
npm test
```

## Verificacion funcional minima

- login cliente
- catalogo publico
- agregar al carrito
- checkout QR
- subida de comprobante
- visualizacion de pedidos
- edicion/cancelacion permitida de pedido
- chat con limites y fallback visibles

## Verificacion operativa minima

- logs con request ID
- error del core visible y correlacionable
- rate limit del chat observable
- headers de seguridad presentes

---

## 8. Resultado esperado al cierre

Si este plan se ejecuta de forma disciplinada, el proyecto deberia terminar en un estado aproximadamente equivalente a:

- **7.5/10 a 8/10** en madurez tecnica
- con riesgos de produccion conocidos, acotados y medibles
- con una frontera mucho mas sana respecto al sistema central

El verdadero indicador de exito no sera que el codigo "se vea mas bonito". Sera este:

**cuando falle algo en FitAndes, el equipo podra entender rapidamente que fallo, por que fallo, y como corregirlo sin miedo a romper otra cosa.**
