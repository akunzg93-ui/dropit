# Módulo Autenticación

> Documento Oficial
>
> Versión: 1.2
>
> Estado: En construcción
>
> Última actualización: 18/09/2026

---

# Objetivo

Centralizar autenticación, sesión, asignación segura del rol de alta y finalización del registro OAuth mediante Supabase Auth.

El usuario no selecciona libremente su rol después de autenticarse. El rol proviene del flujo de alta iniciado.

---

# Registro por correo

Los registros específicos de vendedor y establecimiento envían metadata explícita con el rol de origen y, después de validar el checkbox obligatorio, las versiones legales aceptadas.

`handle_new_user_dynamic()` crea `profiles` y sólo copia roles públicos permitidos (`vendor`, `establishment`, `buyer`). `admin` nunca puede asignarse desde metadata del cliente. Si `acepta_terminos = true`, el trigger registra en `aceptaciones_legales` las versiones de Términos y Privacidad.

Versión vigente en QA: `2026-09`.

---

# Google OAuth

Los accesos de `/login` y `/vendedor/login` conservan el contexto de alta en el `redirectTo`:

- establecimiento → `/auth/callback?role=establishment`
- emprendedor → `/auth/callback?role=vendor`

El parámetro sólo se admite para esos dos valores y no sustituye un rol ya existente.

Un usuario OAuth nuevo se crea inicialmente sin rol y sin aceptación legal. Autenticarse con Google no equivale a aceptar Términos o Aviso de Privacidad.

---

# Ruta: /auth/callback

## Responsabilidad

1. Recibe `code` y, cuando aplica, el contexto `role`.
2. Intercambia el código por sesión (`exchangeCodeForSession`).
3. Persiste cookies.
4. Valida el contexto a `vendor` o `establishment`.
5. Redirige a `/post-login?role=...` o `/post-login`.
6. En error redirige a `/login?error=auth_callback`.

No asigna roles ni registra aceptación legal.

---

# Ruta: /completar-registro

Pantalla exclusiva para finalizar un alta OAuth nueva con `profiles.role = NULL`.

- Sólo admite `role=vendor` o `role=establishment`.
- Exige checkbox explícito de Términos y Aviso de Privacidad.
- Llama a `completar_registro_oauth` con versiones `2026-09`.
- La RPC asigna rol y registra aceptación legal atómicamente.
- Si la cuenta ya tiene rol, la pantalla no permite cambiarlo y regresa a `/post-login`.

---

# Ruta: /post-login

Actúa como router según el rol ya existente.

- `vendor` → `/vendedor/dashboard`.
- `buyer` → `/comprador`.
- `admin` → `/admin`.
- `establishment` → resuelve su estado de onboarding.
- perfil sin rol + contexto OAuth válido → `/completar-registro?role=...`.
- perfil sin rol sin origen válido o rol desconocido → cierra sesión y regresa a `/login`.

Para establecimiento:

- sin ubicaciones → `/establecimiento`;
- con al menos una ubicación activa y `fiscal_profile_id` → `/establecimiento/estado`;
- con ubicaciones pero ninguna configurada → onboarding fiscal del establecimiento más reciente.

La antigua ruta `/seleccionar-rol` fue eliminada: ningún usuario autenticado puede autoasignarse libremente `vendor`, `establishment` o `buyer`.

---

# Ruta: /auth/confirm

Procesa enlaces de recuperación y verificación mediante `verifyOtp()`. `recovery` redirige a `/update-password`; otros casos continúan hacia `/post-login`.

---

# Rutas principales

| Ruta | Función |
|---|---|
| `/login` | Login de establecimiento / entrada Google de establecimiento |
| `/vendedor/login` | Login de emprendedor / entrada Google de emprendedor |
| `/completar-registro` | Aceptación legal y asignación atómica de rol para OAuth nuevo |
| `/post-login` | Router por rol y estado de onboarding |
| `/auth/callback` | Callback OAuth |
| `/auth/confirm` | Confirmación y recuperación |
| `/reset-password` | Solicitar recuperación |
| `/update-password` | Definir nueva contraseña |

---

# Validación QA

Se validaron altas por correo y Google OAuth para vendedor y establecimiento. En OAuth se comprobó el estado intermedio `role = NULL` sin aceptación legal y, tras el checkbox, la creación de `role` y aceptación `2026-09` antes de continuar al destino correspondiente.
