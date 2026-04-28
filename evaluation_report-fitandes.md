# Evaluacion Arquitectonica - FitAndes

**Evaluador**: Senior Software Architect  
**Fecha**: 2026-04-28  
**Estado del reporte**: esta version reemplaza la evaluacion previa del 2026-04-23 y refleja el estado actual del repositorio.

## Base de validacion

La evaluacion se apoya en:

- revision del codigo fuente del frontend/BFF
- lectura de `API_DOCUMENTACION.md`
- validacion local de `npm run lint`
- validacion local de `npm run build`

Resultado de baseline:

- `lint`: OK
- `build`: OK

## Veredicto global

**6/10 - funcional y ya integrable, pero todavia no listo para una operacion madura de produccion.**

El proyecto tiene una base razonable: App Router bien organizado, separacion aceptable por dominios, tipado util, y una capa BFF que ya sabe convivir con contratos heterogeneos del sistema central. Eso no es menor.

Lo que impide llamarlo "maduro" no es una sola falla, sino la combinacion de cinco factores:

1. no existe testing automatizado
2. el endpoint publico de chat consume una API externa sin rate limiting ni cuotas
3. la frontera con la API central depende de compatibilidad ad hoc, no de contratos verificables
4. el flujo de checkout sigue teniendo consistencia parcial y sin compensaciones
5. no hay observabilidad operativa real

En resumen: **el sistema funciona**, pero hoy depende demasiado de disciplina manual y de que nada importante cambie en el backend central.

---

## Tabla de evaluacion por dimension

| Dimension | Nota | Veredicto |
|---|:---:|---|
| Estructura del proyecto | 7/10 | Clara y bastante ordenada |
| Arquitectura de integracion con API central | 4/10 | Riesgo alto de drift contractual |
| Sistema de tipos | 6/10 | Util, pero con validacion insuficiente |
| Seguridad | 4/10 | Mejor de lo que decia el reporte anterior, aun insuficiente |
| Diseno del BFF / Route Handlers | 6/10 | Funcional, pero demasiado voluminoso |
| Estado y carrito | 7/10 | Correcto para MVP, limitado para operacion real |
| Testing | 0/10 | Inexistente |
| Observabilidad y operaciones | 2/10 | Casi ausente |
| Performance | 5/10 | Aceptable hoy, escala mal |
| Arquitectura UI / componentes | 5/10 | UX correcta, composicion pobre |
| Documentacion y DX | 4/10 | Documentacion externa buena, setup de proyecto flojo |
| Preparacion para produccion | 4/10 | Aun no listo |

---

## Lo que esta bien

### 1. Estructura general saludable

La organizacion de `src/app`, `src/components`, `src/services`, `src/lib` y `src/types` es razonable. Los route groups `(public)` y `(portal)` estan bien usados y el portal autenticado tambien esta protegido por layout server-side y middleware.

### 2. La capa BFF ya absorbio parte de la complejidad del core

`src/lib/central-api.ts` y `src/services/orders.service.ts` ya encapsulan parte del dolor de convivir con rutas y payloads heterogeneos (`/pedidos`, `/orders`, `/mis-pedidos`, etc.). Eso baja el acoplamiento accidental del resto de la app.

### 3. El dominio de pedidos tiene helpers utiles

`src/types/pedidos.ts` concentra logica de lectura y normalizacion del modelo. Esa decision es buena: reduce complejidad en UI y hace mas viable testear el dominio cuando se agregue una suite.

### 4. Baseline tecnico actual sano

El proyecto hoy:

- compila
- pasa lint
- tiene `strict: true` en TypeScript
- usa una estrategia BFF coherente con Next.js

Eso lo pone por encima de muchos frontends "bonitos" que en realidad no resisten una build limpia.

---

## Riesgos criticos

## 1. Testing inexistente

No hay framework de tests instalado, no hay script `test` en `package.json`, no hay tests unitarios, de integracion ni E2E.

Esto es el riesgo numero uno porque el proyecto ya tiene logica no trivial en:

- `src/app/api/checkout/route.ts`
- `src/lib/chat/engine.ts`
- `src/lib/chat/parser.ts`
- `src/types/pedidos.ts`
- `src/lib/delivery-options.ts`

Sin tests, cualquier cambio en checkout, normalizacion de pedidos o parser del chat puede romper flujos clave sin que nadie se entere hasta produccion.

**Veredicto**: inaceptable para un sistema con pagos, pedidos e integracion externa.

## 2. El endpoint publico de chat puede generar costo externo sin control

`src/app/api/chat/route.ts` es publico y `src/lib/chat/gemini.ts` consume Gemini por API key server-side.

El problema no es que la key este "expuesta" al cliente; no lo esta. El problema real es peor desde arquitectura operativa:

- no hay rate limiting
- no hay cuota por IP o por sesion
- no hay budget guard
- no hay circuito de degradacion por costo
- no hay trazabilidad de consumo por request

Eso significa que un abuso simple puede convertir un feature de soporte en un drenaje de presupuesto.

**Veredicto**: riesgo critico de operacion y costo.

## 3. La frontera con la API central sigue siendo fragil

Este es el punto que mas le faltaba al reporte anterior.

La app ya implementa compatibilidad hacia atras con rutas y formatos distintos. Eso fue una buena decision tactica, pero arquitectonicamente es una senal de deuda:

- no hay versionado formal de la API consumida
- no hay schemas compartidos entre frontend y core
- no hay contract tests
- no hay cliente generado desde OpenAPI
- la compatibilidad se expresa como fallback imperativo en codigo

Ejemplos:

- `src/lib/central-api.ts`
- `src/services/orders.service.ts`
- `src/app/api/checkout/route.ts`

Esto hace que el sistema sea **tolerante a cambios pequenos**, pero tambien **silenciosamente dependiente del conocimiento tribal** del backend.

En lenguaje de arquitectura: falta una **anti-corruption layer formalizada**. Hoy existe una version manual y parcial.

**Veredicto**: riesgo alto de drift contractual y mantenimiento caro.

## 4. El checkout no es transaccional

El flujo actual sigue esta idea:

1. vaciar carrito remoto
2. recrear items remotos
3. crear pedido
4. crear pago QR si aplica

Si algo falla entre medio:

- puede quedar carrito remoto inconsistente
- puede quedar reserva sin pedido final visible
- puede existir pedido sin pago inicializado

El codigo maneja errores de UX razonablemente, pero no resuelve consistencia distribuida.

Eso no significa que "este mal hecho" para un MVP. Significa que **la arquitectura depende de compensacion manual o de tolerancia operativa**.

**Veredicto**: aceptable para etapa temprana, insuficiente para operacion de volumen.

## 5. Observabilidad casi ausente

No hay:

- logging estructurado
- correlation IDs propios
- metricas de negocio
- trazas entre BFF y backend central
- alertas
- monitoreo de fallas del checkout o del chat

Un incidente hoy seria dificil de explicar con evidencia.

**Veredicto**: uno de los mayores huecos de madurez.

---

## Evaluacion detallada

## 1. Estructura del proyecto - 7/10

### Fuerte

- `app/`, `components/`, `lib/`, `services/`, `types/` estan razonablemente separados
- `middleware.ts` y los layouts del portal protegen rutas privadas
- el chat esta particionado por modulos utiles (`engine`, `parser`, `memory`, `formatter`, `gemini`)

### Debil

- `src/types/index.ts` sigue vacio y no aporta valor
- no hay un paquete o carpeta clara para utilidades compartidas de BFF
- no hay una capa formal de contratos/adaptadores hacia la API central
- `src/data/delivery-options.json` sigue actuando como fallback estatico para una fuente que idealmente deberia venir gobernada desde backend

### Veredicto

La estructura es correcta para un repo pequeno-mediano, pero no esta organizada aun como una plataforma integrable de largo plazo.

## 2. Arquitectura de integracion con API central - 4/10

### Fuerte

- se avanzo en encapsular compatibilidad y headers comunes
- el resto de la app ya no depende tanto de conocer todas las variantes de rutas

### Debil

- el fallback por rutas (`/pedidos` vs `/orders`, `/pagos` vs `/payments`) es un parche tactico, no una estrategia contractual
- `fetchCentralApiWithFallback()` no sustituye versionado ni pruebas de contrato
- el sistema central y este BFF no comparten un schema verificable
- se usan normalizaciones de campos en multiples sitios, lo cual senala falta de modelo canonico compartido

### Comentario senior

La pregunta importante aqui no es "funciona hoy?". La pregunta es "que tan caro sera seguirlo manteniendo cuando cambie el core?". La respuesta hoy es: **bastante mas caro de lo deseable**.

## 3. Sistema de tipos - 6/10

### Fuerte

- `strict: true` habilitado
- buenos tipos de dominio base
- helpers puros en `pedidos.ts` y `catalogo.ts`

### Debil

- sigue habiendo casts con `as` sobre respuestas externas
- no hay validacion runtime con schemas
- los tipos de `Pedido` y `PedidoDelivery` absorben demasiada historia del backend
- roles y otros conceptos base siguen duplicados en mas de un archivo

### Veredicto

El tipado ayuda, pero hoy protege mas al desarrollador que al sistema. Ante datos externos mal formados, la defensa sigue siendo debil.

## 4. Seguridad - 4/10

### Lo que esta mejor de lo que decia el reporte anterior

- el repo si excluye `.env*` en `.gitignore`
- existe `.env` local
- el portal autenticado no depende solo del middleware; tambien hay control server-side

### Riesgos reales que permanecen

- `/api/chat` publico sin controles de abuso
- numero de WhatsApp hardcoded en `src/app/api/checkout/route.ts`
- ausencia de policy clara de CSRF para mutaciones basadas en sesion/cookies
- ausencia de validacion de payload con schema en rutas importantes
- frontera de confianza con `x-user-id` y `x-user-role` depende de como verifique el backend central
- `next.config.ts` no define security headers

### Veredicto

No veo una vulnerabilidad unica y obvia que invalide el sistema por si sola. Lo que si veo es una **superficie de seguridad incompleta** para un sistema que maneja pedidos, autenticacion e integracion con servicios externos.

## 5. Diseno del BFF / Route Handlers - 6/10

### Fuerte

- la app implementa bien el patron BFF para proteger el backend central del cliente
- los mensajes de error hacia UI son razonables
- el checkout valida varias reglas de negocio antes de tocar el core

### Debil

- `src/app/api/checkout/route.ts` sigue siendo demasiado grande
- hay demasiada logica de mapping, auth, payload shape y orchestration en un solo archivo
- el endpoint de chat responde `200` incluso en fallback por falla interna, lo que dificulta observabilidad y semantica de errores
- no hay un modulo unificado para auth de route handlers ni para errores comunes

### Veredicto

Funciona, pero aun se siente mas como "codigo de feature" que como "capa BFF consolidada".

## 6. Estado y carrito - 7/10

### Fuerte

- `ReservationCartProvider` es simple y correcto
- hay limites por stock al agregar y actualizar cantidad
- la experiencia de usuario local esta bien resuelta para el nivel del producto

### Debil

- `localStorage` como unica fuente de verdad del carrito
- no hay expiracion ni invalidacion por cambios de stock remotos
- no hay sincronizacion multi-dispositivo
- no hay reconciliacion fuerte entre carrito local y remoto

### Veredicto

Correcto para MVP, insuficiente para una experiencia omnicanal o de operacion real con multiples superficies.

## 7. Testing - 0/10

No hay defensa aqui: simplemente no existe.

Si solo se pudiera financiar una sola mejora transversal, seria esta junto con rate limiting del chat.

## 8. Observabilidad y operaciones - 2/10

### Ausencias relevantes

- sin logger estructurado
- sin request correlation
- sin metricas de conversion o fallas
- sin tracing entre BFF y core
- sin monitoreo de costo IA
- sin CI visible

### Veredicto

Hoy el sistema se puede desarrollar. Operarlo con confianza es otra historia.

## 9. Performance - 5/10

### Problemas principales

- `searchProducts()` y `findSimilarProducts()` cargan catalogo completo y filtran en memoria
- `ChatWidget` se monta en todo el layout publico
- `cache: "no-store"` esta muy extendido
- `CheckoutPageClient.tsx` sigue siendo un componente grande con mucho estado local
- muchas imagenes usan `unoptimized`

### Veredicto

Escala razonablemente para catalogos pequenos y trafico moderado. No esta pensado aun para volumen serio.

## 10. Arquitectura UI / componentes - 5/10

### Fuerte

- la UX general es coherente
- el proyecto tiene identidad visual
- las pantallas clave cumplen su funcion

### Debil

- `CheckoutPageClient.tsx` ronda 800 lineas
- `OrderDeliveryEditSection.tsx` y `SiteHeader.tsx` siguen grandes
- hay mucha repeticion de `Field`, `formatPrice`, estilos y bloques de formulario
- el sistema de UI reusable es practicamente inexistente

### Veredicto

La UI se siente construida por feature, no por sistema.

## 11. Documentacion y DX - 4/10

### Fuerte

- `API_DOCUMENTACION.md` existe y orienta bastante
- hay documentacion funcional del proyecto

### Debil

- falta `.env.example`
- `README.md` sigue casi default
- no hay ADRs
- no hay guia de puesta en marcha real
- no hay documentacion de observabilidad, despliegue ni troubleshooting

### Veredicto

La documentacion existe, pero esta sesgada a explicar el producto, no a operar ni evolucionar el sistema.

## 12. Preparacion para produccion - 4/10

### A favor

- build limpia
- lint limpio
- auth base y BFF ya estan encaminados

### En contra

- sin tests
- sin CI
- sin observabilidad
- sin rate limiting en chat
- sin schemas runtime
- sin contract tests con la API central
- sin politica formal de seguridad de cabeceras
- sin pipeline visible de calidad

### Veredicto

Puede desplegarse. No deberia llamarse "listo para produccion" en un entorno exigente.

---

## Roadmap de remediacion priorizado

## Fase 1 - Riesgo operativo inmediato

1. Agregar rate limiting y cuotas a `/api/chat`
2. Mover `WHATSAPP_NUMBER` a variable de entorno
3. Introducir validacion runtime con Zod en:
   - `api/chat`
   - `api/checkout`
   - `api/orders/[id]`
   - `api/payments/[id]/upload-comprobante`
4. Agregar `security headers` en `next.config.ts`
5. Definir postura CSRF de forma explicita

## Fase 2 - Contrato con el sistema central

1. Definir un modelo canonico del BFF para pedido, pago y entrega
2. Aislar mappings en adaptadores dedicados
3. Crear contract tests contra la API central
4. Eliminar fallback por rutas cuando exista un contrato estable
5. Idealmente, generar cliente desde OpenAPI o esquema formal

## Fase 3 - Testing

1. Instalar Vitest
2. Cubrir primero funciones puras:
   - `types/pedidos.ts`
   - `types/catalogo.ts`
   - `lib/delivery-options.ts`
   - `lib/chat/parser.ts`
3. Agregar tests de integracion para `api/checkout`
4. Agregar smoke tests E2E para:
   - login
   - checkout QR
   - carga de comprobante
   - consulta de pedidos

## Fase 4 - Observabilidad

1. Logging estructurado en route handlers
2. Correlation IDs entre BFF y core
3. Metricas de:
   - conversion a pedido
   - fallas de checkout
   - uso y costo del chat
4. Alertas por errores repetidos y timeouts al backend central

## Fase 5 - Refactor de composicion

1. Partir `CheckoutPageClient.tsx`
2. Extraer primitives de UI
3. Unificar helpers duplicados
4. Reducir estilos inline
5. Revisar estrategia de imagenes y cache

---

## Conclusiones

FitAndes ya no merece la etiqueta de "proyecto improvisado". Tiene estructura, tiene criterio, y ya resuelve una integracion real con un backend central no trivial.

Pero tampoco merece aun la etiqueta de "arquitectura madura". Lo que hoy lo frena no es la falta de features, sino la falta de garantias:

- garantia de contrato
- garantia de regresion
- garantia operativa
- garantia de costo controlado

Mi juicio senior y estricto es este:

**el proyecto esta bien encaminado para seguir evolucionando, pero todavia no tiene las protecciones minimas que separan un frontend funcional de un sistema profesionalmente operable.**

La prioridad correcta no es seguir agregando features. La prioridad correcta es **cerrar la frontera con el core, poner tests, y volver observable el sistema**.
