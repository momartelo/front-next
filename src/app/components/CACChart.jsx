"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function CACChart({ data }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !data?.length) return null;
  // Formateamos fecha para eje X
  const formattedData = data.map((item) => ({
    ...item,
    label: new Date(item.period).toLocaleString("es-AR", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }),
  }));

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-md px-3 py-2 text-sm">
        <p className="font-semibold text-gray-900 mb-1">Período: {label}</p>

        {payload.map((item) => (
          <div key={item.dataKey} className="flex justify-between gap-4">
            <span style={{ color: item.stroke }}>{item.name}</span>
            <span className="font-medium text-gray-900">
              {Number(item.value).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" aspect={2.5}>
        <LineChart data={formattedData}>
          <XAxis dataKey="label" />
          <YAxis tickFormatter={(v) => v.toLocaleString("es-AR")} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconSize={12} wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="general"
            name="General"
            stroke="#1d4ed8" // azul fuerte
            strokeWidth={1}
            dot={{ r: 1 }}
          />

          <Line
            type="monotone"
            dataKey="materials"
            name="Materiales"
            stroke="#16a34a" // verde
            strokeWidth={1}
            dot={{ r: 1 }}
          />

          <Line
            type="monotone"
            dataKey="labour_force"
            name="Mano de obra"
            stroke="#dc2626" // rojo
            strokeWidth={1}
            dot={{ r: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
