"use client";

import { useMemo, useState } from "react";
import Card from "./Card";

export default function CACSelector({ cacHistorico }) {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

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

  const formatNumber = (value) =>
    Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Card title="Índice CAC por período">
      <div className="space-y-3">
        <select
          className="w-full border rounded p-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          value={selectedYear ?? ""}
          onChange={(e) => {
            setSelectedYear(Number(e.target.value));
            setSelectedMonth(null);
          }}
        >
          <option className="text-gray-900 dark:text-gray-100">
            Seleccionar año
          </option>
          {years.map((year) => (
            <option
              key={year}
              value={year}
              className="text-gray-900 dark:text-gray-100"
            >
              {year}
            </option>
          ))}
        </select>

        <select
          className="w-full border rounded p-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          value={selectedMonth ?? ""}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          disabled={!selectedYear}
        >
          <option className="text-gray-900 dark:text-gray-100">
            Seleccionar mes
          </option>
          {months.map((month) => (
            <option
              key={month}
              value={month}
              className="text-gray-900 dark:text-gray-100"
            >
              {new Date(2000, month).toLocaleString("es-AR", {
                month: "long",
              })}
            </option>
          ))}
        </select>

        {selectedCAC ? (
          <div className="pt-3 border-t">
            <p className="text-2xl font-bold text-blue-600">
              {formatNumber(selectedCAC.general)}
            </p>

            <div className="text-sm mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Materiales</span>
                <span>{formatNumber(selectedCAC.materials)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mano de obra</span>
                <span>{formatNumber(selectedCAC.labour_force)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm pt-2">Seleccioná un período</p>
        )}
      </div>
    </Card>
  );
}
