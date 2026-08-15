import { createClient } from "@supabase/supabase-js";

export type OrderPaymentData = {
  formaPago: string;
  metodoPago: "PUE";

  pagoId: string;
  paymentIntentId?: string;

  paymentMethodType?: string;
  cardFunding?: string;
  cardBrand?: string;
  cardLast4?: string;
};

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getOrderPaymentData(
  pedidoId: number
): Promise<OrderPaymentData> {
  if (!pedidoId) {
    throw new Error("PEDIDO_ID_REQUIRED");
  }

  const supabase = getAdminClient();

  // --------------------------------------------------
  // 1. Encontrar el movimiento que consumió la Coin
  // --------------------------------------------------

  const {
    data: movimiento,
    error: movimientoError,
  } = await supabase
    .from("coin_movimientos")
    .select(`
      id,
      lote_id,
      referencia
    `)
    .eq("tipo", "uso")
    .eq("referencia", `pedido:${pedidoId}`)
    .limit(1)
    .maybeSingle();

  if (movimientoError) {
    console.error(
      "Error obteniendo movimiento de Coin:",
      movimientoError
    );

    throw new Error(
      "ORDER_COIN_MOVEMENT_QUERY_ERROR"
    );
  }

  if (!movimiento?.lote_id) {
    throw new Error(
      "ORDER_COIN_MOVEMENT_NOT_FOUND"
    );
  }

  // --------------------------------------------------
  // 2. Obtener el lote que originó esa Coin
  // --------------------------------------------------

  const {
    data: lote,
    error: loteError,
  } = await supabase
    .from("coin_lotes")
    .select(`
      id,
      pago_id
    `)
    .eq("id", movimiento.lote_id)
    .single();

  if (loteError || !lote) {
    console.error(
      "Error obteniendo lote de Coin:",
      loteError
    );

    throw new Error(
      "ORDER_COIN_LOT_NOT_FOUND"
    );
  }

  /*
    Los lotes históricos anteriores al nuevo
    flujo Stripe pueden tener pago_id = null.

    No intentamos inventar una forma de pago.
  */
  if (!lote.pago_id) {
    throw new Error(
      "ORDER_PAYMENT_TRACE_NOT_AVAILABLE"
    );
  }

  // --------------------------------------------------
  // 3. Obtener el pago real de Stripe
  // --------------------------------------------------

  const {
    data: pago,
    error: pagoError,
  } = await supabase
    .from("pagos")
    .select(`
      id,
      status,
      stripe_payment_intent_id,
      payment_method_type,
      card_funding,
      card_brand,
      card_last4,
      forma_pago_sat
    `)
    .eq("id", lote.pago_id)
    .single();

  if (pagoError || !pago) {
    console.error(
      "Error obteniendo pago de Coin:",
      pagoError
    );

    throw new Error(
      "ORDER_PAYMENT_NOT_FOUND"
    );
  }

  if (pago.status !== "paid") {
    throw new Error(
      "ORDER_PAYMENT_NOT_PAID"
    );
  }

  if (!pago.forma_pago_sat) {
    throw new Error(
      "ORDER_PAYMENT_SAT_METHOD_MISSING"
    );
  }

  // --------------------------------------------------
  // 4. Resultado para CFDI
  // --------------------------------------------------

  return {
    formaPago: pago.forma_pago_sat,

    /*
      El servicio ya fue pagado mediante
      la compra previa de la Coin.
    */
    metodoPago: "PUE",

    pagoId: pago.id,

    paymentIntentId:
      pago.stripe_payment_intent_id || undefined,

    paymentMethodType:
      pago.payment_method_type || undefined,

    cardFunding:
      pago.card_funding || undefined,

    cardBrand:
      pago.card_brand || undefined,

    cardLast4:
      pago.card_last4 || undefined,
  };
}