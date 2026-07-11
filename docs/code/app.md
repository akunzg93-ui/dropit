# Carpeta app

> Documento Oficial
>
> Versión: 1.0
>
> Estado: En construcción
>
> Última actualización: 11/07/2026

---

# Objetivo

La carpeta `app/` contiene todas las rutas del sistema utilizando el App Router de Next.js.

Cada módulo representa una responsabilidad específica del negocio.

---

# Estructura

| Carpeta | Responsabilidad |
|----------|-----------------|
| admin | Panel administrativo |
| api | API Routes del sistema |
| auth | Flujo de autenticación |
| comprador | Flujo del cliente |
| components | Componentes propios de `app` |
| establecimiento | Operación del establecimiento |
| evaluar | Evaluaciones posteriores a la entrega |
| login | Inicio de sesión |
| post-login | Redirección después del login |
| privacidad | Aviso de privacidad |
| reset-password | Recuperación de contraseña |
| seleccionar-rol | Selección inicial de rol |
| terminos | Términos y condiciones |
| track | Seguimiento público del pedido |
| update-password | Cambio de contraseña |
| utils | Utilidades locales |
| vendedor | Flujo del vendedor |
| verificar | Validación de pedidos |

---

# Archivos principales

| Archivo | Responsabilidad |
|----------|-----------------|
| layout.js | Layout principal |
| globals.css | Estilos globales |
| page.tsx | Pantalla principal |
| manifest.ts | Configuración PWA |
| metadata.js | Metadatos de la aplicación |

---

# Convención

Cada módulo debe mantener su lógica agrupada.

No deben mezclarse responsabilidades entre módulos.

Ejemplo:

- El módulo `vendedor` no implementa lógica administrativa.
- El módulo `admin` no implementa lógica del cliente.

Cada carpeta representa un dominio funcional del sistema.