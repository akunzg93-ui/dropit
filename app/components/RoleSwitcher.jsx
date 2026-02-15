"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// 🔑 ROLES OFICIALES DEL SISTEMA (INGLÉS)
const ROLES = [
  { value: "buyer", label: "Comprador" },
  { value: "vendor", label: "Vendedor" },
  { value: "establishment", label: "Establecimiento" },
  { value: "admin", label: "Admin" },
];

export default function RoleSwitcher() {
  const [role, setRole] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [folio, setFolio] = useState("");

  const router = useRouter();

  useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, debug")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
      setLoading(false);
      return;
    }

    // 🔓 Solo permitir switch en modo debug
    if (profile?.debug) {
      setAllowed(true);
      setRole(profile.role);
    }

    setLoading(false);
  }

  async function cambiarRol(nuevoRol) {
    // 🧹 Limpiar pedido activo al cambiar de rol
    sessionStorage.removeItem("pedido_id");

    setRole(nuevoRol);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: nuevoRol })
      .eq("id", user.id);

    if (error) {
      console.error("Error changing role:", error);
      return;
    }

    // 🔄 Recargar para que navbar, guards y rutas reaccionen
    window.location.reload();
  }

  function irATracking() {
    if (!folio) return;
    router.push(`/track/${folio}`);
  }

  if (loading || !allowed) return null;

  return (
    <div className="flex items-center gap-3 rounded-md border border-yellow-300 bg-yellow-100 px-3 py-2">
      <span className="text-xs font-semibold text-yellow-800">
        DEV
      </span>

      {/* SWITCH DE ROL */}
      <Select value={role ?? undefined} onValueChange={cambiarRol}>
        <SelectTrigger className="h-7 w-[140px] text-xs">
          <SelectValue placeholder="Change role" />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* TRACKING RÁPIDO */}
      <div className="flex items-center gap-1">
        <Input
          placeholder="EW-XXXXXXX"
          value={folio}
          onChange={(e) => setFolio(e.target.value)}
          className="h-7 w-[140px] text-xs"
        />
        <Button
          onClick={irATracking}
          className="h-7 px-2 text-xs"
          variant="secondary"
        >
          Track
        </Button>
      </div>
    </div>
  );
}
