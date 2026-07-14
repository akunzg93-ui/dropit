# API Routes

> Documento Oficial
>
> Versión: 1.0
>
> Estado: En construcción
>
> Última actualización: 11/07/2026

---

# Objetivo

Documentar las API Routes que conforman el backend de Dropit.

Las APIs implementan las reglas del negocio y representan la autoridad del sistema.

---

# Organización actual

Actualmente la mayoría de las rutas se encuentran bajo:

app/api/orders/

Esta organización responde a la evolución histórica del proyecto.

Aunque algunas rutas ya no pertenecen estrictamente al dominio de pedidos, no deberán reorganizarse mientras permanezcan estables.

Cualquier refactor deberá realizarse mediante un RFC.

---

# Dominios

## Flujo del pedido

- confirmado
- recibido
- entregado
- preview
- preview-vendedor
- aceptar-establecimiento
- rechazar-pedido

---

## Notificaciones

- notificar-vendedor
- notificar-comprador-rechazo
- notificar-establecimiento
- email
- test-email

---

## Coins

- coins
- movimientos

---

## Pagos

- payments

---

## Etiquetas

- generar-etiqueta

---

## Evaluaciones

- evaluaciones
- reviews

---

## Seguridad

- auth
- proteccion

---

## Procesos automáticos

- jobs
- expirar-pedidos

---

## Usuarios

- users

---

## Consultas

- get
- retiros

---

# Principios

Todas las APIs deberán:

- Validar autenticación.
- Validar permisos.
- Ejecutar reglas del negocio.
- Registrar eventos cuando corresponda.
- Devolver respuestas consistentes.

---

# Evolución

La arquitectura objetivo contempla separar las APIs por dominio.

Sin embargo, la estructura actual permanecerá estable hasta planificar un refactor controlado.

### jobs/cancelar-vencidos

`GET /api/orders/jobs/cancelar-vencidos`

- Protegido con `CRON_SECRET`.
- Busca pedidos vencidos (>24h).
- Ejecuta `cancel_order_automatic`.
- Envía correos al cliente y al vendedor.
- Devuelve un resumen de la ejecución.
