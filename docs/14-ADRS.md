# Architecture Decision Records (ADR)

> Documento Oficial
>
> Versión: 1.0
>
> Estado: Activo
>
> Última actualización: 18/07/2026

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

Aceptada

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

# ADR-002

## Nombre

No refactorizar código estable.

## Estado

Aceptada

## Contexto

Un refactor innecesario aumenta el riesgo de introducir errores.

## Decisión

El código estable no se modifica únicamente por razones estéticas.

Todo refactor deberá justificar un beneficio funcional o de mantenimiento.

## Consecuencias

- Mayor estabilidad.
- Menor riesgo en producción.

# ADR-003

## Nombre

Las APIs actuales permanecen bajo app/api/orders.

## Estado

Aceptada

## Contexto

La estructura actual evolucionó durante el desarrollo.

Mover las rutas únicamente por organización implica riesgo.

## Decisión

La reorganización de APIs se realizará únicamente mediante un refactor planificado.

## Consecuencias

La estructura actual permanece estable hasta una futura versión mayor.

# ADR-004

## Nombre

Row Level Security es obligatorio.

## Estado

Aceptada

## Contexto

La seguridad depende de las políticas RLS.

## Decisión

Nunca desactivar RLS en producción.

Toda tabla nueva deberá contar con políticas de acceso.

## Consecuencias

Mayor seguridad y aislamiento de datos.

# ADR-005

## Nombre

El vendedor controla la red de establecimientos disponibles.

## Estado

Aceptada

## Contexto

El cliente únicamente debe elegir entre establecimientos previamente autorizados por el vendedor.

## Decisión

El cliente nunca podrá buscar establecimientos arbitrarios.

Siempre elegirá uno de los propuestos por el vendedor.

## Consecuencias

- Mejor control operativo.
- Menor riesgo logístico.
- Flujo consistente.

Componentes UI

↓

No conocen Dropit

↓

Reutilizables



Componentes negocio

↓

Conocen Dropit

↓

Implementan reglas del producto

---

# ADR-006

## Nombre

Los vencimientos logísticos se resuelven con timestamps persistidos, RPC idempotentes y jobs protegidos.

## Estado

Aceptada

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

Aceptada

## Contexto

Un paquete no recogido no puede permanecer indefinidamente en el establecimiento.

## Decisión

Después de 48 horas en `pendiente_recoleccion`, el pedido pasa a `devolucion_pendiente`. El vendedor dispone de 48 horas adicionales. La devolución termina en `devuelto` o, si vence el segundo plazo, en `custodia_vencida`.

## Consecuencias

- Se delimita la responsabilidad temporal del establecimiento.
- El vendedor recibe una oportunidad formal de recuperar el paquete.
- El tracking necesita una ruta visual de devolución distinta del flujo normal.
- Los Términos y Condiciones deben reflejar estos plazos.
