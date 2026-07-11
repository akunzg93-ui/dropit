# Supabase

> Documento Oficial
>
> Versión: 1.0
>
> Estado: En construcción
>
> Última actualización: 11/07/2026

---

# Objetivo

Supabase constituye el backend oficial de Dropit.

Centraliza la autenticación, la base de datos, las políticas de seguridad, las funciones remotas y las migraciones.

---

# Componentes

## Auth

Administra:

- Inicio de sesión.
- Registro.
- Recuperación de contraseña.
- Gestión de sesiones.

---

## Base de datos

Almacena toda la información operativa del sistema.

Principales dominios:

- Usuarios.
- Pedidos.
- Establecimientos.
- Coins.
- Evaluaciones.
- Protección.
- Balance financiero.

---

## Row Level Security (RLS)

Las políticas RLS constituyen parte de la lógica de negocio.

Todo acceso a datos debe respetar dichas políticas.

Nunca deberán deshabilitarse en producción.

---

## RPC

Las funciones RPC encapsulan reglas de negocio complejas que deben ejecutarse dentro de PostgreSQL.

Ejemplos:

- consume_coin_for_order
- get_pedido_by_folio

---

## Edge Functions

Actualmente existen:

| Función | Responsabilidad |
|---------|-----------------|
| expirar-coins | Expiración automática de Coins |
| pedido-confirmado | Automatización posterior a la confirmación del pedido |

---

## Migraciones

Toda modificación estructural de la base de datos deberá realizarse mediante migraciones.

No deberán ejecutarse cambios manuales directamente sobre producción.

---

## Ambientes

Dropit mantiene ambientes separados para:

- QA
- Producción

Cada ambiente posee:

- Base de datos propia.
- Variables de entorno independientes.
- Edge Functions independientes.

---

# Principios

- Nunca desactivar RLS.
- Nunca modificar tablas directamente en producción.
- Toda nueva tabla deberá incluir políticas de seguridad.
- Toda migración deberá ser versionada.