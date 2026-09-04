# Módulo Establecimiento

> Documento Oficial  
> Versión: 1.1  
> Estado: En construcción  
> Última actualización: 18/07/2026

# Objetivo

El establecimiento representa el nodo físico de la red Dropit. Aprueba solicitudes, recibe, resguarda temporalmente y entrega paquetes al cliente o de regreso al vendedor.

# Pantallas principales

| Ruta | Responsabilidad |
|---|---|
| `/establecimiento/aprobar/[id]` | Aceptar o rechazar pedido |
| `/establecimiento/recibir-pedido` | Recibir del vendedor |
| `/establecimiento/entregar` | Entregar al cliente o devolver al vendedor |
| `/establecimiento/estado` | Consultar pedidos por estado |
| `/establecimiento/balance` | Consultar saldo |

# Aprobación

Al aceptar:

- el pedido pasa a `en_transito`;
- se registra `establecimiento_aceptado_at`;
- comienza el plazo de 24 horas del vendedor;
- se genera o conserva el código del vendedor;
- se notifica al vendedor.

# Recepción del vendedor

Valida folio y `codigo_vendedor`.

Resultado:

- estado `pendiente_recoleccion`;
- timestamp `recibido_en`;
- código de entrega al cliente;
- evento y notificación;
- inicio de custodia por 48 horas.

# Entrega al cliente

Valida el código de entrega y cierra el pedido en `entregado`.

# Devolución al vendedor

La misma pantalla de entrega permite el modo de devolución cuando el pedido está en `devolucion_pendiente`.

Debe:

1. Validar folio y código de devolución.
2. Confirmar que el pedido corresponde al establecimiento.
3. Entregar físicamente al vendedor.
4. Ejecutar `complete_order_return`.
5. Registrar `devuelto_at` y el evento `devuelto`.

# Custodia vencida

Si pasan 48 horas desde `devolucion_iniciada_at`, el job cambia el estado a `custodia_vencida`. A partir de ese punto termina la obligación ordinaria de resguardo bajo el flujo Dropit, sin transferencia automática de propiedad.


# Facturación del establecimiento

> Actualización: 27/08/2026

## Pantallas

- `/establecimiento/facturacion`: lista solicitudes y pendientes.
- `/establecimiento/facturacion/[id]`: muestra folio, importe esperado, receptor y permite cargar XML/PDF.
- `/establecimiento/onboarding-fiscal`: selección/creación de perfil fiscal asociado al establecimiento.

## Flujo

El establecimiento emite el CFDI fuera de Dropit. Dropit recibe XML/PDF, valida que el RFC emisor corresponda al perfil fiscal asociado, que receptor y monto correspondan a la solicitud/operación y finalmente valida vigencia mediante PAC/SAT. Éxito: `invoices.estado = emitida`.

La factura emitida no libera automáticamente `balance_movimientos`; el pago se resolverá en conciliación mensual.

# Balance y retiros

> Actualización: 04/09/2026

`/establecimiento/balance` opera a nivel de cuenta y carga todos los establecimientos asociados al usuario autenticado. El filtro por establecimiento es sólo una ayuda visual.

La pantalla muestra generado histórico, disponible para retiro, en proceso, pagado y generación del mes corriente. Los movimientos elegibles de meses cerrados se agrupan por establecimiento y pueden seleccionarse individualmente o en conjunto.

La solicitud envía únicamente `balance_movimiento_ids` a `POST /api/orders/retiros/solicitar`; el frontend no decide el monto. El servidor vuelve a validar propiedad, elegibilidad y total. Una solicitud puede contener movimientos de varios establecimientos.
