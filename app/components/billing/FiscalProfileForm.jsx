"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  REGIMENES_FISCALES,
  USOS_CFDI,
} from "./billingConstants";

export default function FiscalProfileForm({
  nuevoPerfilFiscal,
  setNuevoPerfilFiscal,
  guardandoPerfilFiscal,
  crearPerfilFiscal,
  onVolver,
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-700">
          Nombre del perfil
        </p>

        <Input
          className="mt-2 h-11 rounded-xl"
          placeholder="Ej. Empresa principal"
          value={nuevoPerfilFiscal.nombre_perfil}
          onChange={(event) =>
            setNuevoPerfilFiscal({
              ...nuevoPerfilFiscal,
              nombre_perfil: event.target.value,
            })
          }
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">
          RFC
        </p>

        <Input
          className="mt-2 h-11 rounded-xl uppercase"
          placeholder="RFC"
          maxLength={13}
          value={nuevoPerfilFiscal.rfc}
          onChange={(event) =>
            setNuevoPerfilFiscal({
              ...nuevoPerfilFiscal,
              rfc: event.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9Ñ&]/g, ""),
            })
          }
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">
          Nombre o razón social
        </p>

        <Input
          className="mt-2 h-11 rounded-xl"
          placeholder="Razón social"
          value={nuevoPerfilFiscal.razon_social}
          onChange={(event) =>
            setNuevoPerfilFiscal({
              ...nuevoPerfilFiscal,
              razon_social: event.target.value,
            })
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Código postal fiscal
          </p>

          <Input
            className="mt-2 h-11 rounded-xl"
            placeholder="00000"
            maxLength={5}
            inputMode="numeric"
            value={nuevoPerfilFiscal.codigo_postal}
            onChange={(event) =>
              setNuevoPerfilFiscal({
                ...nuevoPerfilFiscal,
                codigo_postal: event.target.value.replace(/\D/g, ""),
              })
            }
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700">
            Correo
          </p>

          <Input
            type="email"
            className="mt-2 h-11 rounded-xl"
            placeholder="correo@empresa.com"
            value={nuevoPerfilFiscal.email}
            onChange={(event) =>
              setNuevoPerfilFiscal({
                ...nuevoPerfilFiscal,
                email: event.target.value,
              })
            }
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">
          Régimen fiscal
        </p>

        <Select
          value={nuevoPerfilFiscal.regimen_fiscal}
          onValueChange={(value) =>
            setNuevoPerfilFiscal({
              ...nuevoPerfilFiscal,
              regimen_fiscal: value,
            })
          }
        >
          <SelectTrigger className="mt-2 h-11 rounded-xl">
            <SelectValue placeholder="Selecciona un régimen fiscal" />
          </SelectTrigger>

          <SelectContent className="z-[130]">
            {REGIMENES_FISCALES.map((regimen) => (
              <SelectItem
                key={regimen.value}
                value={regimen.value}
              >
                {regimen.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">
          Uso del CFDI
        </p>

        <Select
          value={nuevoPerfilFiscal.uso_cfdi}
          onValueChange={(value) =>
            setNuevoPerfilFiscal({
              ...nuevoPerfilFiscal,
              uso_cfdi: value,
            })
          }
        >
          <SelectTrigger className="mt-2 h-11 rounded-xl">
            <SelectValue placeholder="Selecciona el uso del CFDI" />
          </SelectTrigger>

          <SelectContent className="z-[130]">
            {USOS_CFDI.map((uso) => (
              <SelectItem
                key={uso.value}
                value={uso.value}
              >
                {uso.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-xl"
          onClick={onVolver}
        >
          Volver
        </Button>

        <Button
          disabled={guardandoPerfilFiscal}
          className="h-12 flex-1 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-semibold text-white"
          onClick={crearPerfilFiscal}
        >
          {guardandoPerfilFiscal
            ? "Guardando..."
            : "Guardar perfil"}
        </Button>
      </div>
    </div>
  );
}