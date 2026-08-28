# Billing - Data Model

> Última actualización: 27/08/2026

## Entidades vigentes

### `fiscal_profiles`

Perfiles fiscales reutilizables por cuenta (`user_id`). Los establecimientos seleccionan uno mediante `establecimientos.fiscal_profile_id`; los vendedores seleccionan uno al solicitar factura.

### `invoice_requests`

Solicitud del vendedor. Campos relevantes: `pedido_id`, `vendedor_id`, `fiscal_profile_id`, `fiscal_data_snapshot`, `estado` y fechas. El snapshot es la fuente esperada del receptor para validar el CFDI.

### `invoices`

Documento fiscal asociado a la solicitud. El flujo actualmente implementado crea un registro `tipo_emisor = establecimiento`.

Campos relevantes: `estado`, `uuid_fiscal`, `subtotal`, `total`, `fecha_emision`, `xml_path`, `pdf_path`, `error_mensaje`.

### `balance_movimientos`

Fuente financiera operativa vigente por pedido. Campos relevantes: `pedido_id`, `establecimiento_uuid`, `monto_bruto`, `comision_rate`, `iva_rate`, `comision_monto`, `iva_monto`, `neto_establecimiento`, `status`.

La línea nace `pending` al inicio económico del servicio. La validación de factura no la libera automáticamente.

### `coin_lotes` / `coin_movimientos`

Fuente de trazabilidad para determinar la Coin utilizada y su costo real. Los movimientos `uso` deben conservar `lote_id` y referencia al pedido para poder reconstruir el valor económico.

### `settlements`

Existe en base de datos, pero no es la fuente del flujo financiero actual y no debe utilizarse para nueva lógica sin una decisión arquitectónica explícita.

## Relaciones principales

```text
fiscal_profiles ──< invoice_requests ──< invoices
       │
       └── establecimientos.fiscal_profile_id

pedidos ── invoice_requests
   │
   └── balance_movimientos

coin_lotes ──< coin_movimientos ── pedido (referencia de uso)
```

## Invariante fiscal

Para aceptar una factura del establecimiento deben coincidir simultáneamente:

- emisor XML ↔ perfil fiscal del establecimiento;
- receptor XML ↔ snapshot de `invoice_requests`;
- total XML ↔ `balance_movimientos.monto_bruto`;
- estatus fiscal ↔ CFDI vigente ante SAT mediante PAC.
