"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "./Card";

export default function CACSelector({ cacHistorico, ultimoCAC }) {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [indice, setIndice] = useState("general");

  const [baseAmount, setBaseAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");

  /* ===============================
     INPUT MONTO
  =============================== */

  const handleInputChange = (e) => {
    let value = e.target.value;

    value = value.replace(/[^0-9.,]/g, "");

    const lastChar = value[value.length - 1];
    const hasDecimalIntent = lastChar === "." || lastChar === ",";

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
     ÚLTIMO PERÍODO (seguro)
  =============================== */

  const ultimoPeriodo = useMemo(() => {
    if (!cacHistorico?.length) return null;

    return [...cacHistorico]
      .sort((a, b) => new Date(a.period) - new Date(b.period))
      .at(-1);
  }, [cacHistorico]);

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
     VARIACIÓN DESDE PERÍODO
  =============================== */

  const variacion = useMemo(() => {
    if (!selectedCAC || !ultimoCAC) return null;

    const seleccionado = selectedCAC[indice];
    const ultimo = ultimoCAC[indice];

    if (!seleccionado || !ultimo) return null;

    return ((ultimo - seleccionado) / seleccionado) * 100;
  }, [selectedCAC, ultimoCAC, indice]);

  /* ===============================
     FACTOR CAC
  =============================== */

  const factorCAC = useMemo(() => {
    if (!selectedCAC || !ultimoCAC) return null;

    const seleccionado = selectedCAC[indice];
    const ultimo = ultimoCAC[indice];

    if (!seleccionado || !ultimo) return null;

    return ultimo / seleccionado;
  }, [selectedCAC, ultimoCAC, indice]);

  /* ===============================
     FORMATOS
  =============================== */

  const formatNumber = (value) =>
    Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatFactor = (value) =>
    Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatPeriod = (period) => {
    const date = new Date(period);

    return date.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  /* ===============================
     DEFAULT: ÚLTIMO PERÍODO
  =============================== */

  useEffect(() => {
    if (!ultimoPeriodo) return;

    const date = new Date(ultimoPeriodo.period);

    setSelectedYear(date.getUTCFullYear());
    setSelectedMonth(date.getUTCMonth());
  }, [ultimoPeriodo]);

  useEffect(() => {
    if (selectedCAC) {
      setIndice("general");
    }
  }, [selectedCAC]);

  /* ===============================
     VARIACIÓN UI
  =============================== */

  const renderVariacion = (valor) => {
    if (valor === null) return null;

    return (
      <span className="inline-flex items-center justify-center gap-1.5 mt-2 px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-full text-xs font-bold">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 4l6 8h-4v8h-4v-8H6z" />
        </svg>
        {formatNumber(valor)}%
        <span className="font-normal text-gray-500 dark:text-gray-400">
          acumulado
        </span>
      </span>
    );
  };

  const inputClassName =
    "w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none";

  return (
    <Card title="Calculadora & Histórico por período">
      <div className="space-y-5 mt-2">
        {/* SELECTORES DE FECHA */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Mes
            </label>
            <select
              className={inputClassName}
              value={selectedMonth ?? ""}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              disabled={!selectedYear}
            >
              <option value="">Seleccionar Mes</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month).toLocaleString("es-AR", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Año
            </label>
            <select
              className={inputClassName}
              value={selectedYear ?? ""}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setSelectedMonth(null);
              }}
            >
              <option value="">Seleccionar Año</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCAC ? (
          <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 space-y-4">
            {/* VALOR ÍNDICE */}
            <div className="text-center p-3 rounded-2xl bg-gray-50/50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Índice en el período
              </span>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 my-1">
                {formatNumber(selectedCAC[indice])}
              </p>

              {renderVariacion(variacion)}

              {factorCAC && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Multiplicador CAC:{" "}
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    ×{formatFactor(factorCAC)}
                  </span>
                </div>
              )}

              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                {formatPeriod(selectedCAC.period)} vs{" "}
                {formatPeriod(ultimoCAC.period)}
              </p>
            </div>

            {/* DESGLOSE OTROS ÍNDICES */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-neutral-800/40 p-2.5 rounded-xl">
              {indice !== "general" && (
                <div className="flex justify-between p-1">
                  <span className="text-gray-500">General:</span>
                  <span className="font-semibold">
                    {formatNumber(selectedCAC.general)}
                  </span>
                </div>
              )}
              {indice !== "materials" && (
                <div className="flex justify-between p-1">
                  <span className="text-gray-500">Materiales:</span>
                  <span className="font-semibold">
                    {formatNumber(selectedCAC.materials)}
                  </span>
                </div>
              )}
              {indice !== "labour_force" && (
                <div className="flex justify-between p-1">
                  <span className="text-gray-500">Mano de Obra:</span>
                  <span className="font-semibold">
                    {formatNumber(selectedCAC.labour_force)}
                  </span>
                </div>
              )}
            </div>

            {/* SELECTOR TIPO DE ÍNDICE */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Tipo de índice a aplicar
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

            {/* CAMPO DE MONTO */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Monto original a actualizar
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400 font-bold">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className={`${inputClassName} pl-8 text-base font-semibold`}
                  value={displayAmount}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* RESULTADO CALCULADO */}
            {updatedAmount && (
              <div className="p-4 text-center bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:to-neutral-900 rounded-2xl border border-emerald-500/20 shadow-sm">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Monto Actualizado al Último CAC
                </p>

                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 my-1 ">
                  ${formatNumber(updatedAmount)}
                </p>

                {factorCAC && (
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 font-medium">
                    Aplicando factor ×{formatFactor(factorCAC)}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl">
            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
              Selecciona un año y un mes para consultar los datos y calcular
              valores
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
