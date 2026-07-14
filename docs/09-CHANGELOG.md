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

## 2026-07-14

### Agregado
- Cancelación automática de pedidos por falta de entrega al establecimiento después de 24 horas.
- Reintegro automático de Coin al lote original.
- Liberación automática de capacidad.
- Evento de tracking para cancelación automática.
- Endpoint protegido para ejecución mediante Cron.
