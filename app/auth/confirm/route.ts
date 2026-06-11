import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${url.origin}/reset-password?error=missing_token`
    );
  }

  const cookieStore = await cookies();

  const redirectTo =
    type === "recovery"
      ? `${url.origin}/update-password`
      : `${url.origin}/post-login`;

  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          response.cookies.set(name, "", options);
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as any,
  });

  if (error) {
    console.error("Error verificando token:", error);
    return NextResponse.redirect(
      `${url.origin}/reset-password?error=invalid_token`
    );
  }

  return response;
}