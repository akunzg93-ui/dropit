# Changelog de Dropit

> Todas las modificaciones relevantes del proyecto deberán registrarse en este documento.

El formato utilizado sigue el estándar **Keep a Changelog** adaptado a Dropit.

---

# [1.0.0] - En desarrollo

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
