# Supabase

> Documento Oficial  
> Versión: 1.1  
> Estado: En construcción  
> Última actualización: 31/08/2026

# Responsabilidad

Supabase centraliza Auth, PostgreSQL, RLS, RPC y persistencia operativa.

# RPC relevantes

## Coins y cancelaciones

- `consume_coin_for_order`
- `restore_coin_for_cancelation`
- `cancel_order_by_vendor`
- `cancel_order_automatic`
- `expirar_coins_vencidas`

## Devoluciones

- `start_order_return`
- `complete_order_return`
- `expire_order_return_custody`

## Tracking

- `get_pedido_tracking(text)`

La RPC de tracking devuelve datos públicos controlados, timestamps de plazos y eventos en JSON ordenados por fecha.

# Jobs PostgreSQL

`pg_cron` está habilitado en QA y Producción para tareas periódicas de base de datos.

Job activo de Coins:

- Nombre: `expirar-coins-vencidas`
- Schedule: `10 0 * * *`
- Ejecución: `select public.expirar_coins_vencidas();`
- Frecuencia: diaria, `00:10 UTC`

La función registra la expiración en `coin_movimientos` antes de llevar `coin_lotes.cantidad_disponible` a `0`.

# Seguridad

- RLS permanece activa.
- Operaciones críticas se ejecutan por API con Service Role o RPC controlada.
- `get_pedido_tracking` puede ser ejecutada por `anon` y `authenticated`, pero no expone datos sensibles innecesarios.
- QA y Producción mantienen proyectos y variables independientes.

# Migraciones

Todo cambio estructural debe documentarse y versionarse. No se reorganizan nombres técnicos estables únicamente por limpieza.


## Billing V2 — liberación financiera (QA, 20/10/2026)

La RPC `public.liberar_movimiento_financiero_v2(p_movimiento_id bigint) RETURNS jsonb` se creó y probó en **QA**. No consta despliegue a Producción ni integración backend.

- `SECURITY DEFINER`, `SET search_path = ''`; objetos SQL referenciados con esquema explícito.
- EXECUTE revocado a `PUBLIC`, `anon`, `authenticated`; concedido a `service_role`. Las rutas backend deben autenticar y autorizar antes de usar service role.
- Bloquea la fila `balance_movimientos` con `FOR UPDATE`.
- Exige V2, `status = pending`, determinación `determinado` o `no_sujeto`, moneda MXN, campos monetarios necesarios, `monto_bruto = servicio_total` y neto positivo.
- Para `determinado`: exige snapshot JSON objeto con IDs, versión, neto, retenciones y regla fiscal; comprueba coincidencia del neto y retenciones con el movimiento.
- Para `no_sujeto`: exige ISR/IVA retenidos igual a cero y `fiscal_snapshot.motivo_no_sujeto` no vacío, versión 2 e ID del movimiento. No implica exención fiscal general.
- Actualiza **solo** `status = available` y `updated_at`. Devuelve `ok`, IDs, estados anterior/actual y neto. No evalúa fecha de corte ni CFDI.
- Errores esperados incluyen `MOVIMIENTO_NO_ES_V2`, `MOVIMIENTO_STATUS_INVALIDO`, `DETERMINACION_FISCAL_INCOMPLETA`, `SNAPSHOT_FISCAL_INVALIDO`, `SNAPSHOT_FISCAL_NO_COINCIDE`, `JUSTIFICACION_NO_SUJETO_REQUERIDA`.
- Se probaron en transacciones revertidas: rechazo V1, rechazo fiscal pendiente, liberación determinada (ejemplo neto $56.34), segunda liberación rechazada, inmutabilidad de importes y snapshot, y liberación `no_sujeto`. **No hay movimientos V2 persistidos en QA al momento de estas pruebas**.
- Dependencia: `proteger_balance_fiscal_v2()` impide modificar datos fiscales determinados. Las rutas de retiro aún usan reglas mensuales; no suponer que `available` autoriza el retiro.

### Reglas fiscales parametrizadas

`fiscal_reglas_v2` conserva tasas, versión y vigencia; la determinación almacena snapshot para evitar recalcular periodos históricos cuando cambien porcentajes en 2027. Configuración QA 2026 utilizada en pruebas: ISR 2.5% sobre subtotal sin IVA e IVA retenido equivalente al 50% del IVA del servicio, para las reglas actualmente registradas. Los porcentajes de 2027 están pendientes de indicación del contador; crear nuevas reglas por vigencia, no sobrescribir históricas.
