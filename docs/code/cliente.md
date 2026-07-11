# Módulo Cliente

> Documento Oficial
>
> Versión: 1.0
>
> Estado: En construcción
>
> Última actualización: 11/07/2026

---

# Objetivo

El módulo Cliente concentra todas las funcionalidades relacionadas con la recepción del pedido.

El cliente selecciona el establecimiento donde desea recoger su paquete y consulta el estado de la entrega.

---

# Responsabilidades

- Registrarse.
- Seleccionar establecimiento.
- Dar seguimiento al pedido.
- Validar la entrega.
- Consultar el estado del pedido.

---

# Pantallas

| Ruta | Responsabilidad |
|------|-----------------|
| /comprador | Inicio del cliente |
| /comprador/register | Registro |
| /comprador/validar-pedido | Selección del establecimiento y validación |

---

# APIs utilizadas

Pendiente de documentar.

---

# Tablas principales

- pedidos
- establecimientos
- pedido_establecimientos

---

# Flujo principal

1. Abrir el enlace recibido.
2. Elegir establecimiento.
3. Confirmar selección.
4. Esperar notificación.
5. Acudir al establecimiento.
6. Recibir el pedido.

---

# Observaciones

El cliente únicamente interviene en dos momentos del flujo:

- Selección del establecimiento.
- Recolección del pedido.

---

# Pantalla: Selección del punto de entrega

## Ruta

`/comprador`

## Responsabilidad

Permite al cliente seleccionar el establecimiento donde desea recoger su pedido.

Es la única decisión logística que toma el cliente dentro del flujo de Dropit. :contentReference[oaicite:0]{index=0}

---

## Flujo

1. Recuperar el pedido desde la sesión.
2. Consultar los establecimientos disponibles.
3. Obtener la reputación del vendedor.
4. Mostrar establecimientos candidatos.
5. Ordenarlos por distancia.
6. Permitir filtrar por zona.
7. Confirmar el punto de entrega.
8. Redirigir al seguimiento del pedido. :contentReference[oaicite:1]{index=1}

---

## APIs utilizadas

- `POST /api/orders/users/get-vendedor`
- `POST /api/orders/confirmado`

---

## Tablas utilizadas

- pedidos
- pedido_establecimientos
- establecimientos
- ratings_resumen

---

## Componentes principales

- MapaEstablecimientos
- StarsPromedio
- FlowGuideModal
- Select (shadcn/ui)

---

## Integraciones

- Supabase Auth
- Supabase Database
- Leaflet

---

## Información mostrada

El cliente visualiza:

- Folio.
- Producto.
- Vendedor.
- Reputación del vendedor.
- Establecimientos disponibles.
- Reputación de cada establecimiento.
- Distancia aproximada.
- Horario.
- Zona. :contentReference[oaicite:2]{index=2}

---

## Resultado

Al confirmar:

- Se asigna el establecimiento al pedido.
- El pedido cambia al estado **en_transito**.
- Se notifica al vendedor.
- Se muestra la guía del siguiente paso.
- Se redirige al módulo de seguimiento (`/track`).