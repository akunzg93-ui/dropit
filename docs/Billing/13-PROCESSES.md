# Billing - Processes

## Objetivo

Definir los procesos internos que ejecuta Billing a partir de los eventos del negocio.

---

# Process 001

## Reserva de Coin

Evento

OrderCreated

Responsable

Billing

Acciones

1. Buscar Coin disponible.
2. Reservarla.
3. Registrar movimiento.
4. Actualizar contexto económico del pedido.

---

# Process 002

## Consumo de Coin

Evento

OrderReceivedByEstablishment

Responsable

Billing

Acciones

1. Validar reserva.
2. Consumir Coin.
3. Registrar movimiento.
4. Crear Settlement.
5. Habilitar facturación.

---

# Process 003

## Solicitud de factura

Evento

InvoiceRequested

Responsable

Billing

Acciones

1. Validar plazo.
2. Obtener perfil fiscal.
3. Generar Snapshot.
4. Crear Invoice Request.
5. Bloquear Settlement.

---

# Process 004

## Emisión de factura Dropit

Evento

InvoiceRequested

Responsable

Billing

Acciones

1. Construir CFDI.
2. Enviar al PAC.
3. Guardar UUID.
4. Guardar XML.
5. Guardar PDF.

---

# Process 005

## Recepción factura establecimiento

Evento

EstablishmentInvoiceReceived

Responsable

Billing

Acciones

1. Validar XML.
2. Validar PDF.
3. Actualizar Invoice.
4. Liberar Settlement.

---

# Process 006

## Pago

Evento

SettlementReleased

Responsable

Billing

Acciones

1. Ejecutar pago.
2. Registrar fecha.
3. Cambiar estado.
4. Registrar historial.