"use client";

import { Button } from "@/components/ui/button";
import { ReceiptText } from "lucide-react";
import FiscalProfileForm from "./FiscalProfileForm";
import FiscalProfileCard from "./FiscalProfileCard";

export default function BillingRequestModal({
  open,
  onClose,
  perfilesFiscales,
  perfilFiscalSeleccionado,
  setPerfilFiscalSeleccionado,
  modoPerfilFiscal,
  setModoPerfilFiscal,
  nuevoPerfilFiscal,
  setNuevoPerfilFiscal,
  errorFacturacion,
  guardandoPerfilFiscal,
  crearPerfilFiscal,
  solicitandoFactura,
  solicitarFactura,
}) {
  if (!open) return null;

  function cerrarModal() {
    onClose();
    setModoPerfilFiscal("lista");
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 px-5"
      onClick={cerrarModal}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
            Facturación
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#1e3a8a]">
            Solicitar factura
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Confirma los datos fiscales que deseas utilizar para esta
            solicitud.
          </p>
        </div>

        {errorFacturacion && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {errorFacturacion}
          </div>
        )}

        {modoPerfilFiscal === "crear" ? (
          <FiscalProfileForm
            nuevoPerfilFiscal={nuevoPerfilFiscal}
            setNuevoPerfilFiscal={setNuevoPerfilFiscal}
            guardandoPerfilFiscal={guardandoPerfilFiscal}
            crearPerfilFiscal={crearPerfilFiscal}
            onVolver={() => setModoPerfilFiscal("lista")}
          />
        ) : perfilesFiscales.length > 0 ? (
          <div className="space-y-3">
            {perfilesFiscales.map((perfil) => (
              <FiscalProfileCard
                key={perfil.id}
                perfil={perfil}
                seleccionado={
                  perfilFiscalSeleccionado === perfil.id
                }
                onSelect={() =>
                  setPerfilFiscalSeleccionado(perfil.id)
                }
              />
            ))}

            <Button
              variant="outline"
              className="h-11 w-full rounded-xl border-dashed border-blue-200 text-[#2563eb]"
              onClick={() => setModoPerfilFiscal("crear")}
            >
              + Nuevo perfil fiscal
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
            <ReceiptText
              size={28}
              className="mx-auto text-[#2563eb]"
            />

            <h3 className="mt-3 font-bold text-[#1e3a8a]">
              Registra tus datos fiscales
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Necesitas un perfil fiscal para solicitar tu primera
              factura.
            </p>

            <Button
              className="mt-4 h-11 rounded-xl bg-[#2563eb] text-white hover:bg-[#1e40af]"
              onClick={() => setModoPerfilFiscal("crear")}
            >
              Crear perfil fiscal
            </Button>
          </div>
        )}

        {perfilesFiscales.length > 0 &&
          modoPerfilFiscal !== "crear" && (
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-xl"
                onClick={cerrarModal}
              >
                Cancelar
              </Button>

              <Button
                disabled={
                  !perfilFiscalSeleccionado ||
                  solicitandoFactura
                }
                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-semibold text-white"
                onClick={solicitarFactura}
              >
                {solicitandoFactura
                  ? "Enviando..."
                  : "Continuar"}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}