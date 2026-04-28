# ADR-004 - Postura inicial sobre sesion web y CSRF

- **Estado**: Aceptado
- **Fecha**: 2026-04-28

## Contexto

FitAndes usa NextAuth para sesion web y route handlers propios para mutaciones del BFF.

Eso implica dos realidades:

1. la autenticacion web actual depende de cookies de sesion
2. varias mutaciones criticas del BFF (`checkout`, `orders`, `payments`) no usan hoy un token CSRF explicito propio

La plataforma ya recibe proteccion parcial por el comportamiento por defecto de cookies `SameSite=Lax` y por el hecho de que el BFF valida sesion server-side. Aun asi, esa proteccion no debe asumirse como politica suficiente de largo plazo.

## Decision

En esta etapa se adopta la siguiente postura:

- el BFF puede seguir operando con sesion NextAuth y validacion server-side
- no se declarara "resuelto" el riesgo CSRF hasta introducir una capa explicita de endurecimiento o una justificacion formal completa
- cualquier mutacion nueva debe evaluarse bajo el supuesto de que la proteccion actual es **parcial**, no definitiva

## Medidas inmediatas aceptadas

1. security headers globales
2. validacion runtime de payloads
3. limites y endurecimiento de endpoints publicos
4. documentacion explicita de este boundary

## Medidas diferidas

Para una fase posterior se evaluara una de estas rutas:

1. doble submit token para mutaciones sensibles
2. header anti-CSRF emitido por frontend autenticado
3. separacion mas fuerte entre sesion web y mutaciones BFF
4. endurecimiento adicional por origen y `Sec-Fetch-*`

## Consecuencia

El equipo no debe afirmar que el problema CSRF esta cerrado. Debe afirmarse esto:

**hay una postura documentada, mitigaciones parciales activas y una deuda de seguridad identificada para cierre posterior.**
