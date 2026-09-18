# Sistema de Pagos

> Documento Oficial

---

# Objetivo

Administrar la compra de Coins y los pagos asociados.

---

# Proveedor

Stripe

---

# Flujo

Vendedor

↓

Selecciona Coins

↓

Payment Intent

↓

Stripe

↓

Pago exitoso

↓

`payment_intent.succeeded`

↓

`/api/orders/stripe/webhook`

↓

`acreditar_compra_stripe`

↓

Creación idempotente de lotes y movimientos

---

# Componentes

- CheckoutForm
- CoinBalanceCard

---

# APIs

- `payments/create-intent`
- `stripe/webhook`

---

# Tablas

- coin_lotes
- coin_movimientos

---

# Principios

Las Coins únicamente se acreditan después de que Stripe confirma el pago.

La acreditación se ejecuta server-side mediante webhook y RPC transaccional/idempotente; un reintento del mismo pago no debe duplicar lotes ni movimientos.

En desarrollo local, Stripe CLI debe reenviar los eventos a `localhost` para ejecutar el webhook.

El consumo siempre sigue la política FIFO. Las cancelaciones autorizadas pueden reintegrar la Coin al lote original conforme a las reglas del pedido.