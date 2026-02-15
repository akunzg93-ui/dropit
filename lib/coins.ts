// lib/coins.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente ADMIN (Service Role) -> SOLO para uso en SERVER (API routes).
 * IMPORTANTÍSIMO: NO uses NEXT_PUBLIC para la service key.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type CoinSize = "small" | "medium";

export async function getCoinTypeIdBySize(size: CoinSize) {
  const { data, error } = await supabaseAdmin
    .from("coin_types")
    .select("id")
    .eq("code", size)
    .single();

  if (error || !data) {
    throw new Error("Tipo de coin inválido o no existe en coin_types");
  }

  return data.id as string;
}

export async function getWalletBalance(params: {
  vendorId: string;
  coinTypeId: string;
}) {
  const { vendorId, coinTypeId } = params;

  const { data, error } = await supabaseAdmin
    .from("coin_wallets")
    .select("balance")
    .eq("vendor_id", vendorId)
    .eq("coin_type_id", coinTypeId)
    .maybeSingle();

  // si no existe wallet aún, balance=0
  if (error) {
    throw new Error("Error consultando wallet");
  }

  return data?.balance ?? 0;
}

export async function consumeCoin(params: {
  vendorId: string;
  size: CoinSize;
  orderId: string;
}) {
  const { vendorId, size, orderId } = params;

  const coinTypeId = await getCoinTypeIdBySize(size);
  const balance = await getWalletBalance({ vendorId, coinTypeId });

  if (balance < 1) {
    throw new Error(`Saldo insuficiente de coins ${size}`);
  }

  const { error: txError } = await supabaseAdmin
    .from("coin_transactions")
    .insert({
      vendor_id: vendorId,
      coin_type_id: coinTypeId,
      amount: -1,
      reason: "order_created",
      reference_id: orderId,
    });

  if (txError) {
    throw new Error("Error al descontar coin (insert coin_transactions)");
  }

  return { coinTypeId, newBalanceEstimated: balance - 1 };
}
