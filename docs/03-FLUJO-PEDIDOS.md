# Flujo Oficial de Pedidos

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Oficial
>
> Última actualización: 08/07/2026

---

# Objetivo

Este documento define el comportamiento oficial del flujo de pedidos de Dropit.

El flujo de pedidos constituye el núcleo del sistema.

Todas las funcionalidades relacionadas con clientes, vendedores, establecimientos, correos, códigos de seguridad, tracking y auditoría dependen de este flujo.

---

# Principio

Un pedido únicamente puede encontrarse en un estado a la vez.

Las reglas del negocio no pertenecen a los estados.

Las reglas pertenecen a las transiciones entre estados.

---

# Máquina de estados

```text
          Crear pedido
               │
               ▼
        ┌─────────────┐
        │   Creado    │
        └─────────────┘
               │
               │ Cliente confirma establecimiento
               ▼
      ┌─────────────────┐
      │  En tránsito    │
      └─────────────────┘
               │
               │ Establecimiento recibe
               ▼
 ┌────────────────────────────┐
 │ Pendiente de recolección   │
 └────────────────────────────┘
               │
               │ Cliente recoge
               ▼
        ┌──────────────┐
        │  Entregado   │
        └──────────────┘
```

---

# Estados oficiales

Actualmente el sistema reconoce los siguientes estados oficiales:

| Estado | Descripción |
|---------|-------------|
| creado | Pedido generado por el vendedor. |
| en_transito | El cliente seleccionó un establecimiento y el vendedor debe entregar el paquete. |
| pendiente_recoleccion | El establecimiento recibió correctamente el paquete y está listo para ser recogido. |
| entregado | El pedido fue entregado al cliente y el flujo terminó. |

No existen estados adicionales autorizados fuera de este documento.

---

# Estados oficiales

## Estados implementados

| Estado | Descripción | Estado terminal |
|---------|-------------|-----------------|
| creado | El vendedor crea el pedido. | No |
| validando_establecimiento | El cliente debe seleccionar un establecimiento. | No |
| en_transito | El establecimiento fue asignado y el vendedor debe entregar el paquete. | No |
| pendiente_recoleccion | El establecimiento recibió el paquete y espera al cliente. | No |
| entregado | El cliente recibió el paquete. El flujo finalizó correctamente. | Sí |

---

# Estados futuros

Los siguientes estados podrán incorporarse en versiones futuras mediante un RFC y su correspondiente ADR.

- cancelado
- expirado
- devuelto

Estos estados no forman parte de la versión actual del sistema.

---

# Transiciones oficiales

| ID | De | A | Actor |
|----|----|---|-------|
| T-001 | — | creado | Vendedor |
| T-002 | creado | validando_establecimiento | Cliente |
| T-003 | validando_establecimiento | en_transito | Sistema |
| T-004 | en_transito | pendiente_recoleccion | Establecimiento |
| T-005 | pendiente_recoleccion | entregado | Establecimiento |

---

# Transición T-001

## Crear pedido

**De:** Inicio

**A:** creado

**Actor:** Vendedor

### Reglas

- El vendedor debe estar autenticado.
- Debe contar con al menos una coin disponible del tamaño correspondiente.
- Debe capturar la información obligatoria del pedido.
- Debe seleccionar uno o más establecimientos candidatos.

### Acciones del sistema

- Genera el folio único.
- Consume una coin.
- Inserta el pedido.
- Inserta los establecimientos candidatos.
- Registra el evento correspondiente.

### Resultado

El pedido queda creado y disponible para que el cliente seleccione un establecimiento.

---

# Transición T-002

## Seleccionar establecimiento

**De:** creado

**A:** validando_establecimiento

**Actor:** Cliente

### Reglas

- El folio debe existir.
- El pedido debe encontrarse en estado `creado`.
- El cliente debe seleccionar uno de los establecimientos disponibles.

### Acciones del sistema

- Valida la selección.
- Asocia el establecimiento definitivo al pedido.

### Resultado

El pedido queda listo para confirmar la asignación del establecimiento.

---

# Transición T-003

## Confirmar establecimiento

**De:** validando_establecimiento

**A:** en_transito

**Actor:** Sistema

### Reglas

- Debe existir un establecimiento seleccionado.
- El pedido debe permanecer en estado `validando_establecimiento`.

### Acciones del sistema

- Actualiza el estado del pedido.
- Registra el evento correspondiente.
- Envía el correo al vendedor con el código de recepción.

### Resultado

El vendedor puede entregar el paquete al establecimiento seleccionado.

---

# Transición T-004

## Recibir pedido

**De:** en_transito

**A:** pendiente_recoleccion

**Actor:** Establecimiento

### Reglas

- El folio debe existir.
- El código del vendedor debe ser válido.
- El pedido debe estar en estado `en_transito`.

### Acciones del sistema

- Valida el código.
- Genera el código de entrega (si no existe).
- Actualiza el estado.
- Registra el evento.
- Envía el correo al cliente con el QR de recolección.

### Resultado

El pedido queda disponible para ser recogido.

---

# Transición T-005

## Entregar pedido

**De:** pendiente_recoleccion

**A:** entregado

**Actor:** Establecimiento

### Reglas

- El código de entrega debe ser válido.
- El pedido debe estar en estado `pendiente_recoleccion`.

### Acciones del sistema

- Valida el código.
- Actualiza el estado.
- Registra el evento.

### Resultado

El flujo del pedido finaliza correctamente.

---

# Validaciones generales

Todas las transiciones del flujo deberán cumplir las siguientes reglas:

- El pedido debe existir.
- El estado actual debe coincidir con la transición solicitada.
- Solo el actor autorizado puede ejecutar la transición.
- Toda transición deberá registrarse en el historial del pedido.
- Ninguna transición podrá ejecutarse dos veces.

---

# Auditoría

Cada transición deberá generar un registro en `pedido_eventos`.

El registro deberá contener al menos:

- Pedido.
- Estado alcanzado.
- Descripción del evento.
- Fecha y hora.

El historial constituye la fuente oficial para el tracking del pedido.

---

# Notificaciones

El sistema enviará notificaciones únicamente cuando una transición lo requiera.

| Transición | Notificación |
|------------|--------------|
| T-003 | Correo al vendedor con código de recepción |
| T-004 | Correo al cliente con QR de recolección |

---

# Errores

Cuando una transición falle:

- El estado del pedido no deberá modificarse.
- No deberán enviarse notificaciones.
- Deberá registrarse el motivo del error en los logs del sistema.

---

# Cierre del flujo

El flujo concluye cuando el pedido alcanza el estado `entregado`.

A partir de este punto no podrán ejecutarse nuevas transiciones sobre el pedido.

---

# Evoluciones futuras

Las siguientes funcionalidades se consideran extensiones del flujo y deberán diseñarse mediante un RFC antes de implementarse:

- Cancelaciones.
- Expiración automática.
- Devoluciones.
- Entrega manual por contingencia.
- Reprogramación de entrega.