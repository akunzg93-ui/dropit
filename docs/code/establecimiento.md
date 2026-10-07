# Módulo Establecimiento

> Documento Oficial  
> Versión: 1.3  
> Estado: En construcción  
> Última actualización: 05/10/2026

# Objetivo

El establecimiento representa el nodo físico de la red Dropit. Aprueba solicitudes, recibe, resguarda temporalmente y entrega paquetes al cliente o de regreso al vendedor.

# Pantallas principales

| Ruta | Responsabilidad |
|---|---|
| `/establecimiento/aprobar/[id]` | Aceptar o rechazar pedido |
| `/establecimiento/recibir-pedido` | Recibir del vendedor |
| `/establecimiento/entregar` | Entregar al cliente o devolver al vendedor |
| `/establecimiento/estado` | Consultar pedidos por estado |
| `/establecimiento/balance` | Consultar saldo y solicitar retiros |
| `/establecimiento/datos-bancarios` | Registrar o editar la cuenta destino de retiros |
| `/establecimiento` | Registrar un nuevo establecimiento o editar uno existente |
| `/establecimiento/onboarding-fiscal` | Configurar o asociar información fiscal del establecimiento |


# Registro y administración de establecimientos

El registro de una nueva ubicación utiliza un flujo guiado:

1. Selección de ubicación.
2. Datos del establecimiento, horarios y capacidades.
3. Configuración fiscal o decisión de omitirla por el momento.
4. Confirmación de establecimiento registrado.
5. Entrada al panel operativo.

La ubicación puede definirse mediante búsqueda/autocompletado, ubicación actual o selección directa sobre el mapa.

Los horarios se configuran por día y admiten múltiples intervalos. Se almacenan en `establecimiento_horarios`. Tienen propósito informativo para facilitar la coordinación entre vendedor, cliente y establecimiento y no determinan visibilidad ni disponibilidad en tiempo real.

## Edición

`/establecimiento` reutiliza el mismo formulario para editar establecimientos existentes. El panel puede abrir directamente la edición mediante `/establecimiento?editar=ID`.

La página localiza el establecimiento perteneciente al usuario y reutiliza `editarEstablecimiento`, incluyendo la carga de sus intervalos desde `establecimiento_horarios`. La actualización de horarios utiliza `reemplazar_horarios_establecimiento`. No existe un segundo flujo independiente de edición.

# Panel operativo

`/establecimiento/estado` funciona como centro operativo del establecimiento.

El resumen principal organiza los pedidos en Por aprobar, En tránsito, Por entregar y Entregados. Como estados secundarios muestra Devoluciones pendientes, Devueltos, Custodia vencida y Ver todos.

## Tus establecimientos

El panel permite administrar múltiples establecimientos pertenecientes a la misma cuenta. La sección `Tus establecimientos` permite seleccionar cuál establecimiento se está revisando, visualizar su dirección, entrar a su edición mediante `Administrar` e iniciar el registro de otra ubicación mediante `Agregar establecimiento`.

Cambiar el establecimiento seleccionado actualiza los pedidos y métricas del panel utilizando la lógica existente.

# Onboarding del panel

La primera entrada al panel puede mostrar una introducción educativa de tres pasos: centro de operación, flujo de un pedido y recepción/entrega de paquetes.

Su estado se persiste en `user_onboarding` con `feature = establishment_panel` y `version = 1`. Tanto completar como omitir la introducción evita que esa versión vuelva a mostrarse al usuario. Este onboarding es independiente del onboarding fiscal.

# Aprobación

Al aceptar:

- el pedido pasa a `en_transito`;
- se registra `establecimiento_aceptado_at`;
- comienza el plazo de 24 horas del vendedor;
- se genera o conserva el código del vendedor;
- se notifica al vendedor.

# Recepción del vendedor

Valida folio y `codigo_vendedor`. La captura puede ser manual o mediante QR `FOLIO|CODIGO_VENDEDOR`. Al leer un QR válido, la UI muestra confirmación visual y ejecuta automáticamente `preview-vendedor`; el usuario todavía debe confirmar la recepción física antes de llamar a `recibido`.

Resultado:

- estado `pendiente_recoleccion`;
- timestamp `recibido_en`;
- código de entrega al cliente;
- evento y notificación;
- inicio de custodia por 48 horas.

# Entrega al cliente

Valida el código de entrega y cierra el pedido en `entregado`. La captura puede ser manual o mediante QR `FOLIO|CODIGO_ENTREGA`; una lectura válida ejecuta automáticamente el preview, pero la entrega final permanece detrás de la confirmación explícita del establecimiento.

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
- `/establecimiento/onboarding-fiscal`: selección/creación de perfil fiscal asociado al establecimiento. Al completar el onboarding con datos operativos y perfil fiscal válidos, la API asocia `fiscal_profile_id` y activa el establecimiento.

## Flujo

El establecimiento emite el CFDI fuera de Dropit. Dropit recibe XML/PDF, valida que el RFC emisor corresponda al perfil fiscal asociado, que receptor y monto correspondan a la solicitud/operación y finalmente valida vigencia mediante PAC/SAT. Éxito: `invoices.estado = emitida`.

La factura emitida no libera automáticamente `balance_movimientos`; el pago se resolverá en conciliación mensual.

# Balance y retiros

> Actualización: 19/09/2026

`/establecimiento/balance` opera a nivel de cuenta y carga todos los establecimientos asociados al usuario autenticado. El filtro por establecimiento es sólo una ayuda visual.

La pantalla muestra generado histórico, disponible para retiro, en proceso, pagado y generación del mes corriente. Los movimientos elegibles de meses cerrados se agrupan por establecimiento y pueden seleccionarse individualmente o en conjunto.

La solicitud envía únicamente `balance_movimiento_ids` a `POST /api/orders/retiros/solicitar`; el frontend no decide el monto. El servidor vuelve a validar propiedad, elegibilidad, total y existencia de cuenta bancaria. Una solicitud puede contener movimientos de varios establecimientos.

La cuenta bancaria se administra en `/establecimiento/datos-bancarios` y pertenece al titular de la cuenta, no a cada establecimiento. La pantalla permite registrar una cuenta o consultar un resumen enmascarado y entrar en modo edición. Cada registro/edición exige nuevamente consentimiento para el tratamiento de datos financieros.

Balance consulta preventivamente si existen datos bancarios. Si faltan, muestra un aviso con acceso al registro; si aun así se intenta solicitar, el backend responde `DATOS_BANCARIOS_REQUIRED` y la UI muestra el error con CTA y desplazamiento suave hacia el mensaje.

En navegación desktop, Balance y Datos bancarios se agrupan bajo `Finanzas` para mantener acceso visible sin saturar el navbar.
