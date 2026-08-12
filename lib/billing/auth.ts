import { createClient } from "@supabase/supabase-js";

export async function getBillingUser(req: Request) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const accessToken = authorization.slice(7);

  if (!accessToken) {
    throw new Error("UNAUTHORIZED");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}