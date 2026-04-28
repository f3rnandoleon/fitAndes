# ADR-002 - Estrategia transitoria de compatibilidad con la API central

- **Estado**: Aceptado
- **Fecha**: 2026-04-28

## Contexto

El sistema central presenta coexistencia de rutas y payloads heterogeneos, por ejemplo:

- `/pedidos` y `/orders`
- `/pagos` y `/payments`
- `/clientes/me` y `/customers/me`

Tambien existen respuestas con nombres en espanol e ingles para un mismo concepto.

Hoy necesitamos soportar esa realidad sin romper la experiencia web.

## Decision

La compatibilidad se permite **solo como estrategia transitoria** y debe quedar encapsulada en la capa de integracion.

## Reglas

1. Los fallbacks de rutas no deben aparecer en componentes de UI.
2. Los mapeos de nombres (`pedido/order`, `entrega/delivery`, etc.) deben centralizarse.
3. Toda compatibilidad nueva requiere:
   - comentario de contexto
   - ubicacion en adaptador/cliente central
   - cobertura por tests de contrato cuando existan
4. La meta no es perpetuar el fallback, sino retirarlo cuando el core tenga contrato estable.

## Consecuencias

### Positivas

- permite seguir entregando producto mientras el core se estabiliza
- reduce el impacto de diferencias contractuales en el resto de la app

### Negativas

- agrega complejidad tactica
- puede esconder drift si no se acompana con observabilidad y testing

## Plan de salida

1. definir modelos canonicos del BFF
2. mover compatibilidad a adaptadores por dominio
3. crear contract tests con fixtures del core
4. retirar rutas y campos legacy una vez formalizado el contrato
