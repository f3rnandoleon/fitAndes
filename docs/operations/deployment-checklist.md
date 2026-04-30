# Checklist de Despliegue - FitAndes

Este documento detalla los pasos y verificaciones necesarias para realizar un despliegue seguro en producción.

## 1. Variables de Entorno Requeridas
Asegúrese de que las siguientes variables estén configuradas en el entorno de destino (ej. Vercel, Railway):

- [ ] `NEXTAUTH_SECRET`: Secreto para cifrar sesiones.
- [ ] `NEXTAUTH_URL`: URL base del sitio (ej. `https://fitandes.com`).
- [ ] `NEXT_PUBLIC_API_URL`: URL de la API del Sistema Central.
- [ ] `API_URL`: (Opcional) URL interna de la API si difiere de la pública.
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY`: API Key de Google Gemini.
- [ ] `GEMINI_CHAT_MODEL`: Modelo a utilizar (ej. `gemini-2.0-flash`).
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: ID de cliente para Google Auth.
- [ ] `WHATSAPP_NUMBER`: Número de WhatsApp para notificaciones de checkout.
- [ ] `LOG_LEVEL`: Nivel de logs (usar `info` o `warn` en producción).

## 2. Verificaciones Pre-Despliegue
- [ ] Ejecutar `npm run lint` para asegurar calidad de código.
- [ ] Ejecutar `npm run test` para validar lógica de negocio y adaptadores.
- [ ] Ejecutar `npm run build` para verificar que no hay errores de compilación de Next.js.
- [ ] Verificar que los `remotePatterns` en `next.config.ts` incluyen los dominios de imágenes del core.

## 3. Verificaciones Post-Despliegue (Smoke Tests)
- [ ] **Acceso**: Cargar la página de inicio y catálogo.
- [ ] **Auth**: Iniciar sesión con una cuenta de prueba (Email o Google).
- [ ] **Checkout**: Intentar agregar un producto al carrito y llegar hasta la pantalla de selección de pago.
- [ ] **Chat**: Realizar una consulta al asistente de IA y verificar que responde con productos reales.
- [ ] **Pedidos**: Acceder a `/pedidos` y verificar que se listan los pedidos del usuario.

## 4. Plan de Rollback
En caso de falla crítica:
1. Revertir al commit anterior estable en la rama `main`.
2. Verificar que las variables de entorno no hayan cambiado de forma incompatible.
3. Si el error persiste, revisar logs en el panel de control de hosting buscando errores del Sistema Central o de cuotas de API.

---
**Ultima Actualización**: 2026-04-30
