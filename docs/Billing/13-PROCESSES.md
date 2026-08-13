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

# Proceso: Solicitud de factura

## Objetivo

Registrar una solicitud de facturación y preparar automáticamente ambas facturas necesarias para el pedido.

---

## Flujo

Vendedor

↓

Selecciona un pedido elegible

↓

Solicita factura

↓

Selecciona un perfil fiscal
(o crea uno nuevo)

↓

POST /api/orders/billing/invoice-requests

↓

Validaciones

- Usuario autenticado
- Pedido pertenece al vendedor
- Servicio iniciado
- Coin consumida
- Perfil fiscal válido
- Sin solicitudes previas
- Periodo de facturación vigente

↓

RPC create_billing_invoice_request()

↓

Se crea invoice_request

↓

Se genera snapshot fiscal

↓

Se crean automáticamente:

- invoice (Dropit)
- invoice (Establecimiento)

↓

Settlement bloqueado (cuando aplica)

↓

Respuesta exitosa

↓

Popup
"Solicitud enviada correctamente"

↓

Al volver al pedido

↓

GET /api/orders/billing/invoice-requests

↓

Timeline actualizado

## Resultado esperado

Al finalizar el proceso debe existir:

- 1 registro en `invoice_requests`
- 2 registros en `invoices`
- snapshot fiscal almacenado
- timeline actualizado para el vendedor
- botón "Solicitar factura" deshabilitado

## Próxima etapa

Una vez creada la solicitud, el proceso continuará con la integración del PAC.

Ese flujo será responsable de:

1. Emitir la factura de Dropit.
2. Emitir la factura del establecimiento.
3. Almacenar UUID fiscal.
4. Guardar XML y PDF.
5. Actualizar automáticamente el estado del Timeline.