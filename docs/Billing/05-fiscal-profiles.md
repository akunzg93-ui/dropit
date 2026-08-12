# Billing - Fiscal Profiles

## Objetivo

Permitir que cada vendedor almacene y administre uno o más perfiles fiscales para solicitar facturas de manera rápida.

---

## Principios

- Un vendedor puede tener uno o más perfiles fiscales.
- Uno de ellos será el perfil predeterminado.
- Los perfiles pueden crearse, editarse o desactivarse.
- Cada solicitud de factura utiliza el perfil seleccionado por el vendedor.

---

## Datos requeridos

- RFC
- Nombre o Razón Social
- Código Postal Fiscal
- Régimen Fiscal
- Uso del CFDI
- Correo electrónico

---

## Flujo

### Primera solicitud

Si el vendedor no tiene perfiles fiscales:

- captura un nuevo perfil;
- el perfil queda como predeterminado.

---

### Solicitudes posteriores

Antes de enviar la solicitud, el vendedor podrá:

- seleccionar un perfil existente;
- crear un nuevo perfil;
- editar un perfil existente.

Al confirmar la solicitud, se utilizará el perfil seleccionado.

---

## Administración

Los perfiles fiscales estarán disponibles desde:

**Mi Cuenta → Facturación → Perfiles fiscales**

Acciones disponibles:

- Crear perfil.
- Editar perfil.
- Establecer como predeterminado.
- Desactivar perfil.

---

## Principio

Los perfiles fiscales se administran una sola vez y pueden reutilizarse en cualquier solicitud de factura futura.