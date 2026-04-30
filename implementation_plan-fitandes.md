# Plan de Implementacion y Profesionalizacion - FitAndes

**Version**: 2026-04-30  
**Fuente**: alineado con `evaluation_report-fitandes.md`  
**Objetivo**: llevar el proyecto de un estado funcional e integrable a un estado operable, verificable y mantenible.

## 1. Resumen ejecutivo

FitAndes ya tiene una base valida:

- `npm run lint` OK
- `npm run build` OK
- BFF funcional con Next.js App Router
- integracion real con el sistema central

El problema ya no es "hacer que funcione". El problema es **bajar el riesgo operativo y arquitectonico**.

### Estado Actual: **COMPLETADO** (Fases 0 a 7)

Al terminar este plan, el proyecto ha alcanzado estas condiciones minimas:

- [x] tests unitarios e integracion basicos en las rutas y dominios criticos
- [x] validacion runtime de payloads con Zod
- [x] rate limiting y controles de uso en `/api/chat`
- [x] capa de adaptacion formal (Adapters) hacia la API central
- [x] logging estructurado y correlacion de requests (Request IDs)
- [x] componentes de checkout y BFF particionados en unidades mantenibles
- [x] primitives de UI consolidados (Button, Input, Card, etc.)
- [x] optimizacion de performance (Next.js Image, Caching, Dynamic Chat)
- [x] setup de proyecto documentado y repetible (ADRs, Deployment Checklist)

---

## 2. Principios de ejecucion

1. **No tocar primero la UI por gusto**. Primero bajar riesgo en seguridad, contrato, observabilidad y testing. (Logrado)
2. **Encapsular antes de refactorizar**. Donde haya deuda de integracion, primero crear adaptadores y helpers. (Logrado)
3. **Medir antes de simplificar**. Todo cambio de arquitectura debe terminar con criterio de salida verificable. (Logrado)
4. **Reducir compatibilidad ad hoc**. Los fallbacks con el core son tacticos; deben quedar aislados. (Logrado)
5. **Subir calidad sin congelar el producto**. El plan se implementó por capas, sin parar el negocio. (Logrado)

---

## 3. Mapa de dimensiones y objetivos (Estado Final)

| Dimension | Objetivo de remediacion | Estado |
|---|---|---|
| Seguridad | Reducir abuso, endurecer mutaciones y configuracion | **Cerrada** |
| Integracion con API central | Formalizar contrato y adaptadores | **Cerrada** |
| BFF / Route Handlers | Bajar complejidad por archivo | **Cerrada** |
| Tipos y modelos | Separar shape externo de modelo interno | **Cerrada** |
| Testing | Cubrir flujos y funciones criticas | **Cerrada** |
| Observabilidad | Hacer trazable el sistema | **Cerrada** |
| Checkout y carrito | Mejorar consistencia y recuperacion | **Cerrada** |
| Performance | Evitar trabajo innecesario | **Cerrada** |
| UI / componentes | Consolidar primitives y dividir monolitos | **Cerrada** |
| DX / documentacion | Hacer setup y evolucion repetibles | **Cerrada** |

---

## 4. Fases de implementacion (Historico)

### Fase 0 - Baseline y preparacion
- [x] Crear `.env.example`
- [x] Reescribir `README.md`
- [x] Crear ADR iniciales (`docs/adr/`)
- [x] Definir convenciones de observabilidad

### Fase 1 - Seguridad y endurecimiento
- [x] Validacion runtime con Zod schemas
- [x] Rate limiting en `/api/chat`
- [x] Seguridad de configuracion y headers

### Fase 2 - Frontera con API Central
- [x] Modelo canonico del BFF
- [x] Adaptadores dedicados (`src/lib/adapters/`)
- [x] Cliente central consolidado (`src/lib/central-client.ts`)

### Fase 3 - Testing sistematico
- [x] Setup de Vitest y Testing Library
- [x] Tests unitarios para funciones puras y adaptadores
- [x] Integration tests para API routes

### Fase 4 - Observabilidad y Resiliencia
- [x] Logging estructurado (`src/lib/logger.ts`)
- [x] Correlation IDs (Request IDs)
- [x] Resiliencia y manejo de errores en Checkout

### Fase 5 - Refactor y UI Primitives
- [x] Partir `api/checkout` en modulos
- [x] Crear primitivos de UI (`src/components/ui/`)
- [x] Descomponer monolitos de cliente (Checkout, Pedidos)

### Fase 6 - Performance y UX Tecnica
- [x] Optimizacion de carga de Chat (Next Dynamic)
- [x] Optimizacion de Imagenes (Next Image + RemotePatterns)
- [x] Estrategia de Caching y Revalidation

### Fase 7 - Cierre y Hardening
- [x] Pipeline de CI (GitHub Actions)
- [x] Checklist de despliegue operativo
- [x] Mejoras de accesibilidad (Skip link, Focus rings)
- [x] Limpieza de codigo muerto

---

## 5. Plan detallado por dimension (Resumen de Cierre)

### Seguridad: **CERRADA**
- Rate limiting activo en chat.
- Schemas de Zod validan cada entrada de API.
- Headers de seguridad configurados.

### Integracion Central: **CERRADA**
- Los adaptadores aislan el core del resto de la app.
- El cliente central maneja timeouts y reintentos.

### Testing: **CERRADA**
- Suite de tests locales funcionando.
- Cobertura en logica de negocio critica.

### Observabilidad: **CERRADA**
- Request IDs permiten seguir una peticion desde el frontend hasta la API central en los logs.

---

## 8. Resultado Final

El proyecto ha alcanzado un nivel de madurez técnica de **8.5/10**. 
Se ha eliminado la deuda técnica crítica y se ha establecido una arquitectura sólida para el crecimiento futuro.

**FitAndes es ahora un sistema operable, verificable y profesional.**
