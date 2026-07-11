# Módulo Vendedor

> Documento Oficial
>
> Versión: 1.0
>
> Estado: En construcción
>
> Última actualización: 11/07/2026

---

# Objetivo

El módulo Vendedor concentra todas las funcionalidades relacionadas con la creación y administración de pedidos.

Es el principal consumidor del sistema de Coins.

---

# Responsabilidades

- Crear pedidos.
- Administrar pedidos.
- Consultar estados.
- Comprar Coins.
- Verificar pedidos.
- Acceder al panel del vendedor.

---

# Pantallas

| Ruta | Responsabilidad |
|------|-----------------|
| /vendedor/dashboard | Panel principal |
| /vendedor/crear-pedido | Crear un nuevo pedido |
| /vendedor/pedidos | Administración de pedidos |
| /vendedor/estado | Consulta de estado |
| /vendedor/coins | Compra y consulta de Coins |
| /vendedor/verificar | Validación de pedidos |
| /vendedor/login | Inicio de sesión |
| /vendedor/register | Registro |

---

# APIs utilizadas

(Se documentarán conforme se revisen las pantallas.)

---

# Base de datos

Tablas principales:

- pedidos
- pedido_establecimientos
- coin_lotes
- coin_movimientos
- profiles

---

# Flujo principal

1. Crear pedido.
2. Consumir Coin.
3. Registrar establecimientos.
4. Esperar selección del cliente.
5. Entregar paquete al establecimiento.
6. Finalizar flujo.

---

# Componentes

Pendiente de documentar.

---

# Observaciones

El módulo Vendedor constituye el punto de inicio del flujo principal de Dropit.

---

# Pantalla: Crear Pedido

## Ruta

`/vendedor/crear-pedido`

## Responsabilidad

Representa el punto de entrada del flujo principal de Dropit.

Desde esta pantalla el vendedor:

- Crea un pedido.
- Consume una Coin.
- Selecciona los establecimientos candidatos.
- Opcionalmente protege el pedido.
- Envía la información inicial al sistema.

---

## Flujo

1. Capturar información del paquete.
2. Seleccionar tamaño.
3. Consultar Coins disponibles.
4. Cargar establecimientos compatibles.
5. Aplicar establecimientos predeterminados del vendedor.
6. Seleccionar establecimientos.
7. Aceptar declaración legal.
8. (Opcional) Contratar protección.
9. Crear pedido.
10. Consumir Coin.
11. Guardar establecimientos relacionados.
12. Guardar establecimientos predeterminados.
13. Enviar correo de confirmación.
14. Mostrar tarjeta para compartir.

---

## Tablas utilizadas

- pedidos
- pedido_establecimientos
- vendedor_establecimientos_default
- coin_lotes
- coin_movimientos
- pedido_protecciones
- establecimientos

---

## RPC utilizadas

- consume_coin_for_order

---

## APIs utilizadas

- /api/orders/proteccion/config
- /api/orders/email/pedido-creado

---

## Componentes principales

- MapaEstablecimientos
- SharePedidoCard
- StarsPromedio
- ProteccionCheckoutForm
- CoinBalanceCard

---

## Integraciones

- Supabase Auth
- Supabase Database
- Stripe Elements
- Leaflet (Mapa)
- Sistema de correo

---

## Observaciones

Esta pantalla concentra la mayor parte de la lógica del módulo Vendedor y constituye el inicio del flujo operativo de Dropit.

---

# Pantalla: Mis Pedidos

## Ruta

`/vendedor/pedidos`

## Responsabilidad

Centraliza la administración de todos los pedidos creados por el vendedor.

Permite consultar el historial, aplicar filtros, visualizar métricas y descargar la etiqueta del pedido. :contentReference[oaicite:0]{index=0}

---

## Funcionalidades

- Consulta de pedidos del vendedor autenticado.
- Búsqueda por folio y producto.
- Filtro por tamaño.
- Filtro por estado.
- Métricas del módulo.
- Descarga de etiqueta PDF.
- Visualización del detalle del pedido.
- Diseño responsive para móvil y escritorio. :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}

---

## Tablas utilizadas

- pedidos

---

## Componentes principales

- MetricCard
- EstadoBadge
- InfoBox
- Drawer
- EmptyState

---

# Pantalla: Coins

## Ruta

`/vendedor/coins`

## Responsabilidad

Administrar la compra de Coins utilizadas para crear pedidos.

Representa el punto de entrada del sistema de pagos de Dropit. :contentReference[oaicite:3]{index=3}

---

## Funcionalidades

- Consulta de saldo disponible.
- Compra individual.
- Compra por paquetes.
- Aplicación de cupones.
- Cálculo automático de descuentos.
- Pago mediante Stripe.
- Actualización del saldo.
- Redirección a Crear Pedido tras una compra exitosa. :contentReference[oaicite:4]{index=4} :contentReference[oaicite:5]{index=5}

---

## Tablas utilizadas

- coin_lotes

---

## Integraciones

- Stripe
- Supabase Auth
- CheckoutForm

---

## Flujo

1. Consultar saldo.
2. Seleccionar Coins.
3. Aplicar descuentos o cupones.
4. Procesar pago.
5. Acreditar Coins.
6. Redirigir al flujo de creación del pedido.