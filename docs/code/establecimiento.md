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