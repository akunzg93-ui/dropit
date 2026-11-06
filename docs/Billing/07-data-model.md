# Billing - Data Model

> Última actualización: 15/10/2026

## Entidades vigentes

### `fiscal_profiles`

Perfiles fiscales reutilizables por cuenta (`user_id`).

Los establecimientos seleccionan uno mediante
`establecimientos.fiscal_profile_id`; los vendedores seleccionan
uno al solicitar factura.

En el modelo financiero V2 se contempla la incorporación de
establecimientos que operan como personas físicas sin RFC.

La ausencia de RFC no constituye un régimen fiscal.

La determinación de las retenciones aplicables dependerá de
las reglas fiscales validadas para Dropit.

### `invoice_requests`

Solicitud del vendedor.

Campos relevantes:

- `pedido_id`
- `vendedor_id`
- `fiscal_profile_id`
- `fiscal_data_snapshot`
- `estado`
- Fechas de solicitud y procesamiento.

El snapshot es la fuente esperada del receptor para validar el CFDI.

### `invoices`

Documento fiscal asociado a la solicitud.

El flujo actualmente implementado crea un registro
`tipo_emisor = establecimiento`.

Campos relevantes:

- `estado`
- `uuid_fiscal`
- `subtotal`
- `total`
- `fecha_emision`
- `xml_path`
- `pdf_path`
- `error_mensaje`

## Modelo financiero V1 / V2

Dropit mantiene dos versiones financieras para preservar
la compatibilidad histórica.

### V1 — Modelo histórico

El modelo V1 conserva las reglas existentes.

- Precios Small: $60.00.
- Precios Medium: $90.00.
- Comisión Dropit: 10%.
- IVA sobre comisión: 16%.
- Los descuentos pueden reducir el importe reconocido.
- Los movimientos financieros conservan su comportamiento original.

Los pedidos y Coins históricos no deben recalcularse
automáticamente bajo las reglas V2.

### V2 — Modelo financiero actualizado

El modelo V2 separa:

1. Valor nominal del servicio.
2. IVA del servicio.
3. Pago realizado por el vendedor.
4. Descuento financiado por Dropit.
5. Comisión de Dropit.
6. IVA de la comisión.
7. Retenciones fiscales aplicables.
8. Saldo del establecimiento.

El establecimiento conserva el mismo valor nominal del
servicio independientemente de los descuentos otorgados
al vendedor.

Los descuentos comerciales y las Coins gratuitas
son financiados por Dropit.

### Precios iniciales V2

| Concepto | Small | Medium |
|---|---:|---:|
| Servicio subtotal | $60.00 | $90.00 |
| IVA servicio (16%) | $9.60 | $14.40 |
| Servicio total | $69.60 | $104.40 |
| Comisión Dropit (10%) | $6.00 | $9.00 |
| IVA comisión (16%) | $0.96 | $1.44 |
| Saldo antes de retenciones | $62.64 | $93.96 |

Estos valores corresponden a la configuración inicial V2.

## `balance_movimientos`

Fuente financiera operativa vigente por pedido.

### Campos compartidos

- `pedido_id`
- `establecimiento_id`
- `monto_bruto`
- `comision_rate`
- `iva_rate`
- `comision_monto`
- `iva_monto`
- `neto_establecimiento`
- `status`

### Versionado financiero

`modelo_financiero_version`

Valores:

- `1`: modelo histórico.
- `2`: modelo financiero actualizado.

El valor predeterminado es `1` mientras no se active V2.

### Campos financieros V2

| Campo | Significado |
|---|---|
| `servicio_subtotal` | Valor del servicio sin IVA |
| `servicio_iva` | IVA correspondiente al servicio |
| `servicio_total` | Subtotal más IVA del servicio |
| `monto_bruto` | Total nominal del servicio con IVA |
| `descuento_dropit` | Descuento comercial financiado por Dropit |
| `vendedor_pago` | Importe atribuido al pago del vendedor |
| `comision_monto` | Comisión Dropit sobre subtotal sin IVA |
| `iva_monto` | IVA correspondiente a la comisión Dropit |
| `retencion_isr` | ISR retenido, cuando corresponda |
| `retencion_iva` | IVA retenido, cuando corresponda |
| `neto_establecimiento` | Saldo después de comisión, IVA de comisión y retenciones |
| `fiscal_snapshot` | Información utilizada para determinar el tratamiento fiscal |

En V2:

`monto_bruto = servicio_total`

`servicio_total = servicio_subtotal + servicio_iva`

`vendedor_pago + descuento_dropit = servicio_total`

El IVA del servicio y el IVA de la comisión son conceptos
independientes.

### Determinación fiscal V2

Campo:

`estado_determinacion_fiscal`

Valores permitidos:

- `determinado`
- `pendiente`
- `no_sujeto`

La determinación fiscal deberá considerar el tipo de
contribuyente, la información disponible y las reglas
fiscales aplicables.

Se contempla el caso de personas físicas sin RFC,
incluida la posible retención del 100% del IVA cuando
legalmente corresponda.

La aplicabilidad y las tasas definitivas requieren
validación fiscal antes de habilitar liquidaciones V2.

### Estados financieros

Valores permitidos:

- `pending`
- `available`
- `paid`
- `reversed`

#### V1

Conserva el comportamiento financiero existente.

Los movimientos nuevos creados por la función V1
nacen `available`.

#### V2

Los movimientos con determinación fiscal pendiente
deben registrarse:

- `status = pending`
- `estado_determinacion_fiscal = pendiente`

No pueden incluirse en solicitudes de retiro.

Una vez determinada la situación fiscal y calculado
el importe neto definitivo, podrán pasar a `available`.

Los movimientos V2 únicamente podrán liquidarse
cuando su determinación fiscal esté resuelta.

Esta regla debe validarse tanto al solicitar el retiro
como al aprobarlo y pagarlo.

La validación de una factura no modifica por sí sola
el estado financiero.

## `coin_lotes` / `coin_movimientos`

Fuente de trazabilidad para determinar la Coin utilizada.

Los movimientos `uso` deben conservar:

- `lote_id`
- Referencia al pedido.
- Tipo de Coin.
- Cantidad consumida.

### Versionado

`coin_lotes.modelo_financiero_version`

Valores:

- `1`: V1.
- `2`: V2.

Las Coins históricas conservan su versión original.

La versión financiera del pedido se determina
mediante el lote de la Coin consumida.

### Coins gratuitas

Las Coins otorgadas desde administración se identifican
actualmente mediante:

- `precio_unitario = 0`
- `descuento_porcentaje = 100`
- `pago_id = NULL`

En V2, estas Coins generan el valor nominal completo
del servicio para el establecimiento.

Dropit financia el 100% del importe correspondiente.

La comisión Dropit y su IVA se calculan normalmente.

## `dropit_config`

Tabla de configuración mediante pares clave-valor.

En QA se incorporaron las siguientes claves V2:

| Clave | Valor inicial |
|---|---:|
| `servicio_small_subtotal_v2` | 60.00 |
| `servicio_medium_subtotal_v2` | 90.00 |
| `servicio_iva_porcentaje_v2` | 16 |
| `comision_dropit_porcentaje_v2` | 10 |

Estas configuraciones constituyen la fuente prevista
de precios y porcentajes del modelo V2.

Los importes calculados deberán almacenarse en
`balance_movimientos` al momento de la recepción.

Esto permitirá conservar el historial financiero
aunque posteriormente cambien las configuraciones.

## `settlements`

Existe en base de datos, pero no es la fuente del
flujo financiero actual.

No debe utilizarse para nueva lógica sin una
decisión arquitectónica explícita.

## Relaciones principales

```text
fiscal_profiles ──< invoice_requests ──< invoices
       │
       └── establecimientos.fiscal_profile_id

pedidos ── invoice_requests
   │
   └── balance_movimientos

coin_lotes ──< coin_movimientos ── pedido
                    (referencia de uso)

dropit_config
   │
   └── Configuración financiera V2
```

## Invariante fiscal

Para aceptar una factura del establecimiento deben
coincidir simultáneamente:

- Emisor XML ↔ perfil fiscal del establecimiento.
- Receptor XML ↔ snapshot de `invoice_requests`.
- Total XML ↔ valor nominal del servicio correspondiente.
- Estatus fiscal ↔ CFDI vigente ante SAT mediante PAC.

### Consideraciones V1 / V2

En V1 se conserva la validación vigente del total
contra `balance_movimientos.monto_bruto`.

En V2 deben distinguirse dos operaciones:

**Factura del establecimiento al vendedor**

Corresponde al servicio prestado.

Su total debe coincidir con:

`balance_movimientos.servicio_total`

**Factura de Dropit al establecimiento**

Corresponde a la comisión de intermediación.

Su total debe coincidir con:

`comision_monto + iva_monto`

Las retenciones fiscales deberán registrarse
separadamente y aplicarse conforme a las reglas
fiscales validadas.

## Estado de implementación

### Implementado en QA

- Versionado financiero en `coin_lotes`.
- Versionado financiero en `balance_movimientos`.
- Campos de desglose financiero V2.
- Campos de retenciones fiscales.
- Estado de determinación fiscal.
- Configuración inicial de precios V2.
- Índice único de consumo de Coins por pedido.

### Pendiente de implementación

- Cálculo V2 en `recibir_pedido_con_balance`.
- Generación de nuevos lotes con versión V2.
- Aplicación del IVA del servicio en la compra de Coins.
- Protección fiscal en solicitudes de retiro.
- Protección fiscal en aprobación y pago.
- Determinación fiscal automatizada.
- Validación fiscal definitiva de retenciones.
- Adaptación de los procesos de facturación a V2.
- Pruebas integrales y despliegue a producción.