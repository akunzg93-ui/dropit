# Flujo Oficial de Pedidos

> Documento Oficial  
> Versión: 1.1  
> Estado: Oficial  
> Última actualización: 18/07/2026

---

# Objetivo

Este documento define el comportamiento oficial del flujo de pedidos de Dropit.

El flujo de pedidos constituye el núcleo del sistema. Todas las funcionalidades relacionadas con clientes, vendedores, establecimientos, correos, códigos de seguridad, tracking, cancelaciones, devoluciones y auditoría dependen de este flujo.

---

# Principios

- Un pedido únicamente puede encontrarse en un estado a la vez.
- Las reglas del negocio se aplican en las transiciones entre estados.
- Toda transición relevante debe registrarse en `pedido_eventos`.
- Los procesos automáticos deben ser idempotentes.
- Los plazos se calculan con timestamps persistidos en `pedidos`, no con el reloj del frontend.

---

# Máquina de estados

```text
creado
  │ cliente confirma establecimiento
  ▼
pendiente_aprobacion_establecimiento
  │ establecimiento acepta
  ▼
en_transito
  ├─ vendedor entrega dentro de 24 h ───────────────┐
  │                                                 ▼
  └─ no entrega dentro de 24 h ──────────────── cancelado
                                                    
pendiente_recoleccion
  ├─ cliente recoge dentro de 48 h ───────────── entregado
  │
  └─ no recoge dentro de 48 h
        ▼
devolucion_pendiente
  ├─ vendedor recoge dentro de 48 h ───────────── devuelto
  │
  └─ no recoge dentro de 48 h
        ▼
custodia_vencida
```

---

# Estados oficiales

| Estado | Descripción | Terminal |
|---|---|---|
| creado | Pedido creado por el vendedor. | No |
| pendiente_aprobacion_establecimiento | El cliente eligió el punto y el establecimiento debe aceptar o rechazar. | No |
| en_transito | El establecimiento aceptó y el vendedor debe entregar el paquete. | No |
| pendiente_recoleccion | El establecimiento recibió el paquete y espera al cliente. | No |
| entregado | El cliente recibió el paquete. | Sí |
| cancelado | El pedido fue cancelado manual o automáticamente. | Sí |
| devolucion_pendiente | El cliente no recogió a tiempo y el vendedor debe recuperar el paquete. | No |
| devuelto | El establecimiento entregó el paquete de regreso al vendedor. | Sí |
| custodia_vencida | Venció el plazo de devolución y terminó la obligación ordinaria de resguardo del establecimiento. | Sí para el flujo automatizado |

`validando_establecimiento` queda como término histórico y no debe utilizarse en nuevas implementaciones. El estado vigente es `pendiente_aprobacion_establecimiento`.

---

# Transiciones oficiales

| ID | De | A | Actor o proceso |
|---|---|---|---|
| T-001 | — | creado | Vendedor |
| T-002 | creado | pendiente_aprobacion_establecimiento | Cliente |
| T-003 | pendiente_aprobacion_establecimiento | en_transito | Establecimiento |
| T-004 | pendiente_aprobacion_establecimiento | creado | Rechazo o expiración |
| T-005 | en_transito | pendiente_recoleccion | Establecimiento |
| T-006 | en_transito | cancelado | Vendedor o proceso automático |
| T-007 | pendiente_recoleccion | entregado | Establecimiento |
| T-008 | pendiente_recoleccion | devolucion_pendiente | Proceso automático |
| T-009 | devolucion_pendiente | devuelto | Establecimiento |
| T-010 | devolucion_pendiente | custodia_vencida | Proceso automático |

---

# Flujo normal

## T-001 — Crear pedido

El vendedor autenticado registra el pedido, selecciona uno o más establecimientos candidatos y consume una Coin del tamaño correspondiente mediante FIFO.

Acciones principales:

- Generar folio.
- Insertar el pedido.
- Relacionar establecimientos candidatos.
- Consumir una Coin.
- Registrar el evento inicial.
- Notificar al cliente cuando corresponda.

## T-002 — Cliente confirma establecimiento

El cliente valida el folio y selecciona uno de los establecimientos propuestos por el vendedor.

Resultado:

- Se asigna el establecimiento definitivo.
- Se registra `establecimiento_notificado_at`.
- El pedido pasa a `pendiente_aprobacion_establecimiento`.
- Se notifica al establecimiento.
- La pantalla redirige al tracking público.

## T-003 — Establecimiento acepta

El establecimiento revisa capacidad, tamaño y datos del pedido.

Resultado:

- El pedido pasa a `en_transito`.
- Se registra `establecimiento_aceptado_at`.
- Se genera `codigo_vendedor` si no existe.
- Se notifica al vendedor.
- Comienza el plazo de 24 horas para entregar el paquete.

## T-004 — Rechazo o expiración de aprobación

Si el establecimiento rechaza o no responde dentro del plazo configurado, el pedido regresa a `creado` para permitir que el cliente seleccione otro punto disponible.

## T-005 — Establecimiento recibe

Reglas:

- El pedido debe estar en `en_transito`.
- El folio y `codigo_vendedor` deben ser válidos.

Resultado:

- El pedido pasa a `pendiente_recoleccion`.
- Se registra `recibido_en`.
- Se genera `codigo_entrega` si no existe.
- Se registra el evento.
- Se notifica al cliente.
- Comienza el plazo de 48 horas para recolección.

## T-007 — Cliente recoge

Reglas:

- El pedido debe estar en `pendiente_recoleccion`.
- El código de entrega debe ser válido.

Resultado:

- El pedido pasa a `entregado`.
- Se registra el evento.
- Finaliza el flujo normal.

---

# Cancelación

## T-006 — Cancelación en tránsito

Si transcurren 24 horas desde `establecimiento_aceptado_at` sin recepción física, el proceso automático puede cancelar el pedido.

Efectos:

- Estado `cancelado`.
- Liberación de capacidad reservada.
- Reintegro de la Coin al lote original mediante `restore_coin_for_cancelation`.
- Evento de tracking.
- Correos al cliente y al vendedor.
- Prevención de doble reintegro y doble cancelación.

El vendedor también puede cancelar en los estados autorizados mediante `cancel_order_by_vendor`.

---

# Flujo de devolución

## T-008 — Inicio automático de devolución

Si transcurren 48 horas desde `recibido_en` sin entrega al cliente:

- El pedido pasa a `devolucion_pendiente`.
- Se registra `devolucion_iniciada_at`.
- Se genera o conserva el mecanismo de validación correspondiente.
- Se registra el evento.
- Se notifica al cliente y al vendedor.
- Comienza un nuevo plazo de 48 horas para que el vendedor recoja el paquete.

La transición se ejecuta mediante `start_order_return` y un job protegido.

## T-009 — Devolución completada

El establecimiento valida la entrega del paquete al vendedor.

Resultado:

- Estado `devuelto`.
- Se registra `devuelto_at`.
- Se registra el evento.
- Finaliza el flujo de devolución.

La transición se ejecuta mediante `complete_order_return`.

## T-010 — Custodia vencida

Si transcurren 48 horas desde `devolucion_iniciada_at` sin que el vendedor recoja:

- Estado `custodia_vencida`.
- Se registra `custodia_vencida_at`.
- Se registra el evento.
- Se notifica al vendedor.
- El establecimiento deja de estar obligado al resguardo ordinario bajo el flujo Dropit.

La transición se ejecuta mediante `expire_order_return_custody` y un job protegido.

---

# Tracking público

La ruta pública es `/track/[folio]`.

El tracking se obtiene mediante la RPC `get_pedido_tracking(text)` y muestra:

- Datos generales del pedido.
- Estado actual.
- Establecimiento elegido.
- Historial ordenado desde `pedido_eventos`.
- Descripción y fecha de cada evento.
- Timestamps operativos necesarios para los plazos.

## Contadores visibles

| Estado | Inicio | Duración |
|---|---|---|
| en_transito | `establecimiento_aceptado_at` | 24 horas |
| pendiente_recoleccion | `recibido_en` | 48 horas |
| devolucion_pendiente | `devolucion_iniciada_at` | 48 horas |

Los contadores son informativos. El backend y los jobs automáticos son la autoridad para cambiar el estado.

El componente reutilizable `CountdownTimer` utiliza la identidad visual azul de Dropit, muestra días cuando corresponda y omite segundos.

---

# Auditoría y notificaciones

Toda transición debe generar un evento con:

- `pedido_id`
- `estado`
- `descripcion`
- `created_at`

Las notificaciones se envían únicamente después de una transición válida. Si una operación falla, el estado no debe cambiar y no deben enviarse correos de éxito.

---

# Cierre

Los estados terminales actuales son:

- `entregado`
- `cancelado`
- `devuelto`
- `custodia_vencida` para el flujo automatizado de resguardo

La entrega manual por contingencia continúa pendiente y requiere diseño funcional y ADR antes de implementarse.
