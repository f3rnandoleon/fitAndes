# Documentacion Completa del Proyecto FitAndes

## 1. Resumen ejecutivo

FitAndes es una aplicacion frontend construida con Next.js 15, React 19, TypeScript y Tailwind CSS 4. El objetivo del proyecto es ofrecer:

- una vitrina publica para explorar el catalogo de productos;
- un flujo de autenticacion para clientes;
- un portal privado donde el cliente puede revisar sus pedidos;
- una capa ligera de reserva local de productos desde el detalle del catalogo.

Este repositorio **no implementa el backend principal de negocio**. La aplicacion consume una API externa configurada mediante variables de entorno.

Archivo complementario:

- `API_DOCUMENTACION.md`: describe la API central consumida por este frontend.

## 2. Stack tecnologico

- Next.js `15.5.9`
- React `19.1.0`
- TypeScript `5`
- NextAuth `4.24.13`
- Tailwind CSS `4`
- ESLint `9`

## 3. Alcance real de este repositorio

Este proyecto contiene principalmente la experiencia web del cliente. Las responsabilidades cubiertas aqui son:

- renderizado de paginas publicas y privadas con App Router;
- login con `next-auth` usando `CredentialsProvider`;
- registro de clientes contra la API externa;
- consulta del catalogo publico;
- consulta de pedidos del cliente autenticado;
- manejo de una reserva local en `localStorage`.

No estan implementados aqui:

- base de datos;
- modelos persistentes de negocio;
- endpoints REST de productos, ventas, inventario o reportes;
- logica de administracion o portal de vendedores/admins.

## 4. Estructura general del proyecto

```text
fitAndes/
|-- src/
|   |-- app/
|   |   |-- (public)/
|   |   |   |-- page.tsx
|   |   |   |-- login/page.tsx
|   |   |   |-- registro/page.tsx
|   |   |   `-- catalogo/
|   |   |       |-- page.tsx
|   |   |       `-- [id]/page.tsx
|   |   |-- (portal)/
|   |   |   |-- layout.tsx
|   |   |   |-- dashboard/page.tsx
|   |   |   `-- pedidos/
|   |   |       |-- page.tsx
|   |   |       `-- [id]/page.tsx
|   |   |-- api/auth/[...nextauth]/route.ts
|   |   |-- globals.css
|   |   `-- layout.tsx
|   |-- components/
|   |   |-- catalogo/
|   |   |-- layout/
|   |   `-- providers/
|   |-- lib/
|   |   |-- auth-options.ts
|   |   `-- catalogo-imagenes.ts
|   |-- middleware.ts
|   `-- types/
|-- public/
|-- API_DOCUMENTACION.md
|-- README.md
|-- package.json
`-- .env
```

## 5. Arquitectura de aplicacion

### 5.1 App Router

El proyecto usa App Router de Next.js con dos grupos de rutas:

- `(public)`: home, login, registro, catalogo y detalle de producto.
- `(portal)`: dashboard y pedidos del cliente.

Importante: los nombres de grupos entre parentesis **no forman parte de la URL publica**. Por lo tanto, las rutas reales son:

- `/`
- `/login`
- `/registro`
- `/catalogo`
- `/catalogo/:id`
- `/dashboard`
- `/pedidos`
- `/pedidos/:id`

### 5.2 Providers globales

`src/app/layout.tsx` monta `AppProviders`, que a su vez inyecta `ReservationCartProvider` para compartir el estado de reservas en toda la app.

### 5.3 Sesion y autenticacion

La sesion se gestiona con NextAuth usando JWT. El flujo es:

1. El usuario se autentica con email y password.
2. NextAuth delega la validacion a la API externa (`POST /auth/login`).
3. Solo se aceptan usuarios con rol `CLIENTE`.
4. La sesion se guarda como JWT y se expone con campos extendidos:
   - `id`
   - `email`
   - `fullname`
   - `role`

## 6. Variables de entorno

Variables efectivamente usadas por el frontend:

| Variable | Obligatoria | Uso |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Si | Base URL publica de la API externa. Se usa para login, signup, catalogo y pedidos. |
| `NEXTAUTH_SECRET` | Si | Firma y cifrado de la sesion JWT de NextAuth. |
| `NEXTAUTH_URL` | Recomendable | URL base de la aplicacion; sirve como fallback en la home para calcular una API interna. |
| `API_URL` | Opcional | Override server-side para llamadas desde componentes del servidor. |

Observacion:

- En el `.env` actual existen `MONGODB_URL`, `JWT_SECRET` y `JWT_EXPIRES_IN`, pero este repositorio no los referencia en el codigo fuente. Parecen pertenecer al backend central, no a esta app cliente.

Ejemplo seguro:

```env
NEXT_PUBLIC_API_URL=https://tu-backend/api
NEXTAUTH_SECRET=tu-secreto-seguro
NEXTAUTH_URL=http://localhost:3000
```

Importante para Google Sign-In:

- `NEXTAUTH_URL` debe coincidir con la URL real desde la que abres la web, incluyendo el puerto.
- Si trabajas en `http://localhost:3001`, ese es el origen que debes registrar en Google Cloud Console.
- `http://localhost:3000` y `http://localhost:3001` cuentan como origenes distintos para Google OAuth.

## 7. Scripts de desarrollo

Definidos en `package.json`:

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: genera la build de produccion.
- `npm run start`: levanta la build generada.
- `npm run lint`: ejecuta ESLint.

## 8. Flujo funcional del usuario

### 8.1 Home

Archivo: `src/app/(public)/page.tsx`

Responsabilidades:

- consulta productos publicos desde la API;
- arma secciones de marketing como hero, recien llegados y seleccion;
- usa `CarruselImagenes` para mostrar fotos por producto;
- genera contenido dinamico segun cantidad de productos disponibles.

### 8.2 Catalogo

Archivo: `src/app/(public)/catalogo/page.tsx`

Responsabilidades:

- obtiene el catalogo publico;
- delega la experiencia de filtrado y ordenamiento a `CatalogoGrid`.

Funcionalidades del grid:

- filtro por color;
- busqueda por nombre, modelo o categoria;
- orden por relevancia, ventas, fecha, descuento y precio;
- visualizacion de stock agregado por producto.

### 8.3 Detalle de producto

Archivo: `src/app/(public)/catalogo/[id]/page.tsx`

Responsabilidades:

- consulta el detalle del producto publico;
- genera metadata dinamica;
- calcula colores y tallas disponibles;
- renderiza `ProductoDetalleCliente`.

`ProductoDetalleCliente` permite:

- cambiar color y talla;
- ver stock por variante;
- visualizar imagenes por variante o producto;
- agregar la seleccion a una reserva local.

### 8.4 Registro

Archivo: `src/app/(public)/registro/page.tsx`

Flujo:

1. valida password y confirmacion en cliente;
2. llama a `POST /auth/signup` en la API externa;
3. si el registro es exitoso, intenta iniciar sesion automaticamente con NextAuth;
4. redirige al area privada si el login posterior tiene exito.

### 8.5 Login

Archivo: `src/app/(public)/login/page.tsx`

Flujo:

1. usa `signIn("credentials")`;
2. NextAuth llama internamente a la API externa;
3. si el login es valido, redirige al dashboard del cliente.

### 8.6 Dashboard del cliente

Archivo: `src/app/(portal)/dashboard/page.tsx`

Responsabilidades:

- valida sesion server-side;
- obtiene `mis-pedidos` desde la API;
- calcula total gastado, cantidad de pedidos y ultimo pedido;
- muestra resumen y accesos rapidos.

### 8.7 Historial de pedidos

Archivo: `src/app/(portal)/pedidos/page.tsx`

Responsabilidades:

- obtiene todos los pedidos del cliente autenticado;
- muestra estado, cantidad de items, fecha y total;
- enlaza al detalle individual.

### 8.8 Detalle de pedido

Archivo: `src/app/(portal)/pedidos/[id]/page.tsx`

Responsabilidades:

- obtiene un pedido puntual desde la API;
- renderiza items comprados;
- muestra subtotal, descuento, metodo de pago y total.

## 9. Integracion con la API externa

Los endpoints realmente consumidos por este frontend son:

| Metodo | Endpoint | Uso |
|---|---|---|
| `POST` | `/auth/login` | Validacion de credenciales desde NextAuth. |
| `POST` | `/auth/signup` | Registro de nuevos clientes. |
| `GET` | `/productos/publicos` | Home y catalogo. |
| `GET` | `/productos/publicos/:id` | Detalle de producto. |
| `GET` | `/mis-pedidos` | Dashboard y listado de pedidos. |
| `GET` | `/mis-pedidos/:id` | Detalle de pedido. |

Notas de integracion:

- Para `mis-pedidos` y `mis-pedidos/:id`, el frontend envia `x-user-id` con el ID de la sesion.
- Los componentes del servidor usan `fetch` con `revalidate: 60` para catalogo publico y `revalidate: 0` para pedidos del cliente.
- La autenticacion de la app depende por completo de la disponibilidad y contrato de la API externa.

## 10. Autenticacion y autorizacion

### 10.1 Configuracion NextAuth

Archivo principal: `src/lib/auth-options.ts`

Caracteristicas:

- `CredentialsProvider` con email y password;
- rechazo explicito de usuarios que no sean `CLIENTE`;
- `session.strategy = "jwt"`;
- `maxAge` de 24 horas;
- pagina de login personalizada en `/login`.

### 10.2 Extensiones de tipos

Archivo: `src/types/next-auth.d.ts`

Se agregan a `Session`, `User` y `JWT` los campos:

- `id`
- `fullname`
- `role`

### 10.3 Proteccion de rutas

Hay dos capas de proteccion:

- `src/app/(portal)/layout.tsx`: hace `redirect("/login")` si no existe sesion valida o si el rol no es `CLIENTE`.
- `src/middleware.ts`: declara `withAuth`, pero actualmente solo hace match sobre `/portal/:path*`.

Esto significa que la proteccion efectiva hoy recae principalmente en el layout server-side, porque las rutas reales del portal son `/dashboard` y `/pedidos`.

## 11. Estado global y reserva local

Archivo: `src/components/providers/ReservationCartProvider.tsx`

La app mantiene una reserva local del catalogo con estas caracteristicas:

- usa React Context;
- persiste en `localStorage` con la clave `fitandes-reservas`;
- guarda items con producto, variante, cantidad, precio y stock disponible;
- fusiona items repetidos por una clave compuesta `producto-color-talla`;
- calcula `totalItems` y `totalAmount`;
- permite agregar, eliminar, actualizar cantidad y vaciar la reserva.

Importante:

- la reserva es **local al navegador**;
- no hay checkout real en este repositorio;
- no existe sincronizacion automatica de esta reserva con la API.

## 12. Componentes principales

### 12.1 `SiteHeader`

Responsabilidades:

- navegacion principal;
- acceso a cuenta;
- acceso al carrito de reservas;
- control visual segun sesion autenticada o anonima.

### 12.2 `CatalogoGrid`

Responsabilidades:

- filtro por color;
- busqueda libre;
- ordenamiento;
- render de tarjetas de producto.

### 12.3 `ProductoDetalleCliente`

Responsabilidades:

- seleccion de variantes;
- calculo de imagenes activas;
- agregado a reserva local.

### 12.4 `VarianteSelector`

Responsabilidades:

- mantener color/talla seleccionados;
- recalcular tallas validas por color;
- informar stock actual.

### 12.5 `CarruselImagenes`

Responsabilidades:

- autoplay configurable;
- navegacion manual;
- indicadores visuales;
- reseteo de indice cuando cambia la galeria.

## 13. Manejo de imagenes

Archivo: `src/lib/catalogo-imagenes.ts`

Capacidades:

- unifica `imagen` e `imagenes[]`;
- soporta rutas absolutas y relativas;
- si recibe una ruta relativa, intenta convertirla a URL absoluta usando el origen de la API;
- prioriza imagenes de variantes sobre imagenes del producto.

Esto permite tolerar diferencias del backend y mantener compatibilidad con respuestas antiguas o mixtas.

## 14. Tipos de datos relevantes

### 14.1 Pedido

Archivo: `src/types/pedidos.ts`

Modelo usado por el portal:

- `Pedido`
  - `_id`
  - `numeroVenta`
  - `createdAt`
  - `estado`
  - `total`
  - `subtotal`
  - `descuento`
  - `metodoPago`
  - `items`
- `PedidoItem`
  - `_id`
  - `nombre`
  - `color`
  - `talla`
  - `cantidad`
  - `precioVenta`

### 14.2 Modelos de producto

No existe un tipo centralizado unico para productos. Cada pagina/componente declara interfaces locales compatibles con la respuesta de la API publica, normalmente con:

- `_id`
- `nombre`
- `modelo`
- `precioVenta`
- `descuento`
- `createdAt`
- `totalVendidos`
- `imagen`
- `imagenes`
- `variantes[]`

## 15. Estilos y sistema visual

Archivo global: `src/app/globals.css`

La interfaz usa una identidad visual sobria y editorial, basada en variables CSS como:

- `--background`
- `--foreground`
- `--surface`
- `--border`
- `--muted`
- `--subtle`
- `--accent`
- `--success`
- `--danger`

Caracteristicas del look & feel:

- paleta neutra inspirada en moda y catalogo premium;
- tipografia principal simple con acentos serif en titulares;
- uso fuerte de bloques, bordes y espacios amplios;
- diseno responsive para desktop y mobile.

## 16. Configuracion tecnica

### 16.1 TypeScript

- `strict: true`
- alias de imports `@/* -> ./src/*`
- `moduleResolution: bundler`

### 16.2 Next.js

- `next.config.ts` no define personalizaciones adicionales;
- el proyecto usa la configuracion base de Next.js.

### 16.3 ESLint

- existe `eslint.config.mjs`;
- el script `npm run lint` ejecuta el chequeo estatico.

## 17. Guia rapida para levantar el proyecto

1. Instalar dependencias:

```bash
npm install
```

2. Crear o ajustar `.env` con al menos:

```env
NEXT_PUBLIC_API_URL=https://tu-backend/api
NEXTAUTH_SECRET=tu-secreto
NEXTAUTH_URL=http://localhost:3000
```

3. Ejecutar en desarrollo:

```bash
npm run dev
```

4. Abrir:

```text
http://localhost:3000
```

## 18. Observaciones tecnicas detectadas

Estas observaciones no impiden entender el proyecto, pero conviene tenerlas presentes:

1. `src/middleware.ts` protege `/portal/:path*`, pero las rutas reales privadas son `/dashboard` y `/pedidos`.
2. Existen referencias a `/portal/dashboard` y `/portal/pedidos` en partes del codigo, aunque por App Router esas URLs no corresponden a las paginas reales.
3. `src/components/layout/PortalNavbar.tsx` parece ser un componente legado y hoy no participa en el layout activo del portal.
4. El estado de reserva vive solo en frontend; no existe proceso de confirmacion o persistencia remota en este repositorio.
5. El archivo `README.md` aun contiene el contenido por defecto de `create-next-app`, por lo que esta documentacion es actualmente la fuente mas fiel del proyecto.

## 19. Relacion con `API_DOCUMENTACION.md`

La lectura recomendada para entender el sistema completo es:

1. Este archivo, para comprender la aplicacion frontend y su arquitectura.
2. `API_DOCUMENTACION.md`, para comprender los endpoints, contratos y permisos del backend central.

En otras palabras:

- este documento explica **como esta construida la app cliente**;
- `API_DOCUMENTACION.md` explica **contra que servicios conversa la app**.

## 20. Conclusiones

FitAndes es hoy un frontend de catalogo y portal de clientes, orientado a ecommerce ligero y consulta de pedidos. La aplicacion esta bien separada del backend principal y usa NextAuth como puente de autenticacion hacia la API externa. Su parte mas madura es la experiencia de lectura del catalogo y consulta de pedidos; la reserva local existe como apoyo de UX, pero todavia no representa un flujo transaccional completo dentro de este repositorio.
