"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "./Card";

export default function CACSelector({ cacHistorico, ultimoCAC }) {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [indice, setIndice] = useState("general");

  // Estado para el cálculo (número puro) y estado para la vista (formateado)
  const [baseAmount, setBaseAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");

  const handleInputChange = (e) => {
    const rawValue = e.target.value;

    // 1. Limpiamos el valor para procesarlo: quitamos puntos de miles y pasamos coma a punto decimal
    let cleanValue = rawValue.replace(/\./g, "").replace(/,/g, ".");

    // Validamos que sea un número (permitiendo el punto decimal)
    const parts = cleanValue.split(".");
    if (parts.length > 2) return; // Evita múltiples puntos decimales

    // Actualizamos el valor numérico para los cálculos
    setBaseAmount(cleanValue);

    // 2. Formateamos para la vista del usuario
    if (cleanValue === "") {
      setDisplayAmount("");
      return;
    }

    const [integerPart, decimalPart] = cleanValue.split(".");
    const formattedInteger = Number(integerPart).toLocaleString("es-AR");

    // Si el usuario escribió una coma, la mantenemos en el string de visualización
    const finalDisplay =
      decimalPart !== undefined
        ? `${formattedInteger},${decimalPart}`
        : formattedInteger;

    setDisplayAmount(finalDisplay);
  };

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
    if (!selectedCAC || !ultimoCAC || !baseAmount || baseAmount === ".")
      return null;

    const base = parseFloat(baseAmount);
    if (isNaN(base) || base <= 0) return null;

    // Aquí usamos el 'indice' seleccionado por el usuario dinámicamente
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

  const inputClassName =
    "w-full border border-gray-300 rounded p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <Card title="Índice CAC por período">
      <div className="space-y-4 mt-2">
        {/* SELECTORES AÑO / MES */}
        <div className="flex gap-4">
          <select
            className={inputClassName}
            value={selectedYear ?? ""}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setSelectedMonth(null);
            }}
          >
            <option value="" className="text-gray-900">
              Año
            </option>
            {years.map((year) => (
              <option key={year} value={year} className="text-gray-900">
                {year}
              </option>
            ))}
          </select>

          <select
            className={inputClassName}
            value={selectedMonth ?? ""}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            disabled={!selectedYear}
          >
            <option value="" className="text-gray-900">
              Mes
            </option>
            {months.map((month) => (
              <option key={month} value={month} className="text-gray-900">
                {new Date(2000, month).toLocaleString("es-AR", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        </div>

        {selectedCAC ? (
          <div className="pt-2 border-t border-gray-200 space-y-2">
            {/* ÍNDICE PRINCIPAL */}
            <p className="flex justify-center gap-6 text-sm text-gray-500">
              {indice == "general" && (
                <span className="flex justify-center text-gray-500">
                  General
                </span>
              )}
              {indice == "materials" && (
                <span className="flex justify-center text-gray-500">
                  Materiales
                </span>
              )}
              {indice == "labour_force" && (
                <span className="flex justify-center text-gray-500">
                  Mano de Obra
                </span>
              )}
            </p>
            <p className="text-3xl font-bold text-blue-600 text-center">
              {formatNumber(selectedCAC[indice])}
            </p>

            {/* OTROS ÍNDICES (Mini badges) */}
            <div className="flex justify-center gap-6 text-sm text-gray-500">
              {indice !== "general" && (
                <span>General: {formatNumber(selectedCAC.general)}</span>
              )}
              {indice !== "materials" && (
                <span>Materiales: {formatNumber(selectedCAC.materials)}</span>
              )}
              {indice !== "labour_force" && (
                <span>
                  Mano de Obra: {formatNumber(selectedCAC.labour_force)}
                </span>
              )}
            </div>

            {/* SELECTOR DE ÍNDICE (Manteniendo tu funcionalidad original) */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Tipo de índice
              </label>
              <select
                className={inputClassName}
                value={indice}
                onChange={(e) => setIndice(e.target.value)}
              >
                <option value="general">General</option>
                <option value="materials">Materiales</option>
                <option value="labour_force">Mano de obra</option>
              </select>
            </div>

            {/* MONTO BASE (Con formateo de miles y decimales) */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Monto a actualizar
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-700 pointer-events-none">
                  $
                </span>

                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className={`${inputClassName} pl-8`}
                  value={displayAmount}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* RESULTADO */}
            {updatedAmount && (
              <div className="pt-2 text-center bg-green-50 rounded-lg py-3 border border-green-100">
                <p className="text-xs text-green-700 font-medium uppercase tracking-wider">
                  Monto actualizado
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ${formatNumber(updatedAmount)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm pt-2 text-center italic">
            Seleccioná un año y luego un mes
          </p>
        )}
      </div>
    </Card>
  );
}
