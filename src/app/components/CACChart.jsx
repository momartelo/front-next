"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";

export default function CACChart({ data }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔹 useMemo SIEMPRE se ejecuta
  const formattedData = useMemo(() => {
    if (!data?.length) return [];

    return data.map((item) => ({
      ...item,
      label: new Date(item.period).toLocaleString("es-AR", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),
    }));
  }, [data]);

  // 🔹 ahora sí, salida condicional
  if (!mounted || !formattedData.length) return null;

  const axisColor = isDark ? "#D1D5DB" : "#6B7280";

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    return (
      <div
        className={`rounded-md px-3 py-2 text-sm shadow-lg border
          ${
            isDark
              ? "bg-gray-800 border-gray-700 text-gray-100"
              : "bg-white border-gray-200 text-gray-900"
          }`}
      >
        <p className="font-semibold mb-1">Período: {label}</p>

        {payload.map((item) => (
          <div key={item.dataKey} className="flex justify-between gap-4">
            <span style={{ color: item.stroke }}>{item.name}</span>
            <span className="font-medium">
              {Number(item.value).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full rounded-lg p-3">
      <ResponsiveContainer width="100%" aspect={2.5}>
        <LineChart data={formattedData}>
          <XAxis
            dataKey="label"
            tick={{ fill: axisColor, fontSize: 12 }}
            axisLine={{ stroke: axisColor }}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: axisColor, fontSize: 12 }}
            axisLine={{ stroke: axisColor }}
            width={80}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            iconSize={12}
            wrapperStyle={{ fontSize: 12, color: axisColor }}
          />

          <Line
            type="monotone"
            dataKey="general"
            name="General"
            stroke="#1d4ed8"
            strokeWidth={1.5}
            dot={{ r: 1 }}
          />

          <Line
            type="monotone"
            dataKey="materials"
            name="Materiales"
            stroke="#16a34a"
            strokeWidth={1.5}
            dot={{ r: 1 }}
          />

          <Line
            type="monotone"
            dataKey="labour_force"
            name="Mano de obra"
            stroke="#dc2626"
            strokeWidth={1.5}
            dot={{ r: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
