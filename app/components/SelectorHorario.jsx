"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const HORARIOS_PREDEFINIDOS = [
  "08:00 – 17:00",
  "09:00 – 18:00",
  "10:00 – 19:00",
  "11:00 – 20:00",
  "12:00 – 21:00",
  "24 horas",
];

export default function SelectorHorario({ value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        Horario de atención (opcional)
      </label>

      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un horario" />
        </SelectTrigger>

        <SelectContent>
          {HORARIOS_PREDEFINIDOS.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-xs text-gray-500">
        Este horario será visible para los compradores
      </p>
    </div>
  );
}
