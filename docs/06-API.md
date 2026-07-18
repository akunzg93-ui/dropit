# APIs Oficiales de Dropit

> Documento Oficial  
> Versión: 1.1  
> Estado: Oficial  
> Última actualización: 18/07/2026

---

# Principios

- Las APIs implementan reglas de negocio.
- Nunca confían únicamente en datos enviados por el cliente web.
- Las operaciones críticas validan estado, actor y códigos.
- Los jobs automáticos se protegen con `CRON_SECRET`.
- Las rutas estables permanecen bajo `app/api/orders/*` hasta un refactor planificado.

---

# Flujo principal

| Ruta | Responsabilidad |
|---|---|
| `POST /api/orders/aceptar-establecimiento` | Aceptar el punto y pasar a `en_transito` |
| `POST /api/orders/rechazar-establecimiento` | Rechazar la solicitud |
| `POST /api/orders/recibido` | Confirmar recepción física |
| `POST /api/orders/entregado` | Confirmar entrega al cliente |
| `POST /api/orders/notificar-vendedor` | Enviar código e instrucciones al vendedor |

Las rutas históricas estables no se mueven sólo por organización.

---

# Cancelaciones

## Cancelación automática

Ruta vigente documentada:

`GET /api/orders/cancelaciones/automaticas`

Responsabilidades:

- Validar `CRON_SECRET`.
- Buscar pedidos `en_transito` vencidos según `establecimiento_aceptado_at`.
- Ejecutar `cancel_order_automatic`.
- Liberar capacidad y reintegrar Coin mediante la RPC.
- Enviar correos al cliente y al vendedor.
- Devolver resumen de ejecución.

## Cancelación por vendedor

La API correspondiente ejecuta `cancel_order_by_vendor` y sólo permite estados autorizados.

---

# Devoluciones automáticas

## Inicio de devolución

`GET /api/orders/jobs/iniciar-devoluciones`

- Protegido con `CRON_SECRET`.
- Busca pedidos `pendiente_recoleccion` vencidos desde `recibido_en`.
- Ejecuta `start_order_return`.
- Registra el cambio a `devolucion_pendiente`.
- Envía notificaciones al cliente y al vendedor.

## Custodia vencida

`GET /api/orders/jobs/custodia-vencida`

- Protegido con `CRON_SECRET`.
- Busca devoluciones vencidas desde `devolucion_iniciada_at`.
- Ejecuta `expire_order_return_custody`.
- Cambia el estado a `custodia_vencida`.
- Notifica al vendedor.

## Devolución física al vendedor

La acción del establecimiento ejecuta `complete_order_return` después de validar el código de devolución.

---

# Tracking público

El frontend consulta `get_pedido_tracking` mediante Supabase RPC.

La respuesta incluye eventos y timestamps de los tres plazos. La RPC no expone información sensible innecesaria.

---

# Contrato de jobs

Todos los jobs deben:

1. Validar secreto.
2. Seleccionar sólo candidatos válidos.
3. Delegar la transición a una RPC idempotente.
4. Registrar resultado por pedido.
5. Enviar correos únicamente después de una transición exitosa.
6. Responder con resumen de revisados, actualizados y errores.
