import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useCoins() {
  const [coins, setCoins] = useState({
    small: 0,
    medium: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------
  // 🔹 Cargar coins desde backend
  // -----------------------------------------------------
  const fetchCoins = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("coin_wallets")
        .select(
          `
          balance,
          coin_types (
            code
          )
        `
        );

      if (error) {
        console.error(error);
        setError("No se pudieron cargar los coins");
        setLoading(false);
        return;
      }

      const result = {
        small: 0,
        medium: 0,
      };

      data.forEach((row: any) => {
        if (row.coin_types?.code === "small") {
          result.small = row.balance;
        }
        if (row.coin_types?.code === "medium") {
          result.medium = row.balance;
        }
      });

      setCoins(result);
    } catch (e) {
      console.error(e);
      setError("Error inesperado cargando coins");
    } finally {
      setLoading(false);
    }
  }, []);

  // -----------------------------------------------------
  // 🔹 Cargar coins al montar
  // -----------------------------------------------------
  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  // -----------------------------------------------------
  // 🔹 API pública del hook
  // -----------------------------------------------------
  return {
    coins,
    loading,
    error,
    refreshCoins: fetchCoins, // 👈 ESTO ERA LO QUE FALTABA
  };
}
