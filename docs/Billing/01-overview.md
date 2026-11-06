# Billing - Overview

> Estado: V1 operativo / V2 en desarrollo en QA
>
> Última actualización: 15/10/2026

## 1. Objetivo

Billing administra el flujo económico y fiscal asociado a los servicios de Dropit, manteniéndolo separado del flujo logístico de Orders.

Sus responsabilidades incluyen:

- Reconocimiento económico de los servicios.
- Cálculo de comisiones Dropit.
- Registro de descuentos financiados por Dropit.
- Determinación de retenciones fiscales.
- Facturación del establecimiento al vendedor.
- Facturación de comisiones Dropit.
- Conciliación financiera.
- Solicitudes de retiro y liquidación.

El reconocimiento financiero del servicio ocurre cuando el establecimiento recibe físicamente el paquete.

La compra de Coins constituye un pago anticipado y no implica por sí misma que el servicio haya sido prestado.

## 2. Arquitectura financiera

`balance_movimientos` es la fuente financiera operativa vigente.

`settlements` permanece como estructura histórica y no participa en el flujo financiero actual.

Dropit mantiene dos versiones financieras:

- V1: modelo histórico.
- V2: modelo actualizado con separación fiscal y económica.

La versión financiera se identifica mediante:

- `coin_lotes.modelo_financiero_version`
- `balance_movimientos.modelo_financiero_version`

Los movimientos históricos conservan las condiciones bajo las cuales fueron generados.

No deben recalcularse automáticamente por modificaciones posteriores de precios, comisiones o reglas fiscales.

## 3. Modelo financiero V1

### Funcionamiento vigente

La recepción del paquete utiliza:

`recibir_pedido_con_balance`

Esta función:

1. Valida el pedido y el código del vendedor.
2. Confirma que el pedido está en tránsito.
3. Calcula el movimiento financiero.
4. Registra el balance del establecimiento.
5. Cambia el pedido a `pendiente_recoleccion`.
6. Genera o conserva el código de entrega.

La recepción y el movimiento financiero forman una operación atómica.

Si falla el registro financiero, la recepción no se confirma.

### Cálculo V1

Precios base:

| Tipo | Importe |
|---|---:|
| Small | $60.00 |
| Medium | $90.00 |

Comisión Dropit:

10%

IVA sobre comisión:

16%

El importe utilizado por la recepción se obtiene mediante
`getOrderServiceValue`, considerando la trazabilidad económica
de la Coin consumida.

En el modelo histórico, los descuentos comerciales pueden
reducir el valor reconocido al establecimiento.

Los movimientos nuevos V1 se generan con:

`status = available`

### Funciones históricas

Existe:

`fn_crear_balance_movimiento_por_pedido`

Esta función utiliza precios fijos de $60 y $90.

También existe:

`trg_pedido_entregado_balance`

La auditoría realizada en QA confirmó que actualmente no
existe un trigger activo asociado a esta función.

Ambas se conservan sin modificaciones durante la
implementación V2.

## 4. Modelo financiero V2

### Principio económico

Dropit actúa como intermediario entre el vendedor y el establecimiento.

El establecimiento presta el servicio de recepción,
custodia y entrega del paquete.

Dropit cobra una comisión por intermediación.

El establecimiento conserva el mismo valor nominal
del servicio independientemente de:

- Descuentos por volumen.
- Cupones comerciales.
- Promociones.
- Coins gratuitas otorgadas por administración.

Todos los descuentos comerciales son financiados por Dropit.

### Precios iniciales

| Concepto | Small | Medium |
|---|---:|---:|
| Servicio subtotal | $60.00 | $90.00 |
| IVA del servicio | $9.60 | $14.40 |
| Servicio total | $69.60 | $104.40 |
| Comisión Dropit | $6.00 | $9.00 |
| IVA de comisión | $0.96 | $1.44 |
| Neto antes de retenciones | $62.64 | $93.96 |

Los precios y porcentajes se obtendrán de `dropit_config`.

### Separación financiera

En V2:

`servicio_total = servicio_subtotal + servicio_iva`

`monto_bruto = servicio_total`

`vendedor_pago + descuento_dropit = servicio_total`

La comisión Dropit se calcula sobre el subtotal
del servicio, sin IVA.

El IVA del servicio y el IVA de la comisión
son conceptos independientes.

### Neto del establecimiento

El cálculo previsto es:

`neto_establecimiento = servicio_total - comision_monto - iva_monto - retencion_isr - retencion_iva`

Las retenciones se aplicarán conforme a las reglas
fiscales validadas.

El importe neto definitivo no será liquidable mientras
la determinación fiscal esté pendiente.

## 5. Determinación fiscal V2

El modelo V2 contempla tres estados:

- `pendiente`
- `determinado`
- `no_sujeto`

### Pendiente

El movimiento se registra con:

`status = pending`

`estado_determinacion_fiscal = pendiente`

El establecimiento puede recibir paquetes y acumular
movimientos financieros.

Sin embargo, esos movimientos no pueden retirarse.

### Determinado

Cuando se valida la situación fiscal:

1. Se identifican las reglas aplicables.
2. Se calculan las retenciones correspondientes.
3. Se registra el snapshot fiscal.
4. Se determina el neto definitivo.
5. El movimiento puede pasar a `available`.

### No sujeto

Se utiliza cuando existe una determinación fiscal
validada que establece que no corresponde aplicar
retenciones.

No debe utilizarse simplemente porque falte
información fiscal.

### Establecimientos sin RFC

Dropit contempla que personas físicas sin RFC
puedan registrarse y operar.

Esta condición debe identificarse expresamente
durante el onboarding.

La ausencia de RFC no constituye un régimen fiscal.

El motor financiero deberá estar preparado para
aplicar las retenciones que legalmente correspondan,
incluida la posible retención del 100% del IVA.

La aplicabilidad de estas reglas al modelo de
intermediación de Dropit requiere validación fiscal.

No se habilitarán liquidaciones V2 sin una
determinación fiscal válida.

## 6. Facturación al vendedor

El vendedor solicita factura desde Dropit y
selecciona un perfil fiscal.

La solicitud conserva un snapshot fiscal del receptor.

Actualmente se genera un registro en `invoices`
con:

`tipo_emisor = establecimiento`

El establecimiento es responsable de emitir
externamente el CFDI y cargar XML y PDF en Dropit.

### Validaciones

Dropit valida:

1. Estructura del XML.
2. RFC del emisor contra el perfil fiscal del establecimiento.
3. RFC del receptor contra el snapshot de la solicitud.
4. Importe del CFDI contra el valor correspondiente del servicio.
5. Vigencia fiscal mediante PAC/SAT.

Una validación satisfactoria deja:

`invoices.estado = emitida`

### Separación V1 / V2

En V1 se conserva la validación vigente del total
contra `balance_movimientos.monto_bruto`.

En V2, el importe nominal del servicio se registra en:

`balance_movimientos.servicio_total`

El tratamiento de descuentos financiados por Dropit
en el CFDI del establecimiento requiere validación fiscal
antes de activar la facturación V2.

## 7. Factura de comisión Dropit

Dropit factura al establecimiento por su
servicio de intermediación.

El modelo acordado contempla una factura
consolidada mensual por establecimiento.

Actualmente no se emite automáticamente
un CFDI de comisión por cada pedido.

### Base económica V2

La comisión se calcula sobre el subtotal
del servicio, sin IVA.

La factura de Dropit distingue:

- Subtotal de comisión.
- IVA de comisión.
- Total de comisión.

El importe correspondiente se relaciona con:

`comision_monto + iva_monto`

El momento de emisión, tratamiento fiscal y
consolidación definitiva requieren validación
con el especialista fiscal.

## 8. Conciliación y liquidación

El cierre mensual habilita la solicitud de retiro
de los movimientos elegibles.

La zona horaria oficial es:

`America/Mexico_City`

El establecimiento puede seleccionar movimientos
individuales de meses cerrados.

También puede combinar movimientos de varios
establecimientos pertenecientes a su cuenta.

El saldo ganado no expira.

### Modelo V1

Conserva las reglas de retiro vigentes.

### Modelo V2

Un movimiento solo podrá retirarse cuando:

- Corresponda a un mes cerrado.
- Pertenezca al titular.
- Tenga `status = available`.
- Su determinación fiscal esté resuelta.
- Su importe neto definitivo esté calculado.
- No forme parte de otro retiro activo.

La elegibilidad fiscal deberá comprobarse:

1. Al solicitar el retiro.
2. Al aprobarlo.
3. Antes de marcarlo como pagado.

Estas protecciones V2 están pendientes de implementación.

## 9. Relación entre CFDI y liquidación

La validación fiscal y el estado financiero
son controles separados.

Un CFDI válido no cambia automáticamente
`balance_movimientos.status`.

Cuando el vendedor solicita factura, el modelo
documental establece que el establecimiento debe
proporcionar un CFDI válido para liquidar la operación.

Si no lo entrega dentro del plazo definido,
la operación deberá sujetarse a las reglas de
bloqueo, compensación o reembolso correspondientes.

La aplicación técnica completa de esta regla
en el flujo de retiros requiere verificación.

No debe considerarse implementada únicamente
por encontrarse documentada.

## 10. Seguridad financiera

Las funciones principales son:

- `recibir_pedido_con_balance`
- `crear_retiro_desde_movimientos`
- `actualizar_retiro_admin`

La auditoría de V2 identificó dos funciones heredadas:

`fn_marcar_balance_pagado`

Ambas permitían ejecución desde los roles
`anon` y `authenticated`.

En QA se retiraron esos permisos y se verificó que:

- `anon`: sin ejecución.
- `authenticated`: sin ejecución.
- `service_role`: conserva ejecución.

La revisión correspondiente en Producción
permanece pendiente.

## 11. Estado de implementación

### V1

El flujo de recepción y creación de balance
fue validado en QA y Producción el 18/09/2026.

El modelo base de retiros fue migrado y validado
en Producción el 08/09/2026.

La extensión bancaria fue validada en QA el
18/09/2026 y permanece pendiente de migración
y validación en Producción.

### V2 — Implementado en QA

- Versionado financiero de Coins.
- Versionado financiero de balances.
- Columnas de desglose económico.
- Campos de retenciones.
- Estado de determinación fiscal.
- Configuración inicial de precios.
- Restricción de consumo único por pedido.
- Restricción de permisos de funciones heredadas.

### V2 — Pendiente

- Adaptación de `recibir_pedido_con_balance`.
- Generación de Coins V2.
- Actualización del proceso de compra.
- Cálculo de descuentos financiados por Dropit.
- Motor de determinación fiscal.
- Protección fiscal de solicitudes de retiro.
- Protección fiscal de aprobación y pago.
- Conciliación de retenciones.
- Adaptación de facturación V2.
- Validación fiscal definitiva.
- Pruebas integrales.
- Despliegue controlado a Producción.

El modelo V2 no debe activarse hasta completar
las protecciones financieras y fiscales necesarias.