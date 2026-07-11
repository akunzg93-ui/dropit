# Módulo Establecimiento

> Documento Oficial
>
> Versión: 1.0
>
> Estado: En construcción
>
> Última actualización: 11/07/2026

---

# Objetivo

El módulo Establecimiento concentra toda la operación física de Dropit.

Es el responsable de recibir, custodiar y entregar los pedidos.

---

# Responsabilidades

- Aprobar pedidos.
- Recibir paquetes.
- Entregar pedidos.
- Consultar estados.
- Consultar balance.
- Registrar establecimientos.

---

# Pantallas

| Ruta | Responsabilidad |
|------|-----------------|
| /establecimiento | Dashboard principal |
| /establecimiento/aprobar | Aprobar o rechazar pedidos |
| /establecimiento/recibir-pedido | Recibir paquetes |
| /establecimiento/entregar | Entregar pedidos |
| /establecimiento/estado | Consultar estados |
| /establecimiento/balance | Balance del establecimiento |
| /establecimiento/register | Registro del establecimiento |

---

# APIs utilizadas

Pendiente de documentar.

---

# Tablas principales

- establecimientos
- pedidos
- pedido_eventos

---

# Flujo principal

1. Revisar solicitudes.
2. Aprobar o rechazar.
3. Recibir paquete.
4. Custodiar pedido.
5. Entregar al cliente.
6. Registrar evento.

---

# Observaciones

El establecimiento representa el nodo físico de la red Dropit.

Toda operación realizada desde este módulo modifica directamente el flujo del pedido.

---

# Pantalla: Aprobar pedido

## Ruta

`/establecimiento/aprobar/[id]`

## Responsabilidad

Permite al establecimiento revisar una solicitud y decidir si acepta o rechaza recibir el pedido.

---

## Flujo

1. Obtiene el pedido por `id`.
2. Muestra folio, estado y reputación del vendedor.
3. El establecimiento acepta o rechaza.
4. Si acepta, muestra una guía del siguiente paso.
5. Si rechaza, regresa al panel de estado.

---

## APIs utilizadas

- `POST /api/orders/aceptar-establecimiento`
- `POST /api/orders/rechazar-pedido`

---

## Tablas consultadas

- `pedidos`

---

## Componentes principales

- `StarsPromedio`
- `FlowGuideModal`

---

## Acciones

### Aceptar

Envía:

```json
{
  "pedido_id": "id del pedido"
}

---

# Pantalla: Recibir Pedido

## Ruta

`/establecimiento/recibir-pedido`

## Responsabilidad

Permite al establecimiento validar que el vendedor autorizado entrega el paquete correcto y registrar oficialmente su recepción.

Constituye la transición del pedido hacia la etapa de resguardo. :contentReference[oaicite:0]{index=0}

---

## Flujo

1. Escanear el QR del vendedor o capturar folio y código manual.
2. Consultar el resumen del pedido.
3. Verificar físicamente el paquete.
4. Confirmar la recepción.
5. Registrar la transición del pedido.
6. Notificar automáticamente al cliente.
7. Mostrar instrucciones de resguardo. :contentReference[oaicite:1]{index=1}

---

## APIs utilizadas

- `POST /api/orders/preview-vendedor`
- `POST /api/orders/recibido`

---

## Componentes externos

- Html5Qrcode

---

## Información mostrada

- Folio
- Producto
- Establecimiento asignado

---

## Validaciones

Antes de confirmar la recepción el sistema valida:

- Folio.
- Código del vendedor.
- Existencia del pedido.
- Autorización de recepción.

Si alguna validación falla, la recepción no se registra. :contentReference[oaicite:2]{index=2}

---

## Resultado

Al confirmar correctamente:

- El pedido cambia al estado **pendiente_recoleccion**.
- El cliente recibe una notificación.
- El establecimiento inicia el resguardo del paquete.

---

## Buenas prácticas

- Nunca recibir un paquete sin validación.
- Verificar que el paquete físico coincida con el folio.
- Mantener el paquete identificado y protegido durante el resguardo.

---

# Pantalla: Entregar Pedido

## Ruta

`/establecimiento/entregar`

## Responsabilidad

Permite validar la identidad del cliente y registrar la entrega final del pedido.

Representa la última transición del flujo operativo del establecimiento. :contentReference[oaicite:0]{index=0}

---

## Flujo

1. Escanear el QR del cliente o capturar folio y código de entrega.
2. Consultar el resumen del pedido.
3. Verificar que el cliente y el paquete correspondan.
4. Confirmar la entrega.
5. Registrar el pedido como entregado.
6. Solicitar una evaluación del vendedor. :contentReference[oaicite:1]{index=1}

---

## APIs utilizadas

- `POST /api/orders/preview`
- `POST /api/orders/entregado`
- `POST /api/orders/evaluaciones/create`

---

## Componentes externos

- Html5Qrcode

---

## Información mostrada

- Folio
- Producto
- Establecimiento asignado

---

## Validaciones

Antes de entregar el sistema valida:

- Folio.
- Código de entrega.
- Existencia del pedido.
- Autorización de entrega.

Si alguna validación falla, la entrega no se registra. :contentReference[oaicite:2]{index=2}

---

## Resultado

Al confirmar correctamente:

- El pedido cambia al estado **entregado**.
- Se registra el cierre del flujo.
- El establecimiento puede evaluar al vendedor.

---

## Evaluaciones

Después de la entrega el establecimiento puede:

- Calificar de 1 a 5 estrellas.
- Seleccionar etiquetas rápidas.
- Agregar un comentario opcional.

La evaluación se registra como:

- Evaluador: Establecimiento.
- Evaluado: Vendedor. :contentReference[oaicite:3]{index=3}

---

## Buenas prácticas

- Nunca entregar un paquete sin validar el código de entrega.
- Confirmar que el paquete físico corresponda al folio mostrado.
- Registrar la evaluación únicamente después de finalizar la entrega.

---

# Pantalla: Recibir Pedido

## Ruta

`/establecimiento/recibir-pedido`

## Responsabilidad

Permite al establecimiento validar que el vendedor autorizado entrega el paquete correcto y registrar oficialmente su recepción.

Constituye la transición del pedido hacia la etapa de resguardo. :contentReference[oaicite:0]{index=0}

---

## Flujo

1. Escanear el QR del vendedor o capturar folio y código manual.
2. Consultar el resumen del pedido.
3. Verificar físicamente el paquete.
4. Confirmar la recepción.
5. Registrar la transición del pedido.
6. Notificar automáticamente al cliente.
7. Mostrar instrucciones de resguardo. :contentReference[oaicite:1]{index=1}

---

## APIs utilizadas

- `POST /api/orders/preview-vendedor`
- `POST /api/orders/recibido`

---

## Componentes externos

- Html5Qrcode

---

## Información mostrada

- Folio
- Producto
- Establecimiento asignado

---

## Validaciones

Antes de confirmar la recepción el sistema valida:

- Folio.
- Código del vendedor.
- Existencia del pedido.
- Autorización de recepción.

Si alguna validación falla, la recepción no se registra. :contentReference[oaicite:2]{index=2}

---

## Resultado

Al confirmar correctamente:

- El pedido cambia al estado **pendiente_recoleccion**.
- El cliente recibe una notificación.
- El establecimiento inicia el resguardo del paquete.

---

## Buenas prácticas

- Nunca recibir un paquete sin validación.
- Verificar que el paquete físico coincida con el folio.
- Mantener el paquete identificado y protegido durante el resguardo.