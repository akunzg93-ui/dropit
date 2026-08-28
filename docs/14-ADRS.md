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
