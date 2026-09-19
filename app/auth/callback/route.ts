import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const role = url.searchParams.get("role");

  const cookieStore = await cookies();

  const rolePermitido =
  role === "vendor" || role === "establishment" ? role : null;

const postLoginUrl = rolePermitido
  ? `${url.origin}/post-login?role=${rolePermitido}`
  : `${url.origin}/post-login`;

const response = NextResponse.redirect(postLoginUrl);

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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchangeCodeForSession:", error);
      return NextResponse.redirect(`${url.origin}/login?error=auth_callback`);
    }
  }

  return response;
}