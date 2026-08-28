import { createClient } from "@supabase/supabase-js";

export type OrderServiceValue = {
  coinTipo: "small" | "medium";

  precioUnitario: number;
  descuentoPorcentaje: number;

  importeServicio: number;

  origen:
    | "purchase"
    | "admin_promo";
};

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function roundMoney(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

function getPrecioNominal(
  coinTipo: string
) {
  if (coinTipo === "small") {
    return 60;
  }

  if (coinTipo === "medium") {
    return 90;
  }

  throw new Error(
    "ORDER_COIN_TYPE_NOT_SUPPORTED"
  );
}

export async function getOrderServiceValue(
  pedidoId: number
): Promise<OrderServiceValue> {
  if (!pedidoId) {
    throw new Error(
      "PEDIDO_ID_REQUIRED"
    );
  }

  const supabase =
    getAdminClient();

  // =====================================================
  // 1. Encontrar Coin consumida por el pedido
  // =====================================================

  const {
    data: movimiento,
    error: movimientoError,
  } = await supabase
    .from("coin_movimientos")
    .select(`
      id,
      lote_id,
      coin_tipo,
      referencia
    `)
    .eq("tipo", "uso")
    .eq(
      "referencia",
      `pedido:${pedidoId}`
    )
    .limit(1)
    .maybeSingle();

  if (movimientoError) {
    console.error(
      "Error obteniendo movimiento Coin:",
      movimientoError
    );

    throw new Error(
      "ORDER_COIN_MOVEMENT_QUERY_ERROR"
    );
  }

  if (
    !movimiento ||
    !movimiento.lote_id
  ) {
    throw new Error(
      "ORDER_COIN_MOVEMENT_NOT_FOUND"
    );
  }

  // =====================================================
  // 2. Obtener lote original
  // =====================================================

  const {
    data: lote,
    error: loteError,
  } = await supabase
    .from("coin_lotes")
    .select(`
      id,
      tipo,
      precio_unitario,
      descuento_porcentaje,
      pago_id
    `)
    .eq(
      "id",
      movimiento.lote_id
    )
    .single();

  if (
    loteError ||
    !lote
  ) {
    console.error(
      "Error obteniendo lote Coin:",
      loteError
    );

    throw new Error(
      "ORDER_COIN_LOT_NOT_FOUND"
    );
  }

  const coinTipo =
    String(lote.tipo);

  if (
    coinTipo !== "small" &&
    coinTipo !== "medium"
  ) {
    throw new Error(
      "ORDER_COIN_TYPE_NOT_SUPPORTED"
    );
  }

  const precioUnitario =
    Number(
      lote.precio_unitario
    );

  const descuentoPorcentaje =
    Number(
      lote.descuento_porcentaje || 0
    );

  // =====================================================
  // 3. Coin comprada
  // =====================================================

  if (lote.pago_id) {
    if (
      !Number.isFinite(
        precioUnitario
      ) ||
      precioUnitario <= 0
    ) {
      throw new Error(
        "ORDER_COIN_PRICE_INVALID"
      );
    }

    if (
      !Number.isFinite(
        descuentoPorcentaje
      ) ||
      descuentoPorcentaje < 0 ||
      descuentoPorcentaje > 100
    ) {
      throw new Error(
        "ORDER_COIN_DISCOUNT_INVALID"
      );
    }

    const importeServicio =
      roundMoney(
        precioUnitario *
          (
            1 -
            descuentoPorcentaje /
              100
          )
      );

    return {
      coinTipo,

      precioUnitario,

      descuentoPorcentaje,

      importeServicio,

      origen:
        "purchase",
    };
  }

  // =====================================================
  // 4. Coin promocional / asignada por Dropit
  // =====================================================
  //
  // admin_grant_coins crea:
  //
  // precio_unitario = 0
  // descuento_porcentaje = 100
  // pago_id = null
  //
  // Dropit absorbe esta promoción y al
  // establecimiento se le reconoce la tarifa nominal.
  // =====================================================

  if (
    precioUnitario === 0 &&
    descuentoPorcentaje ===
      100
  ) {
    const importeServicio =
      getPrecioNominal(
        coinTipo
      );

    return {
      coinTipo,

      precioUnitario,

      descuentoPorcentaje,

      importeServicio,

      origen:
        "admin_promo",
    };
  }

  // =====================================================
  // 5. Lotes históricos sin trazabilidad
  // =====================================================
  //
  // No inventamos el valor financiero.
  // Estos lotes se resolverán con la limpieza de QA.
  // =====================================================

  throw new Error(
    "ORDER_SERVICE_VALUE_TRACE_NOT_AVAILABLE"
  );
}