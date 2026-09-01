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
