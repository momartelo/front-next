"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "./Card";

export default function CACSelector({ cacHistorico, ultimoCAC }) {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [baseAmount, setBaseAmount] = useState("");
  const [indice, setIndice] = useState("general"); // 👈 nuevo

  const availablePeriods = useMemo(() => {
    return cacHistorico.map((item) => {
      const date = new Date(item.period);
      return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth(),
      };
    });
  }, [cacHistorico]);

  const years = [...new Set(availablePeriods.map((p) => p.year))].sort(
    (a, b) => b - a
  );

  const months = availablePeriods
    .filter((p) => p.year === selectedYear)
    .map((p) => p.month)
    .sort((a, b) => b - a);

  const selectedCAC = useMemo(() => {
    if (selectedYear === null || selectedMonth === null) return null;

    return cacHistorico.find((item) => {
      const date = new Date(item.period);
      return (
        date.getUTCFullYear() === selectedYear &&
        date.getUTCMonth() === selectedMonth
      );
    });
  }, [selectedYear, selectedMonth, cacHistorico]);

  const updatedAmount = useMemo(() => {
    if (!selectedCAC || !ultimoCAC || !baseAmount) return null;

    const base = Number(baseAmount);
    if (isNaN(base) || base <= 0) return null;

    return (base / selectedCAC[indice]) * ultimoCAC[indice];
  }, [baseAmount, selectedCAC, ultimoCAC, indice]);

  const formatNumber = (value) =>
    Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  useEffect(() => {
    if (selectedCAC) {
      setIndice("general");
    }
  }, [selectedCAC]);

  return (
    <Card title="Índice CAC por período">
      <div className="space-y-4 mt-2">
        {/* SELECTORES AÑO / MES */}
        <div className="flex gap-4">
          <select
            className="w-full border rounded p-2 bg-white"
            value={selectedYear ?? ""}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setSelectedMonth(null);
            }}
          >
            <option value="">Seleccionar año</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            className="w-full border rounded p-2 bg-white"
            value={selectedMonth ?? ""}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            disabled={!selectedYear}
          >
            <option value="" title="Elegí primero el mes">
              Seleccionar mes
            </option>
            {months.map((month) => (
              <option
                key={month}
                value={month}
                title={`Mes ${new Date(2000, month).toLocaleString("es-AR", {
                  month: "long",
                })}`}
              >
                {new Date(2000, month).toLocaleString("es-AR", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        </div>

        {selectedCAC ? (
          <div className="pt-3 border-t space-y-3">
            {/* ÍNDICE PRINCIPAL */}
            <p className="text-3xl font-bold text-blue-600 text-center">
              {formatNumber(selectedCAC[indice])}
            </p>

            {/* OTROS ÍNDICES */}
            <div className="flex justify-center gap-6 text-sm text-gray-500">
              {indice !== "general" && (
                <span>General: {formatNumber(selectedCAC.general)}</span>
              )}
              {indice !== "materials" && (
                <span>Materiales: {formatNumber(selectedCAC.materials)}</span>
              )}
              {indice !== "labour_force" && (
                <span>
                  Mano de obra: {formatNumber(selectedCAC.labour_force)}
                </span>
              )}
            </div>

            {/* SELECTOR DE ÍNDICE */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tipo de índice
              </label>
              <select
                className="w-full border rounded p-2 bg-white"
                value={indice}
                onChange={(e) => setIndice(e.target.value)}
              >
                <option value="general">General</option>
                <option value="materials">Materiales</option>
                <option value="labour_force">Mano de obra</option>
              </select>
            </div>

            {/* MONTO BASE */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Monto a actualizar
              </label>
              <input
                type="number"
                placeholder="Ej: 100000"
                className="w-full border rounded p-2"
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value)}
              />
            </div>

            {/* RESULTADO */}
            {updatedAmount && (
              <div className="pt-2 text-center">
                <p className="text-sm text-gray-500">
                  Monto actualizado por CAC actual
                </p>
                <p className="text-xl font-semibold text-green-600">
                  ${formatNumber(updatedAmount)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm pt-2">
            Seleccioná un año y luego el mes
          </p>
        )}
      </div>
    </Card>
  );
}
