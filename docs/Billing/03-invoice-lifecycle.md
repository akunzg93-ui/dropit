# Billing - Invoice Lifecycle

> Última actualización: 27/08/2026

## Solicitud (`invoice_requests`)

La solicitud representa la intención del vendedor de obtener CFDI para un pedido elegible. Conserva el perfil seleccionado y un snapshot fiscal para impedir que cambios posteriores alteren el receptor esperado.

## Factura del establecimiento (`invoices`)

Estados operativos utilizados:

- `pendiente`: existe la obligación documental y todavía no se han validado documentos;
- `procesando`: XML/PDF recibidos y validación en curso;
- `emitida`: CFDI aceptado por validaciones locales y fiscal PAC/SAT;
- `error`: documento rechazado o validación fallida;
- `cancelada`: CFDI cancelado cuando aplique.

### Transición validada en QA

```text
pendiente
   ↓ carga XML/PDF
procesando
   ↓ validación local + PAC/SAT
emitida
```

En caso de error:

```text
pendiente/procesando → error
```

La factura puede reintentarse con documentos corregidos mientras el estado permita validación.

## Independencia del pago

`emitida` significa que el CFDI fue aceptado fiscalmente por Dropit. No significa que el saldo del establecimiento haya sido pagado ni liberado.

## Verificación QA adicional — 05/11/2026 (pedido 85)

En QA se comprobó la transición de la factura del establecimiento a `emitida` tras cargar XML/PDF y validar el CFDI con SW Test. El UUID persistido fue `76C82B00-7655-46CB-9F87-6A367757111E`, serie `QA`, folio `EST85-1793925191537`.

La solicitud asociada (`invoice_requests.estado`) permaneció en `solicitada` mientras `invoices.estado` quedó en `emitida`. Se documenta como comportamiento observado, **sin asumir que deba cambiarse el estado de la solicitud**; revisar el contrato de estados antes de alterar esa relación.
