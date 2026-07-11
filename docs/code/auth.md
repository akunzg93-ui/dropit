# Módulo Autenticación

> Documento Oficial
>
> Versión: 1.0
>
> Estado: En construcción
>
> Última actualización: 11/07/2026

---

# Objetivo

Centralizar la autenticación de usuarios mediante Supabase Auth.

El módulo administra el inicio de sesión, recuperación de contraseña y establecimiento de la sesión.

---

# Ruta: /auth/callback

## Responsabilidad

Procesar el callback enviado por Supabase después de un inicio de sesión o autenticación.

## Flujo

1. Recibe el parámetro `code`.
2. Intercambia el código por una sesión (`exchangeCodeForSession`).
3. Guarda las cookies de autenticación.
4. Redirige al usuario a `/post-login`.
5. Si ocurre un error, redirige a `/login?error=auth_callback`.

## Integraciones

- Supabase Auth
- Cookies de Next.js

## Resultado

El usuario queda autenticado y la sesión queda disponible para el resto de la aplicación.

---

## Observaciones

Esta ruta es crítica para el funcionamiento del login.

No debe modificarse sin validar previamente:

- inicio de sesión;
- cambio de contraseña;
- persistencia de cookies;
- redirecciones posteriores al login.

---

# Ruta: /auth/confirm

## Responsabilidad

Procesar los enlaces enviados por Supabase para:

- Recuperación de contraseña.
- Verificación de identidad.

## Flujo

1. Recibe `token_hash` y `type`.
2. Verifica el token mediante `verifyOtp()`.
3. Crea la sesión correspondiente.
4. Redirige según el tipo de operación.

## Redirecciones

| Tipo | Destino |
|------|---------|
| recovery | `/update-password` |
| otros | `/post-login` |

## Integraciones

- Supabase Auth
- Cookies de Next.js

## Resultado

El usuario obtiene una sesión válida para continuar con el flujo correspondiente.

---

# Principios del módulo

La autenticación de Dropit se basa completamente en Supabase Auth.

Las rutas de autenticación únicamente:

- Validan tokens.
- Crean sesiones.
- Persisten cookies.
- Redirigen al usuario.

No contienen reglas de negocio.

---

# Rutas principales

| Ruta | Función |
|------|----------|
| `/login` | Inicio de sesión |
| `/reset-password` | Solicitar recuperación |
| `/update-password` | Definir nueva contraseña |
| `/post-login` | Redirección posterior al login |
| `/auth/callback` | Callback de autenticación |
| `/auth/confirm` | Confirmación y recuperación |

---

# Riesgos

Las rutas de autenticación son críticas para el sistema.

Cualquier modificación deberá validar:

- Inicio de sesión.
- Recuperación de contraseña.
- Persistencia de sesión.
- Cookies.
- Redirecciones.