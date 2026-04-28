# ADR-001 - FitAndes como BFF y frontera con el sistema central

- **Estado**: Aceptado
- **Fecha**: 2026-04-28

## Contexto

FitAndes sirve una experiencia web de cliente, pero los datos de negocio y los flujos operativos viven en un sistema central separado.

El frontend no debe hablar directamente con todos los detalles del core porque:

- el contrato del core no es completamente estable
- existen variantes legacy y modernas
- la web necesita semantica y UX propias
- algunos flujos requieren autenticacion web con NextAuth

## Decision

FitAndes se mantiene como **BFF (Backend for Frontend)**.  
Toda compatibilidad con el sistema central debe vivir en la capa de integracion del BFF, no dispersarse en componentes de UI.

## Reglas

1. La UI no debe conocer rutas legacy del core.
2. Los route handlers y servicios deben consumir un cliente/adaptador comun hacia la API central.
3. Los modelos de UI deben tender a un shape canonico propio del BFF.
4. Cualquier excepcion contractual con el core debe documentarse y aislarse.

## Consecuencias

### Positivas

- menor acoplamiento accidental en componentes
- mejor capacidad de evolucionar UX sin exponer detalles del core
- punto unico para observabilidad y politicas de seguridad

### Negativas

- el BFF asume complejidad adicional de adaptacion
- si no se controla, el BFF puede convertirse en lugar de deuda de compatibilidad

## Implicacion para fases siguientes

- crear adaptadores dedicados por dominio
- formalizar modelos canonicos
- agregar contract tests
