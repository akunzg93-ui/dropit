# Billing - Conciliación y retiros

> Última actualización: 20/10/2026

## 1. Modelo financiero vigente

`balance_movimientos` es la fuente financiera operativa de Dropit.

`settlements` permanece como estructura histórica y no se utiliza para nueva lógica sin una decisión arquitectónica explícita.

La creación del movimiento financiero y la transición del pedido a `pendiente_recoleccion` son atómicas mediante `recibir_pedido_con_balance`.

Si el movimiento financiero no puede crearse, la recepción hace rollback.

La recepción atómica fue validada end-to-end en QA y Producción el 18/09/2026.

### Modelo V1 — Vigente

El movimiento financiero se genera cuando el establecimiento recibe el paquete.

Se registra:

- Valor económico del servicio.
- Comisión Dropit del 10%.
- IVA del 16% sobre la comisión.
- Neto del establecimiento.

El movimiento se crea con:

`status = available`

La validación fiscal y la disponibilidad económica permanecen desacopladas.

El modelo V1 conserva sus reglas actuales para evitar modificaciones retroactivas en pedidos y Coins históricos.

### Modelo V2 — En desarrollo

El modelo financiero V2 separa:

1. Subtotal del servicio.
2. IVA del servicio.
3. Total nominal del servicio.
4. Pago del vendedor.
5. Descuento financiado por Dropit.
6. Comisión de intermediación.
7. IVA sobre comisión.
8. Retenciones fiscales.
9. Neto del establecimiento.

El establecimiento conserva el mismo valor nominal del servicio independientemente de los descuentos comerciales o Coins gratuitas otorgadas al vendedor.

Dropit financia íntegramente los descuentos.

## 2. Cálculo financiero V2

### Precios iniciales

| Concepto | Small | Medium |
|---|---:|---:|
| Subtotal del servicio | $60.00 | $90.00 |
| IVA del servicio | $9.60 | $14.40 |
| Total del servicio | $69.60 | $104.40 |
| Comisión Dropit (10%) | $6.00 | $9.00 |
| IVA sobre comisión | $0.96 | $1.44 |
| Neto antes de retenciones | $62.64 | $93.96 |

Los precios y porcentajes V2 se obtendrán de `dropit_config`.

### Separación de conceptos

En V2:

`monto_bruto = servicio_total`

`servicio_total = servicio_subtotal + servicio_iva`

`vendedor_pago + descuento_dropit = servicio_total`

La comisión Dropit se calcula sobre el subtotal del servicio, sin IVA.

El IVA del servicio y el IVA de la comisión son conceptos independientes.

### Neto del establecimiento

El cálculo previsto es:

`neto_establecimiento = servicio_total - comision_monto - iva_monto - retencion_isr - retencion_iva`

Las retenciones se aplicarán únicamente conforme a reglas fiscales previamente validadas.

Los movimientos pendientes de determinación fiscal no tendrán un neto definitivo liquidable.

### Descuentos y Coins gratuitas

Los descuentos comerciales son financiados por Dropit.

Ejemplo Small con descuento del 10%:

| Concepto | Importe |
|---|---:|
| Servicio nominal | $69.60 |
| Pago del vendedor | $62.64 |
| Descuento Dropit | $6.96 |
| Comisión Dropit | $6.00 |
| IVA comisión | $0.96 |
| Neto antes de retenciones | $62.64 |

En una Coin gratuita:

- El vendedor paga $0.
- Dropit financia el 100% del servicio.
- El establecimiento conserva el valor nominal.
- Se calcula normalmente la comisión y su IVA.

El subsidio comercial no constituye una retención fiscal.

El importe del subsidio deberá registrarse separadamente para permitir la conciliación económica de Dropit.

## 3. Determinación fiscal V2

Los movimientos V2 incorporan:

`estado_determinacion_fiscal`

Valores:

- `pendiente`
- `determinado`
- `no_sujeto`

### Determinación pendiente

Cuando todavía no existen datos suficientes o reglas fiscales validadas:

- `status = pending`
- `estado_determinacion_fiscal = pendiente`

El establecimiento puede recibir paquetes y acumular movimientos financieros.

Sin embargo, esos movimientos no son elegibles para retiro.

### Determinación resuelta

Cuando se determina el tratamiento fiscal:

1. Se identifica la situación fiscal del establecimiento.
2. Se calculan las retenciones aplicables.
3. Se registra el snapshot fiscal.
4. Se calcula el neto definitivo.
5. El movimiento puede pasar a `available`.

Los movimientos `no_sujeto` también requieren una determinación fiscal validada que justifique la ausencia de retenciones.

### Establecimientos sin RFC

Dropit contempla la incorporación de personas físicas sin RFC.

Esta situación debe identificarse expresamente durante el onboarding.

La ausencia de RFC no constituye un régimen fiscal.

El sistema deberá estar preparado para aplicar las retenciones correspondientes, incluida la posible retención del 100% del IVA cuando legalmente proceda.

La posibilidad de liquidar a estos establecimientos dependerá de la validación fiscal del modelo de intermediación de Dropit.

No se aplicarán tasas de retención automáticas sin validación fiscal.

## 4. Elegibilidad de retiro: V1 vigente y V2 semanal objetivo

**V1 (vigente):** el cierre del mes habilita el derecho a solicitar retiro de los movimientos elegibles. Esta regla no se modifica.

**V2 (decisión funcional; todavía no implementada en retiros):** corte de lunes a domingo y habilitación de solicitudes el lunes siguiente, usando `America/Mexico_City`. Una factura requerida y pendiente o no validada bloquea solamente los movimientos relacionados, no el resto del saldo. Si el CFDI se valida después del corte, el movimiento espera al siguiente lunes. Los movimientos elegibles no expiran. No confundir fecha de corte con fecha efectiva de transferencia.

La zona horaria oficial es:

`America/Mexico_City`

El establecimiento no está obligado a retirar el mes completo.

Puede:

- Elegir servicios individuales.
- Combinar meses cerrados.
- Combinar varios establecimientos de su cuenta en una sola solicitud.

El saldo ganado no expira.

Los movimientos del mes corriente se muestran como generación del próximo cierre, pero no son elegibles todavía.

### Elegibilidad V1

Conserva las reglas vigentes.

### Elegibilidad V2 (objetivo, aún no integrada al retiro)

Para solicitar un retiro, el movimiento debe cumplir simultáneamente:

1. Pertenecer al titular.
2. Haber alcanzado un corte semanal habilitado (lunes posterior al periodo lunes-domingo, hora de México).
3. Tener `status = available`.
4. Tener determinación fiscal resuelta.
5. Contener el neto definitivo calculado.
6. No formar parte de otro retiro activo.
7. Si el vendedor solicitó factura del servicio, contar con CFDI del establecimiento validado; de lo contrario, el movimiento sigue bloqueado para retiro. La ausencia de solicitud no elimina por sí sola las obligaciones fiscales de emisión.

**Estado real de QA:** `crear_retiro_desde_movimientos` sigue verificando mes cerrado y todavía no implementa la elegibilidad semanal ni el bloqueo documental. No afirmar que el flujo semanal está operativo.

Un movimiento V2 con determinación pendiente no puede retirarse, aunque corresponda a un mes cerrado.

## 5. Construcción de la solicitud

El establecimiento selecciona movimientos de `balance_movimientos`; no captura manualmente un monto.

El backend valida la propiedad y elegibilidad y calcula el total.

Antes de crear la solicitud exige que el titular tenga una cuenta bancaria registrada.

### Estructuras

- `retiros`: cabecera global de la solicitud.
- `retiro_aplicaciones`: movimientos exactos seleccionados y `monto_aplicado` como snapshot.
- `retiro_detalles`: subtotal por establecimiento.
- `titular_datos_bancarios`: cuenta única editable del titular.
- `retiros.titular_cuenta_destino`: snapshot del titular.
- `retiros.clabe_destino`: snapshot de la CLABE.
- `retiros.banco_destino`: snapshot del banco.

Editar la cuenta bancaria después de solicitar un retiro solamente afecta solicitudes futuras.

### Protección contra duplicados

Un movimiento incluido en un retiro `pending` o `approved` no puede formar parte de otra solicitud activa.

Un retiro `reversed` conserva su historial.

Los movimientos vuelven a ser elegibles porque ya no están asociados a una solicitud activa.

El rechazo no necesita modificar el estado del ledger.

## 6. Administración y pago

Estados permitidos:

`pending → approved → paid`

`pending → reversed`

Al pagar, únicamente se marcan `paid` los movimientos incluidos en `retiro_aplicaciones`.

No se utiliza FIFO.

No se permiten pagos parciales de un movimiento.

No se generan líneas de sobrante.

El administrador utiliza el snapshot bancario del retiro para realizar la transferencia.

Debe registrar una referencia de pago no vacía.

### Protección adicional V2

La elegibilidad fiscal debe verificarse:

1. Al solicitar el retiro.
2. Al aprobar el retiro.
3. Antes de marcarlo como pagado.

No debe aprobarse ni pagarse un retiro que contenga movimientos V2 pendientes de determinación fiscal.

El importe aplicado debe corresponder al neto definitivo después de las retenciones.

Estas protecciones están pendientes de implementación.

## 7. Regla documental y fiscal

La validación de CFDI es un control separado del estado financiero.

Un CFDI válido no modifica automáticamente `balance_movimientos.status`.

### Factura del establecimiento

Corresponde al servicio prestado al vendedor.

En V2, su importe nominal se relaciona con:

`balance_movimientos.servicio_total`

### Factura de Dropit

Corresponde a la comisión de intermediación cobrada al establecimiento.

Su importe se relaciona con:

`comision_monto + iva_monto`

Las retenciones fiscales se registran y concilian por separado.

Las reglas definitivas de CFDI, retenciones y obligaciones ante SAT requieren validación fiscal.

## 8. Seguridad financiera

### Funciones principales

- `determinar_fiscalmente_movimiento_v2`: determina retenciones y snapshot; deja `status = pending` (QA).
- `liberar_movimiento_financiero_v2`: libera V2 determinado o `no_sujeto` justificado, sin cambiar importes (QA, probado).
- `recibir_pedido_con_balance`: recepción y creación del movimiento.
- `crear_retiro_desde_movimientos`: solicitud de retiro.
- `actualizar_retiro_admin`: aprobación, rechazo y pago.

### Funciones heredadas

Existen dos versiones de:

`fn_marcar_balance_pagado`

Estas funciones permiten marcar movimientos como pagados sin utilizar el flujo completo de retiros.

Durante la auditoría de V2 se identificó que ambas permitían ejecución desde los roles `anon` y `authenticated`.

Se retiraron esos permisos en QA.

Estado verificado:

| Rol | Ejecución |
|---|---|
| `anon` | No |
| `authenticated` | No |
| `service_role` | Sí |

No se encontraron referencias a estas funciones en el código Next.js revisado ni llamadas desde otras funciones PostgreSQL.

La revisión y corrección correspondiente en Producción permanece pendiente.

### Generación histórica de balances

`fn_crear_balance_movimiento_por_pedido` utiliza precios y cálculos V1.

La función `trg_pedido_entregado_balance` puede invocarla cuando un pedido cambia a entregado.

Sin embargo, la auditoría confirmó que no existe un trigger activo asociado a esa función en QA.

Ambas se conservan sin modificaciones durante la implementación V2.

## 9. Estado técnico y despliegue

### Modelo V1

El flujo funcional y el endurecimiento transaccional fueron validados en QA.

`crear_retiro_desde_movimientos` bloquea los movimientos seleccionados y crea cabecera, aplicaciones y detalles atómicamente.

`actualizar_retiro_admin` bloquea el retiro y los movimientos aplicados para ejecutar aprobación, rechazo o pago sin estados parciales.

Se validaron:

- Solicitud de retiro.
- Prevención de doble solicitud activa.
- Rechazo y liberación.
- Aprobación.
- Pago exacto.
- Sincronización entre retiros, aplicaciones y movimientos.

El modelo base de retiros fue migrado y validado en Producción el 08/09/2026 mediante una prueba controlada con ROLLBACK.

### Extensión bancaria

El 18/09/2026 se validó en QA:

- Registro y edición de cuenta bancaria con consentimiento.
- Bloqueo de retiro sin cuenta.
- Snapshot bancario.
- Solicitud multi-establecimiento.
- Aprobación.
- Pago con referencia.
- Sincronización de movimientos asociados.

Esta extensión permanece pendiente de migración y validación en Producción.

### Modelo V2

Implementado y verificado en QA (según pruebas realizadas al 20/10/2026):

- Columnas financieras V2.
- Versionado de balances y Coins.
- Estados de determinación fiscal.
- Configuración inicial de precios.
- Restricción de consumo único por pedido.
- Restricción de ejecución pública sobre las funciones heredadas de marcado de pago.
- Determinación fiscal por movimiento con snapshot e importes de retención.
- Protección de inmutabilidad fiscal V2 mediante trigger.
- Función `liberar_movimiento_financiero_v2(bigint)`, `SECURITY DEFINER`, `search_path = ''`, EXECUTE solo `service_role`.
- Pruebas transaccionales con `ROLLBACK`: rechazo V1, rechazo V2 pendiente fiscal, liberación determinada, rechazo de doble liberación, integridad de importes/snapshot y liberación `no_sujeto` con justificación.

La función de liberación cambia únicamente `status` y `updated_at`; `available` no equivale a retiro elegible. La integración backend y las pruebas end-to-end siguen pendientes.

Pendiente:

- Verificación end-to-end de `recibir_pedido_con_balance` y su integración backend V2.
- Generación de nuevas Coins V2.
- Cálculo y registro de subsidios.
- Integración automática de determinación y liberación V2 en el flujo operativo.
- Adaptación V2 de retiros a corte semanal y validación documental por movimiento, conservando la ruta V1 mensual.
- Protección V2 en aprobación y pago.
- Conciliación mensual de retenciones para su declaración/entero al SAT y liquidación semanal por establecimiento.
- CFDI semanal consolidado de comisiones Dropit por establecimiento, sujeto a revisión del contador sobre su emisión y momento fiscal.
- Política de tres facturas vencidas no regularizadas: suspensión operativa y reingreso mediante soporte (pendiente de diseño e implementación).
- Validación fiscal definitiva.
- Pruebas integrales.
- Despliegue controlado a Producción.

El modelo V2 no debe activarse hasta completar estas protecciones.