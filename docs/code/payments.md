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

Acreditación de Coins

↓

Creación de lotes

---

# Componentes

- CheckoutForm
- CoinBalanceCard

---

# APIs

- payments/create-intent
- coins/credit

---

# Tablas

- coin_lotes
- coin_movimientos

---

# Principios

Las Coins únicamente se acreditan después de confirmar el pago.

El consumo siempre sigue la política FIFO.

No existe devolución automática de Coins consumidas.