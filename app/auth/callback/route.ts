import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${url.origin}/login`);
  }

  // verificar si existe profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // si no existe profile → crearlo
  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
    });

    return NextResponse.redirect(`${url.origin}/onboarding`);
  }

  // redirigir según rol
  if (profile.role === "vendor") {
    return NextResponse.redirect(`${url.origin}/vendedor/dashboard`);
  }

  if (profile.role === "establishment") {
    return NextResponse.redirect(`${url.origin}/establecimiento`);
  }

  if (profile.role === "buyer") {
    return NextResponse.redirect(`${url.origin}/comprador`);
  }

  return NextResponse.redirect(`${url.origin}/`);
}