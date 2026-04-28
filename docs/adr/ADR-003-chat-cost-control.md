# ADR-003 - Politica de chat con IA y control de costo

- **Estado**: Aceptado
- **Fecha**: 2026-04-28

## Contexto

FitAndes expone un endpoint publico de chat que puede apoyarse en Gemini.  
Eso mejora experiencia, pero introduce riesgo operativo:

- costo por request a proveedor externo
- abuso por bots o scraping
- latencia variable
- fallas del proveedor

## Decision

El chat se considera una capacidad **degradables** y **presupuestada**, no una dependencia critica dura.

## Reglas

1. El endpoint de chat debe tener rate limiting.
2. Debe existir fallback funcional sin IA cuando Gemini falle o sea bloqueado.
3. Los errores del proveedor externo deben ser observables.
4. El uso del chat debe poder medirse por request y por origen.
5. La configuracion del modelo y la activacion de IA deben quedar externalizadas.

## Consecuencias

### Positivas

- se protege el presupuesto
- se evita que una falla de Gemini tumbe toda la experiencia
- se vuelve posible apagar o degradar IA sin romper el chat

### Negativas

- la experiencia del usuario puede variar entre modo IA y modo reglas
- agrega necesidad de observabilidad y politicas de cuota

## Proximos pasos

1. rate limiting en `/api/chat`
2. logging estructurado de uso y fallas
3. definicion de limites por IP/sesion
4. metrica de requests con IA vs fallback por reglas
