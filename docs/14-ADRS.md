# Architecture Decision Records (ADR)

> Documento Oficial
>
> Versión: 1.1
>
> Estado: Activo
>
> Última actualización: 07/08/2026

---

# Objetivo

Este documento registra las decisiones arquitectónicas permanentes de Dropit.

Un ADR explica:

- Qué decisión se tomó.
- Por qué se tomó.
- Qué alternativas existían.
- Cuándo podría revisarse.

Las ADR evitan que el proyecto cambie de dirección por decisiones impulsivas o pérdida de contexto.

---

# Formato

Cada ADR deberá contener:

- Estado
- Contexto
- Decisión
- Consecuencias

---

# ADR-001

## Nombre

La documentación oficial es la fuente de verdad.

## Estado

Aceptada.

## Contexto

El proyecto dejó de depender del historial de conversaciones para documentar su funcionamiento.

## Decisión

Toda regla funcional o arquitectónica deberá registrarse dentro de `docs/`.

Las conversaciones sirven para diseñar.

La documentación oficial representa el comportamiento del sistema.

## Consecuencias

- Menor dependencia del historial.
- Incorporación más sencilla de nuevos desarrolladores.
- Mayor consistencia del proyecto.

---

# ADR-002

## Nombre

No refactorizar código estable.

## Estado

Aceptada.

## Contexto

Un refactor innecesario aumenta el riesgo de introducir errores.

## Decisión

El código estable no se modifica únicamente por razones estéticas.

Todo refactor deberá justificar un beneficio funcional o de mantenimiento.

## Consecuencias

- Mayor estabilidad.
- Menor riesgo en producción.

---

# ADR-003

## Nombre

Las APIs actuales permanecen bajo `app/api/orders`.

## Estado

Aceptada.

## Contexto

La estructura actual evolucionó durante el desarrollo.

Mover las rutas únicamente por organización implica riesgo.

## Decisión

La reorganización de APIs se realizará únicamente mediante un refactor planificado.

## Consecuencias

La estructura actual permanece estable hasta una futura versión mayor.

---

# ADR-004

## Nombre

Row Level Security es obligatorio.

## Estado

Aceptada.

## Contexto

La seguridad depende de las políticas RLS.

## Decisión

Nunca desactivar RLS en producción.

Toda tabla nueva deberá contar con políticas de acceso.

## Consecuencias

- Mayor seguridad.
- Aislamiento de datos.

---

# ADR-005

## Nombre

El vendedor controla la red de establecimientos disponibles.

## Estado

Aceptada.

## Contexto

El cliente únicamente debe elegir entre establecimientos previamente autorizados por el vendedor.

## Decisión

El cliente nunca podrá buscar establecimientos arbitrarios.

Siempre elegirá uno de los propuestos por el vendedor.

## Consecuencias

- Mejor control operativo.
- Menor riesgo logístico.
- Flujo consistente.

---

# ADR-006

## Nombre

Los vencimientos logísticos se resuelven con timestamps persistidos, RPC idempotentes y jobs protegidos.

## Estado

Aceptada.

## Contexto

Los plazos de entrega, recolección y devolución no pueden depender de que un usuario mantenga abierta una pantalla ni del reloj local del navegador.

## Decisión

Cada plazo comienza en un timestamp persistido en `pedidos`:

- `establecimiento_aceptado_at`
- `recibido_en`
- `devolucion_iniciada_at`

Los cambios automáticos de estado se ejecutan mediante jobs protegidos por `CRON_SECRET`, y cada transición se delega a una RPC idempotente.

El frontend únicamente representa el tiempo restante.

## Consecuencias

- Los vencimientos continúan aunque nadie use la aplicación.
- Se evita depender del navegador.
- Se reducen dobles cancelaciones, devoluciones o notificaciones.
- Los timers pueden mostrar un breve intervalo vencido antes de la siguiente ejecución del job.

---

# ADR-007

## Nombre

La devolución por falta de recolección forma parte de la máquina oficial de estados.

## Estado

Aceptada.

## Contexto

Un paquete no recogido no puede permanecer indefinidamente en el establecimiento.

## Decisión

Después de 48 horas en `pendiente_recoleccion`, el pedido pasa a `devolucion_pendiente`.

El vendedor dispone de 48 horas adicionales para recogerlo.

La devolución termina en:

- `devuelto`
- `custodia_vencida`

## Consecuencias

- Se delimita la responsabilidad temporal del establecimiento.
- El vendedor recibe una oportunidad formal para recuperar el paquete.
- El tracking requiere una ruta específica para devoluciones.
- Los Términos y Condiciones deberán reflejar estos plazos.

---

# ADR-008

## Nombre

La resolución de participantes en evaluaciones se realiza exclusivamente en servidor.

## Estado

Aceptada.

## Contexto

Las primeras implementaciones permitían que el frontend enviara `evaluador_id` y `evaluado_id`, generando posibles inconsistencias.

## Decisión

La API obtiene automáticamente los participantes a partir del pedido.

El frontend únicamente envía:

- `pedido_id`
- `rating`
- `comentario`
- `tipo_evaluador`
- `tipo_evaluado`

## Consecuencias

- Mayor seguridad.
- Menor lógica en el cliente.
- Imposibilidad de falsificar participantes.
- Arquitectura consistente.

---

# ADR-009

## Nombre

Las Coins representan un prepago y se consumen al iniciar la prestación del servicio.

## Estado

Aceptada.

## Contexto

Inicialmente las Coins se consumían al crear un pedido.

Con la incorporación del dominio Billing se identificó que la creación del pedido no representa el inicio efectivo de la prestación del servicio.

El servicio comienza cuando el establecimiento recibe físicamente el paquete.

## Decisión

Las Coins representan un prepago del servicio.

Su ciclo de vida será:

- Disponible.
- Reservada al crear el pedido.
- Consumida cuando el establecimiento recibe el paquete.

El evento oficial que provoca el consumo será la transición del pedido a `pendiente_recoleccion`.

## Consecuencias

- Se separa el prepago del consumo efectivo.
- El flujo económico queda alineado con el inicio del servicio.
- Billing utiliza un evento único para iniciar facturación y liquidaciones.
- Las cancelaciones anteriores a la recepción liberan la reserva de la Coin.

---

# ADR-010

## Nombre

Dropit centraliza todo el proceso de facturación.

## Estado

Parcialmente reemplazada por ADR-011.

## Contexto

El vendedor interactúa únicamente con Dropit durante todo el proceso de facturación.

La plataforma coordina internamente la emisión de los documentos necesarios sin requerir que el vendedor contacte directamente al establecimiento.

## Decisión

Toda solicitud de factura se realiza desde Dropit.

Internamente Billing administra:

- la factura correspondiente a la comisión de Dropit;
- la solicitud de factura al establecimiento;
- la recepción y validación de los documentos fiscales;
- la liberación de la liquidación cuando corresponda.

El vendedor nunca interactúa directamente con el establecimiento para obtener sus facturas.

## Consecuencias

- Experiencia consistente.
- Un único punto de contacto para el vendedor.
- Menor carga operativa.
- Billing se convierte en el dominio responsable de la facturación y las liquidaciones.

---

# ADR-011

## Nombre

CFDI externo del establecimiento, validación fiscal por Dropit y conciliación mensual separada.

## Estado

Aceptada.

## Contexto

El diseño inicial contemplaba que una solicitud generara dos facturas y que Dropit coordinara la emisión por pedido. Esto implicaba que Dropit pudiera emitir en nombre del establecimiento o custodiar/operar sus certificados, además de acoplar la validación fiscal con la liberación económica.

Durante la implementación se validó que el establecimiento puede emitir su CFDI externamente y que Dropit puede verificarlo contra la operación y contra SAT mediante PAC, sin asumir la emisión en nombre del establecimiento. También se decidió abandonar la liquidación por retiro como arquitectura objetivo y conciliar por periodos mensuales.

## Decisión

- El vendedor solicita factura exclusivamente desde Dropit.
- La solicitud crea actualmente el CFDI requerido al establecimiento; no una factura Dropit por pedido.
- El establecimiento emite externamente el CFDI por el valor bruto real del servicio y carga XML + PDF.
- Dropit valida emisor, receptor, monto y vigencia fiscal mediante PAC/SAT.
- Un CFDI válido queda `emitida`, pero no libera automáticamente el balance.
- `balance_movimientos` es la fuente financiera operativa; `settlements` no se usa para nueva lógica.
- El pago al establecimiento se resolverá mediante cierre y conciliación mensual.
- La comisión de Dropit se plantea mediante CFDI consolidado mensual por establecimiento, sujeto a validación fiscal final con contador.

Esta decisión reemplaza las partes de ADR-010 que implicaban emisión de factura Dropit por pedido o liberación automática de liquidación al recibir el CFDI. Se conserva de ADR-010 el principio de que el vendedor gestiona la solicitud y seguimiento desde Dropit.

## Consecuencias

- Dropit no necesita custodiar el CSD del establecimiento para este flujo.
- Se reduce el riesgo de emitir fiscalmente en nombre de terceros.
- La validación documental y el pago quedan desacoplados.
- El establecimiento conserva la responsabilidad de emitir su CFDI.
- Se requiere un proceso administrativo mensual de conciliación.
- La política de incumplimiento/reembolso y el disparador fiscal del CFDI mensual de comisión deben cerrarse con contador y Términos y Condiciones.

# ADR-012

## Nombre

Retiros por movimientos después del cierre mensual, con solicitud global multi-establecimiento.

## Estado

Aceptada, implementada y validada en QA y Producción.

## Contexto

ADR-011 estableció `balance_movimientos` como fuente financiera y separó validación fiscal de liquidación. Durante el diseño del cierre mensual se concluyó que eliminar por completo la solicitud de retiro quitaba al establecimiento control sobre cuándo cobrar servicios ya ganados y dificultaba agrupar varios establecimientos de una misma cuenta. El modelo anterior de retiro por monto arbitrario, FIFO y partición de movimientos tampoco garantizaba trazabilidad exacta entre solicitud y servicios pagados.

## Decisión

- El cierre mensual habilita elegibilidad; no fuerza el retiro completo del periodo.
- La zona horaria oficial para determinar el mes cerrado es `America/Mexico_City`.
- El establecimiento selecciona movimientos concretos de `balance_movimientos`; no captura un monto.
- El saldo de meses cerrados no expira y puede mezclarse entre periodos.
- Una solicitud puede incluir movimientos de varios establecimientos pertenecientes al mismo usuario.
- `retiros` funciona como cabecera global; `retiro_detalles` conserva subtotales por establecimiento; `retiro_aplicaciones` define los movimientos exactos y su snapshot monetario.
- Un movimiento no puede pertenecer a dos retiros activos (`pending`/`approved`). Un retiro `reversed` conserva historial pero libera sus movimientos.
- El pago sigue `pending → approved → paid`; el rechazo es `pending → reversed`.
- Al pagar se actualizan únicamente los movimientos seleccionados. Se elimina FIFO, split y generación de sobrantes.
- Backend calcula montos y valida propiedad/elegibilidad; el frontend nunca es autoridad financiera.

Esta ADR precisa y reemplaza únicamente la parte de ADR-011 que describía una conciliación mensual sin retiro elegido por el establecimiento. Se mantienen de ADR-011 `balance_movimientos` como fuente financiera, el desacoplamiento fiscal y el no uso de `settlements` para nueva lógica.

## Consecuencias

- Existe trazabilidad pedido → movimiento → aplicación → retiro.
- El establecimiento conserva control sobre cuándo cobrar saldo ya ganado.
- Una cuenta puede retirar conjuntamente saldo de varias sucursales.
- El administrador paga exactamente lo solicitado, sin selección FIFO implícita.
- Rechazar una solicitud no destruye historial.
- La creación y actualización crítica se ejecutan mediante RPC transaccionales con `FOR UPDATE`, evitando doble selección concurrente y estados parciales.
- QA validó solicitud, bloqueo de reutilización activa, rechazo/liberación, aprobación y pago exacto.
- La migración a Producción se realizó de forma controlada el 08/09/2026, inspeccionando previamente el esquema existente y aplicando únicamente las diferencias necesarias para el flujo de Retiros


---

# ADR-013

## Nombre

La capacidad se reserva cuando el cliente selecciona el establecimiento.

## Estado

Aceptada, implementada y validada en QA y Producción.

## Contexto

El modelo anterior descontaba capacidad en cada establecimiento candidato al momento de crear un pedido.

Esto provocaba que una misma orden reservara capacidad simultáneamente en varios establecimientos aunque el cliente finalmente utilizara sólo uno.

Además, un vendedor con múltiples pedidos podía seleccionar repetidamente los mismos establecimientos como candidatos y reducir artificialmente su disponibilidad sin que existieran reservas reales.

## Decisión

- Los establecimientos incluidos en `pedido_establecimientos` son únicamente candidatos y no consumen capacidad.

- La capacidad se reserva cuando el cliente selecciona un establecimiento concreto.

- La selección se ejecuta transaccionalmente mediante `confirmar_establecimiento_pedido`.

- La operación valida que el establecimiento pertenezca a los candidatos del pedido, comprueba capacidad disponible, bloquea el establecimiento para evitar sobreasignación concurrente, descuenta una unidad y asigna el establecimiento al pedido.

- Si el establecimiento rechaza, `rechazar_establecimiento_pedido` libera la capacidad reservada y devuelve el pedido a `creado`.

- La aceptación del establecimiento no realiza un segundo descuento; conserva la reserva existente.

- Las cancelaciones manuales y automáticas liberan únicamente la capacidad del establecimiento efectivamente reservado.

- La entrega o devolución libera la reserva al finalizar el flujo correspondiente.

## Consecuencias

- La capacidad representa compromisos reales y no establecimientos potenciales.

- Un vendedor no puede acaparar capacidad únicamente seleccionando establecimientos candidatos.

- La capacidad disponible puede cambiar entre la creación del pedido y la selección del cliente.

- Si al momento de la selección ya no existe capacidad, el establecimiento no puede ser confirmado.

- La reserva y el cambio de estado se realizan en una misma operación transaccional, evitando asignaciones sin capacidad o descuentos parciales.

- Las liberaciones afectan únicamente al establecimiento que tenía la reserva.

- El modelo fue validado en QA para `small` y `medium`, incluyendo selección, rechazo, aceptación, entrega, cancelación manual y cancelación automática.
---

# ADR-014

## Nombre

Protección pagada con compensación explícita entre Stripe y Orders.

## Estado

Aceptada, implementada y validada en QA.

## Contexto

El cobro de protección ocurre en Stripe y la creación del pedido y su registro de protección ocurren en PostgreSQL. No existe una transacción distribuida que pueda confirmar o revertir ambas plataformas como una sola operación. Cobrar primero sin compensación podía dejar un pago exitoso sin pedido o sin `pedido_protecciones`.

## Decisión

- El PaymentIntent de protección se crea server-side para un vendedor autenticado y conserva `vendedor_id` en metadata.
- Después de un pago exitoso se crea el pedido mediante `crear_pedido_con_coin` y posteriormente se registra `pedido_protecciones`.
- Si falla la creación del pedido después del cobro, se solicita un refund compensatorio.
- Si el pedido fue creado pero falla `pedido_protecciones`, el pedido se cancela mediante la API oficial, recuperando la Coin por las reglas normales, y después se solicita el refund.
- El endpoint de refund valida sesión, propiedad del PaymentIntent y estado del pago.
- Los refunds usan una idempotency key determinística por PaymentIntent para tolerar reintentos sin crear reembolsos independientes.
- Correos, defaults y cierre exitoso de UI ocurren después de completar el estado crítico de pedido/protección.

## Consecuencias

- Se evita dejar intencionalmente un cobro sin compensación ante los fallos controlados del flujo.
- La cancelación reutiliza la lógica oficial de Orders y no replica manualmente el reintegro de Coins.
- QA validó tanto el happy path como el fallo forzado de `pedido_protecciones`, comprobando pedido cancelado, movimiento `reintegro_cancelacion` y refund exitoso en Stripe.
- La solución no equivale a atomicidad distribuida: persiste una ventana ante crash o pérdida de conectividad entre operaciones externas. Una reconciliación/webhook adicional puede incorporarse si el volumen operativo lo requiere.

---

# ADR-015

## Nombre

Recepción física y generación de balance como una sola transacción.

## Estado

Aceptada, implementada y validada en QA y Producción.

## Contexto

La recepción física actualizaba primero el pedido a `pendiente_recoleccion` y posteriormente intentaba crear `balance_movimientos`.

Si fallaba la determinación del valor financiero o la creación del movimiento, el pedido podía quedar recibido sin saldo asociado al establecimiento.

Además, conocer folio y `codigo_vendedor` no debía ser suficiente para ejecutar una transición reservada al establecimiento asignado.

## Decisión

- `POST /api/orders/recibido` requiere Bearer token.
- El servidor valida que el usuario autenticado sea propietario del establecimiento asignado.
- `getOrderServiceValue` determina el bruto antes de realizar cualquier mutación crítica.
- La recepción se delega a `recibir_pedido_con_balance`.
- La RPC bloquea el pedido con `FOR UPDATE`.
- La generación de `codigo_entrega`, creación de `balance_movimientos`, transición a `pendiente_recoleccion` y registro de `recibido_en` ocurren en una sola transacción.
- Si falla cualquiera de esas operaciones, toda la recepción hace rollback.
- La RPC es `SECURITY DEFINER` y sólo `service_role` puede ejecutarla.
- QR, Storage y correo permanecen fuera de la transacción financiera.

## Consecuencias

- No puede confirmarse una recepción crítica sin crear simultáneamente su movimiento financiero.
- Los errores de trazabilidad financiera dejan el pedido en su estado anterior.
- El establecimiento que recibe queda vinculado al mismo `establecimiento_uuid` utilizado para generar su saldo.
- Las operaciones externas no prolongan ni condicionan la transacción de PostgreSQL.
- QA validó rollback ante fallo financiero y el flujo end-to-end.
- Producción validó un pedido real de prueba con bruto de $90.00, comisión de $9.00, IVA de $1.44 y neto de $79.56.


---

# ADR-016

## Nombre

El rol se origina en el flujo de alta y OAuth requiere aceptación legal explícita.

## Estado

Aceptada, implementada y validada en QA.

## Contexto

El flujo histórico creaba `profiles` sin rol y enviaba al usuario a `/seleccionar-rol`, donde una cuenta autenticada podía elegir libremente vendedor, establecimiento o comprador. Esto contradecía los registros específicos de vendedor/establecimiento y permitía cambiar la intención de alta después de autenticarse.

Google OAuth añadía otro problema: crear/autenticar la cuenta no exigía una acción explícita de aceptación de Términos y Aviso de Privacidad.

## Decisión

- El rol operativo proviene del flujo de alta iniciado y no de una selección posterior al login.
- Los registros por correo envían el rol de origen; el trigger sólo admite roles públicos permitidos y excluye `admin`.
- La aceptación legal se persiste en `aceptaciones_legales` con versiones documentales y timestamp.
- Autenticarse mediante Google no constituye aceptación legal.
- El contexto OAuth `vendor` o `establishment` se conserva hasta `/post-login`, pero nunca sustituye un `profiles.role` ya asignado.
- Un OAuth nuevo sin rol debe pasar por `/completar-registro`, aceptar explícitamente los documentos y ejecutar `completar_registro_oauth`.
- La RPC asigna rol y aceptación legal dentro de una misma transacción y no permite cambiar un rol existente.
- `/seleccionar-rol` se elimina.
- `admin` continúa siendo una asignación controlada y no puede originarse desde registro público.

## Consecuencias

- Registro por correo y OAuth comparten una regla consistente: la cuenta queda asociada al tipo de alta que inició.
- Existe evidencia versionada de aceptación legal independiente de la mera creación/autenticación del usuario.
- Un parámetro `role` manipulado no puede convertir una cuenta existente a otro rol.
- OAuth puede tener temporalmente `profiles.role = NULL`; ese estado representa un registro incompleto y no una cuenta operativa.
- La eliminación de `/seleccionar-rol` reduce una vía de autoasignación de privilegios desde cliente.
- QA validó los flujos de vendedor y establecimiento tanto por correo como por Google OAuth.
