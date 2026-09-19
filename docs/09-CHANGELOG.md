# Changelog de Dropit

> Todas las modificaciones relevantes del proyecto deberán registrarse en este documento.

El formato utilizado sigue el estándar **Keep a Changelog** adaptado a Dropit.

---

# [1.0.0] - En desarrollo

## 2026-09-19

### Autenticación - roles y aceptación legal

- Se agregó `aceptaciones_legales` para conservar evidencia versionada de Términos y Aviso de Privacidad; versión vigente `2026-09`.
- `handle_new_user_dynamic()` crea el perfil con un rol público permitido y nunca permite `admin` desde metadata del cliente.
- Los registros por correo de establecimiento y emprendedor envían aceptación explícita y versiones legales después de validar el checkbox obligatorio.
- Google OAuth conserva el contexto `vendor`/`establishment`, pero un usuario nuevo permanece inicialmente sin rol y sin aceptación legal.
- Se agregó `/completar-registro` y la RPC `completar_registro_oauth`, que asigna rol y registra aceptación legal atómicamente para usuarios autenticados.
- `/post-login` prioriza siempre `profiles.role`; un parámetro de URL no puede cambiar el rol de una cuenta existente.
- Se eliminó `/seleccionar-rol` y la autoasignación libre de roles desde cliente.
- QA validó correo y OAuth para vendedor y establecimiento, incluyendo el estado previo sin aceptación y el registro posterior `2026-09`.

### Retiros - datos bancarios y pago trazable

- Se agregó `titular_datos_bancarios` con una cuenta bancaria editable por titular/usuario, compartida entre sus establecimientos.
- El registro/edición exige consentimiento y conserva `consentimiento_at` y `aviso_privacidad_version`; el servidor controla identidad, timestamp y versión.
- Se agregó `GET/POST /api/orders/retiros/datos-bancarios` y la pantalla `/establecimiento/datos-bancarios`.
- `crear_retiro_desde_movimientos` exige datos bancarios y guarda en `retiros` un snapshot de titular, banco y CLABE para que cambios futuros no alteren solicitudes existentes.
- Balance detecta preventivamente la ausencia de cuenta, muestra CTA de registro y mantiene el bloqueo server-side `DATOS_BANCARIOS_REQUIRED`; el error de solicitud desplaza suavemente la vista hacia el mensaje.
- En desktop, Balance y Datos bancarios se agrupan bajo el menú `Finanzas`.
- Admin muestra el snapshot bancario del retiro para ejecutar la transferencia.
- `actualizar_retiro_admin` exige referencia no vacía en `approved → paid`; la API traduce `REFERENCIA_PAGO_REQUIRED`.
- QA validó registro y edición de cuenta, renovación de consentimiento, bloqueo sin cuenta, snapshot, solicitud de $92.16 con dos movimientos de $46.08, `pending → approved → paid`, referencia de pago y sincronización de ambos `balance_movimientos`.
- La extensión bancaria permanece pendiente de migración y validación en Producción.

## 2026-09-18

### Go Live Audit - recepción atómica y autorización

- `POST /api/orders/recibido` exige Bearer token y valida que el usuario autenticado sea propietario del establecimiento asignado.
- El valor financiero del servicio se resuelve antes de modificar el pedido.
- Se agregó `recibir_pedido_con_balance`, que bloquea el pedido y registra `codigo_entrega`, `pendiente_recoleccion`, `recibido_en` y `balance_movimientos` en una sola transacción.
- Si falla la creación del balance, toda la recepción hace rollback.
- La RPC sólo permite `EXECUTE` a `service_role`.
- Los nuevos movimientos mantienen comisión de 10% + IVA 16% sobre comisión y nacen como `available`.
- La atomicidad fue validada mediante rollback controlado y prueba end-to-end en QA.
- Producción validó el flujo end-to-end con recepción y movimiento financiero creados en la misma transacción.

## 2026-09-17

### Go Live Audit - pagos, protección y seguridad

- Se validó el flujo de compra de Coins: PaymentIntent exitoso → webhook Stripe → `acreditar_compra_stripe` → lotes y movimientos. La idempotencia evitó duplicación ante procesamiento repetido del mismo pago.
- Para desarrollo local se documentó el uso de Stripe CLI para reenviar eventos a `/api/orders/stripe/webhook`; no se modificó el flujo productivo por esta limitación local.
- `POST /api/orders/proteccion/create-intent` exige sesión y vincula el PaymentIntent al vendedor mediante metadata.
- Se agregó reembolso compensatorio de protección. Si falla la creación del pedido después del cobro se reembolsa; si falla `pedido_protecciones`, se cancela el pedido por el flujo oficial, se reintegra la Coin y se reembolsa.
- El reembolso de protección usa idempotency key determinística por PaymentIntent.
- QA validó happy path de protección y compensación completa: pedido cancelado, Coin reintegrada y refund Stripe exitoso.
- `POST /api/orders/rechazar-pedido` exige Bearer token y valida propiedad del establecimiento.
- Se endurecieron permisos `EXECUTE` de `crear_pedido_con_coin`, `confirmar_establecimiento_pedido` y `rechazar_establecimiento_pedido` en QA y Producción bajo mínimo privilegio.
- La comisión vigente para nuevos `balance_movimientos` es 10% + IVA 16% sobre comisión; los movimientos históricos conservan sus tasas originales.


## 2026-09-10

### Pedidos - creación atómica y reserva de capacidad

- La creación del pedido, consumo de Coin y registro de establecimientos candidatos se encapsularon en `crear_pedido_con_coin`.

- Se agregó `idempotency_key` para evitar pedidos duplicados ante reintentos de creación.

- Los establecimientos candidatos ya no descuentan capacidad al crear el pedido.

- La capacidad se reserva únicamente cuando el cliente selecciona un establecimiento mediante `confirmar_establecimiento_pedido`.

- La selección valida que el establecimiento sea candidato, comprueba capacidad disponible y realiza la reserva y asignación de forma transaccional.

- `rechazar_establecimiento_pedido` libera la capacidad reservada cuando el establecimiento rechaza y devuelve el pedido a `creado`.

- La aceptación conserva la reserva existente y no realiza un segundo descuento.

- `cancel_order_by_vendor` y `cancel_order_automatic` liberan únicamente la capacidad del establecimiento efectivamente reservado.

- QA validó creación e idempotencia, selección y reserva para `small` y `medium`, rechazo, aceptación, entrega, cancelación manual y cancelación automática.

- Producción fue inspeccionada y migrada de forma controlada; creación atómica, reserva de capacidad y liberaciones quedaron verificadas estructuralmente.

## 2026-09-06

# [1.0.0] - En desarrollo

## 2026-09-06

### Retiros - endurecimiento transaccional y Admin

- `POST /api/orders/retiros/solicitar` delega la creación a `crear_retiro_desde_movimientos`.
- La RPC bloquea con `FOR UPDATE` los movimientos seleccionados y crea `retiros`, `retiro_aplicaciones` y `retiro_detalles` en una sola transacción.
- `POST /api/orders/retiros/update` delega las transiciones a `actualizar_retiro_admin`.
- Aprobación, rechazo y pago quedaron protegidos transaccionalmente; el pago actualiza únicamente los movimientos exactos de la solicitud.
- Las RPC críticas son `SECURITY DEFINER` y sólo `service_role` conserva permiso de ejecución.
- Se agregó `GET /api/orders/retiros/admin` para lectura financiera server-side con validación de rol Admin, sin ampliar RLS del ledger al navegador.
- QA validó solicitud, prevención de doble solicitud activa, rechazo/liberación, aprobación, pago y sincronización entre `retiros`, `retiro_aplicaciones` y `balance_movimientos`.
- Se corrigió el comando local de Stripe CLI para reenviar webhooks a `/api/orders/stripe/webhook`.
- En tracking se desactivó `scrollWheelZoom` para evitar el error de lifecycle `_leaflet_pos` y no capturar el scroll de la página.
- Pendiente para Producción: inspección de históricos/orfandades y migración controlada de esquema, FKs, permisos y RPC.

## 2026-09-04

### Establecimientos - retiros por movimientos y cierre mensual

- `/establecimiento/balance` pasó de retiro por monto arbitrario a selección explícita de servicios elegibles.
- Una cuenta puede solicitar en un solo retiro movimientos de varios establecimientos.
- El backend calcula el total y valida propiedad, mes cerrado y ausencia de otro retiro activo.
- La elegibilidad inicia al cerrar el mes en `America/Mexico_City`; el saldo ganado de meses anteriores no expira.
- `retiro_aplicaciones` define los movimientos exactos del retiro y `retiro_detalles` conserva subtotales por establecimiento.
- El pago dejó de usar FIFO/splits: sólo se marcan `paid` los movimientos seleccionados.
- El rechazo conserva historial y vuelve a habilitar los movimientos.
- `POST /api/orders/retiros/update` exige autenticación y rol `admin`.
- QA validó solicitud multi-establecimiento, pago exacto y rechazo/liberación.
- Se agregaron en QA FKs desde `retiro_aplicaciones` hacia `retiros` y `balance_movimientos`, y `retiros` admite `user_id` y `establecimiento_id` nullable para el modelo global.
- Pendiente antes de Producción: encapsular creación/pago en transacciones/RPC atómicas y revisar datos históricos antes de aplicar FKs/migración.



## 2026-08-31

### Coins - expiración automática

- Se validó `expirar_coins_vencidas()` sin modificar su lógica: registra un movimiento `expiracion` y lleva a cero el saldo restante del lote vencido.
- Se habilitó `pg_cron` en QA y Producción.
- Se programó el job `expirar-coins-vencidas` con ejecución diaria a las `00:10 UTC` (`10 0 * * *`).
- Se sanearon los lotes vencidos que conservaban `cantidad_disponible > 0`: 6 lotes / 25 Coins en QA y 3 lotes / 10 Coins small en Producción.
- Se verificó que cada saneamiento generara su movimiento `expiracion` con referencia `expiracion_automatica`.
- El consumo FIFO ya excluía lotes vencidos por fecha; el cambio elimina saldos persistentes “fantasma” y automatiza su cierre contable en BD.

## Agregado

- Flujo completo de pedidos.
- Registro de vendedores.
- Registro de establecimientos.
- Registro de clientes.
- Selección de establecimiento por el cliente.
- Tracking público por folio.
- Sistema de QR para entrega.
- Códigos de recepción y entrega.
- Sistema de Coins.
- Integración con Stripe.
- Historial de eventos del pedido.
- Correos automáticos.
- Panel administrativo inicial.
- Documentación oficial del proyecto.

---

## Mejorado

- Consumo FIFO de coins.
- Arquitectura de APIs.
- UX unificada.
- Flujo de seguimiento.

---

## Seguridad

- Implementación de Row Level Security.
- Validación de códigos de recepción.
- Validación de códigos de entrega.
- Uso de Service Role para operaciones críticas.

---

## Documentación

- Arquitectura.
- Base de datos.
- APIs.
- Seguridad.
- Convenciones.
- Glosario.
- Reglas de negocio.


## 2026-08-31

### Seguridad - aceptación de pedidos

- `POST /api/orders/aceptar-establecimiento` ahora exige autenticación y valida propiedad del establecimiento asignado.
- Un usuario de otro establecimiento recibe `403` y no puede modificar el pedido.
- Se validaron en QA tanto el caso autorizado como el intento de aceptación por un establecimiento ajeno.

### Autenticación - post-login de establecimiento

- `/post-login` envía directamente a `/establecimiento/estado` cuando la cuenta ya posee al menos un establecimiento activo con perfil fiscal vinculado.
- Si ningún establecimiento ha completado el onboarding fiscal, se retoma el onboarding del establecimiento más reciente.
- Un establecimiento nuevo incompleto ya no obliga a repetir onboarding cuando la cuenta ya tiene otro establecimiento correctamente configurado.

## 2026-07-18

### Agregado
- Flujo automático de devolución por falta de recolección del cliente después de 48 horas.
- Estado `devolucion_pendiente` y código de devolución para el vendedor.
- Cierre de devolución con estado `devuelto`.
- Vencimiento automático de custodia después de 48 horas adicionales.
- Estado `custodia_vencida` y correo informativo al vendedor.
- Jobs protegidos `iniciar-devoluciones` y `custodia-vencida`.
- RPC `get_pedido_tracking` ampliada con timestamps y descripciones de eventos.
- Timers públicos para entrega, recolección y devolución.
- Componente reutilizable `CountdownTimer` con UX azul, sin segundos.
- Flujo dual en tracking: entrega normal y devolución.

### Mejorado
- Terminología visible estandarizada a “cliente”.
- Términos y Condiciones actualizados con plazos de 24/48/48 horas.
- Historial público ahora muestra descripciones reales de los eventos.

## 2026-07-14

### Agregado
- Cancelación automática de pedidos por falta de entrega al establecimiento después de 24 horas.
- Reintegro automático de Coin al lote original.
- Liberación automática de capacidad.
- Evento de tracking para cancelación automática.
- Endpoint protegido para ejecución mediante Cron.

### Agregado

- Sistema bidireccional de evaluaciones entre comprador, vendedor y establecimiento.
- Enlaces de evaluación automáticos desde los correos posteriores a la entrega.
- Registro de reputación asociado al pedido.

### Mejorado

- Resolución automática de participantes de las evaluaciones desde el servidor.
- Prevención de evaluaciones duplicadas.

## 2026-08-11

### Facturación

- Se implementó el flujo completo de solicitud de factura.
- Se añadieron perfiles fiscales reutilizables.
- Se agregó creación automática de invoice_requests.
- Se crean automáticamente dos registros en invoices (Dropit y Establecimiento).
- Se implementó consulta persistente del estado de facturación.
- Se agregó Timeline dinámico.
- Se agregó popup de confirmación.
- Se modularizó el frontend de Facturación mediante componentes y el hook useBilling.

### Pendiente

- Integración con SW Sapien (JSON).
- Timbrado CFDI.
- Descarga de XML/PDF.

## 2026-08-27

### Facturación - CFDI establecimiento

- Se cerró y validó en QA el flujo de carga de XML/PDF del establecimiento.
- Se agregó validación de RFC emisor contra perfil fiscal del establecimiento.
- Se valida RFC receptor contra snapshot fiscal del vendedor.
- Se valida el total contra `balance_movimientos.monto_bruto`.
- Se integró validación fiscal PAC/SAT con SW y aceptación únicamente de CFDI vigente/localizado.
- La factura validada cambia a `emitida` y conserva UUID, subtotal, total y fecha.
- La validación fiscal no libera el balance; permanece `pending` hasta conciliación mensual.
- Se consolidó `balance_movimientos` como fuente financiera operativa y se descartó `settlements` para nueva lógica.
- Se definió que el establecimiento emite externamente su CFDI y Dropit no emite en su nombre.
- Se definió como arquitectura objetivo un CFDI mensual consolidado de comisión Dropit por establecimiento, pendiente de validación final con contador.
- Se documentó ADR-011.
