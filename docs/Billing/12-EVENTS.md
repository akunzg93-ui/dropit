# Billing - Events

## Objetivo

Definir los eventos de negocio que activan procesos dentro del dominio Billing.

Billing no depende de pantallas ni de llamadas entre componentes.

Billing reacciona a eventos del negocio.

---

# Principios

- Un evento representa un hecho ocurrido.
- Los eventos son inmutables.
- Un mismo evento puede producir múltiples acciones.
- Billing nunca depende del frontend para iniciar procesos internos.

---

# Eventos

## OrderCreated

Descripción

El vendedor creó un pedido correctamente.

Acciones

- Reservar una Coin.
- Crear el contexto económico del pedido.

---

## OrderReceivedByEstablishment

Descripción

El establecimiento recibió físicamente el paquete.

Acciones

- Consumir la Coin.
- Crear la liquidación.
- Habilitar la futura solicitud de factura.

---

## InvoiceRequested

Descripción

El vendedor solicita una factura.

Acciones

- Crear Invoice Request.
- Capturar Snapshot Fiscal.
- Bloquear temporalmente la liquidación cuando corresponda.

---

## DropitInvoiceIssued

Descripción

Dropit emitió correctamente su CFDI.

Acciones

- Registrar UUID.
- Almacenar XML.
- Almacenar PDF.

---

## EstablishmentInvoiceReceived

Descripción

El establecimiento entregó su CFDI.

Acciones

- Validar documentos.
- Desbloquear liquidación cuando corresponda.

---

## SettlementReleased

Descripción

La liquidación quedó autorizada para pago.

Acciones

- Marcar Settlement como listo para pago.

---

## SettlementPaid

Descripción

Dropit confirmó el pago al establecimiento.

Acciones

- Registrar fecha de pago.
- Finalizar Settlement.

---

## InvoiceCancelled

Descripción

Un CFDI fue cancelado.

Acciones

- Actualizar estado.
- Registrar historial.

---

# Principio

Los eventos representan hechos del negocio.

Las reglas de negocio reaccionan a los eventos.

Nunca al revés.