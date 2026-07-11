# Seguridad de Dropit

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Oficial
>
> Última actualización: 08/07/2026

---

# Objetivo

Definir las reglas de seguridad que protegen el flujo operativo de Dropit.

La seguridad de Dropit se basa en validar cada transición del pedido y minimizar la posibilidad de fraude o errores operativos.

---

# Principios

- Nunca confiar únicamente en el cliente.
- Toda transición debe validarse desde el servidor.
- Cada actor solo puede ejecutar las acciones que le corresponden.
- Todo evento importante debe quedar registrado.
- La seguridad tiene prioridad sobre la comodidad cuando exista conflicto.

---

# Actores

Actualmente existen cuatro actores oficiales.

- Cliente
- Vendedor
- Establecimiento
- Administrador

Cada uno posee permisos diferentes.

---

# Seguridad del pedido

Cada pedido posee:

- Folio público.
- Código de recepción para el vendedor.
- Código de entrega para el cliente.

Cada código tiene un propósito específico.

---

# Folio

El folio identifica públicamente un pedido.

Puede utilizarse para:

- Tracking.
- Consulta.
- Validaciones iniciales.

El folio por sí solo nunca autoriza una entrega.

---

# Código del vendedor

Permite al establecimiento confirmar que quien entrega el paquete es el vendedor autorizado.

Se utiliza únicamente durante la recepción del paquete.

No debe reutilizarse posteriormente.

---

# Código de entrega

Permite validar la entrega al cliente.

Puede presentarse mediante:

- QR.
- Código numérico.

Una vez utilizado, el pedido finaliza.

---

# Validaciones

Antes de ejecutar cualquier transición el sistema valida:

- Existencia del pedido.
- Estado actual.
- Código correspondiente.
- Permisos del actor.
- Reglas del flujo.

Si alguna validación falla, la transición se rechaza.

---

# Auditoría

Toda transición genera un registro en `pedido_eventos`.

El historial constituye la evidencia oficial del flujo.

No debe eliminarse.

---

# Autenticación

La autenticación es administrada mediante Supabase Auth.

Los permisos adicionales se determinan utilizando el perfil del usuario.

---

# Base de datos

La base utiliza Row Level Security (RLS).

Las operaciones críticas utilizan Service Role únicamente desde el servidor.

Nunca desde el cliente.

---

# APIs

Las APIs representan la autoridad del negocio.

Toda validación crítica debe ejecutarse antes de modificar la base de datos.

---

# Frontend

El frontend nunca constituye una fuente confiable.

Toda información recibida deberá validarse nuevamente en servidor.

---

# Registro de eventos

Los errores relevantes deberán registrarse en logs para facilitar auditoría y soporte.

---

# Evolución

En futuras versiones podrán incorporarse mecanismos adicionales como:

- Entrega manual por contingencia.
- Códigos de un solo uso con expiración.
- Auditoría ampliada.
- Alertas de fraude.
- Bitácora administrativa.