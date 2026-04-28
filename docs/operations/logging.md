# Convenciones de logging y observabilidad

## Objetivo

Definir una base comun para logs y trazabilidad del BFF de FitAndes.

Este documento describe la convencion objetivo. Algunas partes todavia no estan implementadas en codigo y se completaran en fases posteriores.

## Principios

1. Los logs deben servir para reconstruir una falla real.
2. El BFF debe poder correlacionar requests propios con llamadas al sistema central.
3. No se deben registrar secretos ni payloads sensibles completos.
4. Los eventos deben ser consistentes entre route handlers.

## Campos base por log

Todo log emitido por un route handler deberia incluir, cuando aplique:

| Campo | Descripcion |
|---|---|
| `timestamp` | fecha/hora de emision |
| `level` | `debug`, `info`, `warn`, `error` |
| `message` | mensaje humano resumido |
| `requestId` | identificador unico de request |
| `route` | ruta del BFF |
| `method` | metodo HTTP |
| `userId` | usuario autenticado si existe |
| `role` | rol autenticado si existe |
| `upstreamPath` | ruta llamada al sistema central si aplica |
| `statusCode` | status de respuesta del BFF |
| `upstreamStatus` | status del sistema central si aplica |
| `durationMs` | duracion estimada |

## Eventos recomendados

### API de chat

- `chat.request.received`
- `chat.request.rate_limited`
- `chat.request.processed`
- `chat.gemini.failed`
- `chat.response.fallback_rules`

### Checkout

- `checkout.request.received`
- `checkout.validation.failed`
- `checkout.cart.sync.started`
- `checkout.cart.sync.failed`
- `checkout.order.created`
- `checkout.order.failed`
- `checkout.payment.created`
- `checkout.payment.failed`

### Pedidos y pagos

- `order.update.requested`
- `order.update.failed`
- `payment.receipt.upload.requested`
- `payment.receipt.upload.failed`

## Correlacion con el sistema central

### Convencion objetivo

1. Si llega `x-request-id`, reutilizarlo.
2. Si no llega, generarlo en el BFF.
3. Propagarlo a llamadas al sistema central.
4. Incluirlo en todos los logs derivados de esa request.

## Datos que no deben loggearse completos

- `NEXTAUTH_SECRET`
- tokens JWT
- API keys
- contenido completo de comprobantes
- base64 completos de adjuntos del chat
- payloads completos de usuario cuando no sea necesario

## Nivel de logging recomendado

### Desarrollo

- `debug` o `info`

### Produccion

- `info` por defecto
- `warn` para degradaciones esperadas
- `error` para fallas que afecten flujo o integracion

## Errores que deben dejar evidencia

1. timeout hacia el sistema central
2. error de contrato o payload inesperado del core
3. rechazo por rate limiting
4. falla de Gemini
5. falla parcial del checkout

## Salida minima esperada en fases posteriores

- logger comun
- request ID por request
- logs estructurados en rutas criticas
- eventos minimos de chat y checkout
