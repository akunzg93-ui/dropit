# Billing - User Flow

> Última actualización: 27/08/2026

## Vendedor

1. El servicio inicia económicamente cuando el establecimiento recibe el paquete.
2. El pedido queda habilitado para solicitar factura dentro del periodo permitido.
3. En **Mis pedidos**, el vendedor selecciona **Solicitar factura**.
4. Selecciona o crea un perfil fiscal reutilizable.
5. `POST /api/orders/billing/invoice-requests` valida propiedad, servicio iniciado, perfil, plazo y duplicados.
6. Se crea `invoice_requests`, se conserva `fiscal_data_snapshot` y se crea el `invoice` de tipo `establecimiento` en estado pendiente.
7. El vendedor ve el estado persistente al volver al pedido.

El vendedor no necesita contactar directamente al establecimiento; Dropit centraliza la solicitud, seguimiento y disponibilidad documental.

## Establecimiento

1. El panel muestra las facturas pendientes.
2. El establecimiento entra a `/establecimiento/facturacion` y abre la solicitud.
3. La pantalla muestra folio, importe esperado y datos fiscales del receptor.
4. El establecimiento emite el CFDI fuera de Dropit y carga XML + PDF.
5. Dropit almacena los documentos en `billing-documents` y marca temporalmente la factura como `procesando`.
6. Se ejecuta validación local y fiscal PAC/SAT.
7. Si todo es correcto, `invoices.estado = emitida`.
8. Si falla, `invoices.estado = error` y se registra `error_mensaje`.

## Resultado

La factura validada queda asociada a la solicitud. Su validación no cambia por sí sola `balance_movimientos.status`; la liberación económica ocurre posteriormente en conciliación mensual.
