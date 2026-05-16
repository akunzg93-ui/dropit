import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient> | undefined;
};

export const supabase =
  globalForSupabase.supabase ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}

// Cliente ADMIN → solo server/API
export const supabaseAdmin = () =>
  createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE!
  );