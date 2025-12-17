"use client";

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
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <XAxis dataKey="label" />
          <YAxis tickFormatter={(v) => v.toLocaleString("es-AR")} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="general"
            name="General"
            stroke="#1d4ed8" // azul fuerte
            strokeWidth={3}
            dot={{ r: 3 }}
          />

          <Line
            type="monotone"
            dataKey="materials"
            name="Materiales"
            stroke="#16a34a" // verde
            strokeWidth={2}
            dot={{ r: 2 }}
          />

          <Line
            type="monotone"
            dataKey="labour_force"
            name="Mano de obra"
            stroke="#dc2626" // rojo
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
