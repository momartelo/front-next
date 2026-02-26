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

  /* ===============================
     INPUT MONTO (coma / punto OK)
     =============================== */
  const handleInputChange = (e) => {
    let value = e.target.value;

    // Nos quedamos solo con números, puntos y comas
    value = value.replace(/[^0-9.,]/g, "");

    const lastChar = value[value.length - 1];
    const hasDecimalIntent = lastChar === "." || lastChar === ",";

    // Normalizamos para cálculo
    let cleanValue = value.replace(/\./g, "").replace(/,/g, ".");

    const parts = cleanValue.split(".");
    if (parts.length > 2) return;

    setBaseAmount(cleanValue);

    if (!cleanValue) {
      setDisplayAmount("");
      return;
    }

    const [integerPart, decimalPart] = cleanValue.split(".");
    const formattedInteger = Number(integerPart).toLocaleString("es-AR");

    let display = formattedInteger;

    if (decimalPart !== undefined) {
      display += `,${decimalPart}`;
    } else if (hasDecimalIntent) {
      display += ",";
    }

    setDisplayAmount(display);
  };

  /* ===============================
     PERIODOS DISPONIBLES
     =============================== */
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
    (a, b) => b - a,
  );

  const months = availablePeriods
    .filter((p) => p.year === selectedYear)
    .map((p) => p.month)
    .sort((a, b) => b - a);

  /* ===============================
     CAC SELECCIONADO
     =============================== */
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

  /* ===============================
     MONTO ACTUALIZADO
     =============================== */
  const updatedAmount = useMemo(() => {
    if (!selectedCAC || !ultimoCAC || !baseAmount || baseAmount === ".")
      return null;

    const base = parseFloat(baseAmount);
    if (isNaN(base) || base <= 0) return null;

    return (base / selectedCAC[indice]) * ultimoCAC[indice];
  }, [baseAmount, selectedCAC, ultimoCAC, indice]);

  /* ===============================
   VARIACIÓN vs ÚLTIMO CAC
   =============================== */
  const variacion = useMemo(() => {
    if (!selectedCAC || !ultimoCAC) return null;

    const seleccionado = selectedCAC[indice];
    const ultimo = ultimoCAC[indice];

    if (!seleccionado || !ultimo) return null;

    return ((seleccionado - ultimo) / ultimo) * 100;
  }, [selectedCAC, ultimoCAC, indice]);

  const renderVariacion = (valor) => {
    if (valor === null) return null;

    return (
      <span
        className={`flex items-center justify-center gap-1 mt-1 text-sm font-semibold ${
          valor > 0
            ? "text-red-600"
            : valor < 0
              ? "text-green-600"
              : "text-gray-500"
        }`}
      >
        {valor > 0 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 4l6 8h-4v8h-4v-8H6z" />
          </svg>
        )}
        {valor < 0 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 20l-6-8h4V4h4v8h4z" />
          </svg>
        )}
        {valor === 0 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="5" />
          </svg>
        )}
        {Math.abs(valor).toFixed(2)}%
        <span className="text-xs font-normal text-gray-500">vs actual</span>
      </span>
    );
  };

  const formatNumber = (value) =>
    Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  /* ===============================
     DEFAULT: ÚLTIMO PERÍODO CAC
     =============================== */
  useEffect(() => {
    if (!cacHistorico?.length) return;

    const ultimo = cacHistorico.at(-1);
    const date = new Date(ultimo.period);

    setSelectedYear(date.getUTCFullYear());
    setSelectedMonth(date.getUTCMonth());
  }, [cacHistorico]);

  /* ===============================
     RESET ÍNDICE AL CAMBIAR PERÍODO
     =============================== */
  useEffect(() => {
    if (selectedCAC) {
      setIndice("general");
    }
  }, [selectedCAC]);

  const inputClassName =
    "w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <Card title="Índice CAC por período">
      <div className="space-y-4 mt-2">
        {/* SELECTORES AÑO / MES */}
        <div className="flex gap-4">
          <select
            className={`${inputClassName} dark:bg-black `}
            value={selectedMonth ?? ""}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            disabled={!selectedYear}
          >
            <option value="">Mes</option>
            {months.map((month) => (
              <option key={month} value={month} className="dark:bg-black">
                {new Date(2000, month).toLocaleString("es-AR", {
                  month: "long",
                })}
              </option>
            ))}
          </select>

          <select
            className={`${inputClassName} dark:bg-black `}
            value={selectedYear ?? ""}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setSelectedMonth(null);
            }}
          >
            <option value="">Año</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {selectedCAC ? (
          <div className="pt-2 border-t border-gray-200 space-y-2">
            {/* ÍNDICE PRINCIPAL */}
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {formatNumber(selectedCAC[indice])}
              </p>
              {renderVariacion(variacion)}
            </div>

            {/* OTROS ÍNDICES */}
            <div className="flex justify-center gap-6 text-sm">
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
                className={`${inputClassName} dark:bg-black `}
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
              <label className="block text-sm font-medium mb-1 ">
                Monto a actualizar
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
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
              <div className="mt-4 pt-2 text-center bg-green-50 rounded-lg py-3 border border-green-100">
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
          <p className=" text-sm pt-2 text-center italic">
            Seleccioná un año y luego un mes
          </p>
        )}
      </div>
    </Card>
  );
}
