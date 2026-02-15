"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function RegisterVendedor() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function handleRegister() {
    setMensaje("");

    if (password !== confirm) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "vendor" }, // ← Manda el rol dinámico
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    console.log("DATA SIGNUP:", data);

    if (error) {
      setMensaje("Hubo un error al registrarte: " + error.message);
      return;
    }

    router.push("/login?msg=verifica");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-md">

        <h1 className="text-3xl font-bold text-center mb-6 text-primary">
          Registrar vendedor
        </h1>

        <Input
          placeholder="Correo"
          type="email"
          className="mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          placeholder="Contraseña"
          type="password"
          className="mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Input
          placeholder="Confirmar contraseña"
          type="password"
          className="mb-4"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <Button className="w-full" onClick={handleRegister}>
          Registrarme
        </Button>

        {mensaje && <p className="text-red-500 text-center mt-4">{mensaje}</p>}
      </div>
    </div>
  );
}
