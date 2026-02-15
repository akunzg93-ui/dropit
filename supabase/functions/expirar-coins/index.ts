// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase.rpc("expirar_coins_vencidas");

  if (error) {
    console.error("❌ Error expirando coins:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500 }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: "Coins expiradas correctamente",
    }),
    { status: 200 }
  );
});
