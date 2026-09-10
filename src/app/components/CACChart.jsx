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

export default function CACChart({ data, indice, selectedPeriod }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedData = useMemo(() => {
    if (!data?.length) return [];

    return data.map((item) => ({
      ...item,
      label: new Date(item.period).toLocaleString("es-AR", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),
      selected: item.period === selectedPeriod,
    }));
  }, [data, selectedPeriod]);

  if (!mounted || !formattedData.length) return null;

  const axisColor = isDark ? "#9CA3AF" : "#6B7280";

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    return (
      <div
        className={`rounded-xl px-3.5 py-2.5 text-xs shadow-xl border backdrop-blur-md transition-all
          ${
            isDark
              ? "bg-neutral-900/90 border-neutral-700/80 text-gray-100 shadow-black/40"
              : "bg-white/95 border-gray-200/80 text-gray-900 shadow-gray-200/50"
          }`}
      >
        <p className="font-bold border-b border-gray-200/50 dark:border-neutral-700/50 pb-1.5 mb-2 text-gray-500 dark:text-gray-400">
          Período: {label}
        </p>

        <div className="space-y-1">
          {payload.map((item) => (
            <div
              key={item.dataKey}
              className="flex items-center justify-between gap-6"
            >
              <span
                className="font-semibold flex items-center gap-1.5"
                style={{ color: item.stroke }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.stroke }}
                />
                {item.name}
              </span>
              <span className="font-mono font-bold">
                {Number(item.value).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDot = (props) => {
    const { cx, cy, payload } = props;

    if (payload.selected) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          stroke="#F59E0B"
          strokeWidth={3}
          fill="#FBBF24"
          className="animate-pulse"
        />
      );
    }

    return <circle cx={cx} cy={cy} r={2} fill={axisColor} opacity={0.6} />;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" aspect={2.2}>
        <LineChart data={formattedData}>
          <XAxis
            dataKey="label"
            tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: isDark ? "#374151" : "#E5E7EB" }}
            tickLine={false}
            dy={5}
          />

          <YAxis
            tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={70}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          />

          <Line
            type="monotone"
            dataKey="general"
            name="General"
            stroke="#3B82F6"
            strokeWidth={indice === "general" ? 3 : 1.5}
            opacity={indice === "general" ? 1 : 0.35}
            dot={renderDot}
          />

          <Line
            type="monotone"
            dataKey="materials"
            name="Materiales"
            stroke="#10B981"
            strokeWidth={indice === "materials" ? 3 : 1.5}
            opacity={indice === "materials" ? 1 : 0.35}
            dot={renderDot}
          />

          <Line
            type="monotone"
            dataKey="labour_force"
            name="Mano de obra"
            stroke="#EF4444"
            strokeWidth={indice === "labour_force" ? 3 : 1.5}
            opacity={indice === "labour_force" ? 1 : 0.35}
            dot={renderDot}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
// "use client";

// import { useEffect, useState, useMemo } from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import { useTheme } from "next-themes";

// export default function CACChart({ data }) {
//   const { resolvedTheme } = useTheme();
//   const isDark = resolvedTheme === "dark";

//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   // 🔹 useMemo SIEMPRE se ejecuta
//   const formattedData = useMemo(() => {
//     if (!data?.length) return [];

//     return data.map((item) => ({
//       ...item,
//       label: new Date(item.period).toLocaleString("es-AR", {
//         month: "short",
//         year: "2-digit",
//         timeZone: "UTC",
//       }),
//     }));
//   }, [data]);

//   // 🔹 ahora sí, salida condicional
//   if (!mounted || !formattedData.length) return null;

//   const axisColor = isDark ? "#D1D5DB" : "#6B7280";

//   const CustomTooltip = ({ active, payload, label }) => {
//     if (!active || !payload?.length) return null;

//     return (
//       <div
//         className={`rounded-md px-3 py-2 text-sm shadow-lg border
//           ${
//             isDark
//               ? "bg-gray-800 border-gray-700 text-gray-100"
//               : "bg-white border-gray-200 text-gray-900"
//           }`}
//       >
//         <p className="font-semibold mb-1">Período: {label}</p>

//         {payload.map((item) => (
//           <div key={item.dataKey} className="flex justify-between gap-4">
//             <span style={{ color: item.stroke }}>{item.name}</span>
//             <span className="font-medium">
//               {Number(item.value).toLocaleString("es-AR", {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </span>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div className="w-full rounded-lg ">
//       <ResponsiveContainer width="100%" aspect={2.5}>
//         <LineChart data={formattedData}>
//           <XAxis
//             dataKey="label"
//             tick={{ fill: axisColor, fontSize: 12 }}
//             axisLine={{ stroke: axisColor }}
//             tickLine={false}
//           />

//           <YAxis
//             tick={{ fill: axisColor, fontSize: 12 }}
//             axisLine={{ stroke: axisColor }}
//             width={80}
//           />

//           <Tooltip content={<CustomTooltip />} />

//           <Legend
//             iconSize={12}
//             wrapperStyle={{ fontSize: 12, color: axisColor }}
//           />

//           <Line
//             type="monotone"
//             dataKey="general"
//             name="General"
//             stroke="#1d4ed8"
//             strokeWidth={1.5}
//             dot={{ r: 1 }}
//           />

//           <Line
//             type="monotone"
//             dataKey="materials"
//             name="Materiales"
//             stroke="#16a34a"
//             strokeWidth={1.5}
//             dot={{ r: 1 }}
//           />

//           <Line
//             type="monotone"
//             dataKey="labour_force"
//             name="Mano de obra"
//             stroke="#dc2626"
//             strokeWidth={1.5}
//             dot={{ r: 1 }}
//           />
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }
