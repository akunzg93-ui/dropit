# Billing - Invoice Processing

> Última actualización: 27/08/2026

## Solicitud

El vendedor crea una única solicitud. El backend valida elegibilidad y crea:

- `invoice_requests` con snapshot fiscal;
- un `invoices` de `tipo_emisor = establecimiento`.

No se crea actualmente una factura Dropit por pedido.

## Recepción del CFDI del establecimiento

El establecimiento carga XML y PDF. El upload:

- valida autenticación y propiedad del establecimiento;
- valida tipo/tamaño de archivos;
- almacena ambos documentos en el bucket privado `billing-documents`;
- actualiza la factura a `procesando`.

## Validación local

`validateEstablishmentCfdi` descarga y parsea el XML y compara:

- RFC emisor = RFC del perfil fiscal del establecimiento;
- RFC receptor = RFC del snapshot del vendedor;
- total CFDI = `balance_movimientos.monto_bruto`.

También persiste UUID, subtotal, total y fecha de emisión.

## Validación fiscal

Después de la validación local se usa la abstracción PAC. Con SW, `/validate/cfdi` debe devolver una operación exitosa y un CFDI vigente/localizado ante SAT. Un HTTP 200 por sí solo no es suficiente.

Resultado válido:

`invoices.estado = emitida`

Resultado inválido:

`invoices.estado = error` + `error_mensaje`.

## Separación financiera

Este proceso no libera ni paga `balance_movimientos`. La conciliación mensual es un proceso independiente.

## Evidencia de prueba integral QA — 05/11/2026

Pedido `85` (`EW-LOG65P6Z`), importe `$60.00 MXN`, receptor RFC `KAHO641101B39`. Se timbró un CFDI de prueba con SW Test, se cargaron XML y PDF desde la pantalla del establecimiento y la UI confirmó «CFDI validado correctamente» y «Factura validada correctamente».

Consulta posterior en Supabase QA: `invoices.estado = emitida`, UUID `76C82B00-7655-46CB-9F87-6A367757111E`, serie `QA`, folio `EST85-1793925191537`; rutas `xml_path` y `pdf_path` presentes en almacenamiento privado. El establecimiento confirmó que el registro aparece en el historial de facturas entregadas.

Esta prueba confirma el **camino exitoso**. No constituye evidencia de cobertura de reintentos, CFDI rechazados, cancelación fiscal o conciliación/pago.
