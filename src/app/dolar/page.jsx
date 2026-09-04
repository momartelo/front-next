"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { getDolaresHistorico } from "../lib/dolar";
import { formatFechaCompleta } from "../lib/functions";
import { useTheme } from "next-themes";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { CircularProgress } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import esLocale from "date-fns/locale/es";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

const DatePicker = dynamic(
  () => import("@mui/x-date-pickers/DatePicker").then((mod) => mod.DatePicker),
  { ssr: false },
);

export default function DolarPage() {
  const [dolarHistorico, setDolarHistorico] = useState([]);
  const [dolarBlueHistorico, setDolarBlueHistorico] = useState([]);

  const [filtradoOficial, setFiltradoOficial] = useState([]);
  const [filtradoBlue, setFiltradoBlue] = useState([]);

  const [vistaDolar, setVistaDolar] = useState("ambos");
  const [rangoActivo, setRangoActivo] = useState("ytd");

  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? "dark" : "light",
        },
      }),
    [isDark],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    getDolaresHistorico().then((data) => {
      const oficiales = data
        .filter((item) => item.casa === "oficial")
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      const blues = data
        .filter((item) => item.casa === "blue")
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      setDolarHistorico(oficiales);
      setDolarBlueHistorico(blues);

      if (oficiales.length) {
        const ultimaFecha = new Date(oficiales.at(-1).fecha);
        const inicioAnio = new Date(ultimaFecha.getFullYear(), 0, 1);

        setFechaInicio(inicioAnio);
        setFechaFin(ultimaFecha);
      }

      setLoading(false);
    });
  }, []);

  const minFecha = useMemo(() => {
    if (!dolarHistorico.length) return null;
    return new Date(dolarHistorico[0].fecha);
  }, [dolarHistorico]);

  const maxFecha = useMemo(() => {
    if (!dolarHistorico.length) return null;
    return new Date(dolarHistorico.at(-1).fecha);
  }, [dolarHistorico]);

  useEffect(() => {
    if (!dolarHistorico.length) return;

    setIsFiltering(true);

    const filterByDate = (list) => {
      if (!fechaInicio && !fechaFin) return list;
      return list.filter((item) => {
        const fecha = new Date(item.fecha);
        if (fechaInicio && fecha < fechaInicio) return false;
        if (fechaFin && fecha > fechaFin) return false;
        return true;
      });
    };

    setFiltradoOficial(filterByDate(dolarHistorico));
    setFiltradoBlue(filterByDate(dolarBlueHistorico));

    setIsFiltering(false);
  }, [fechaInicio, fechaFin, dolarHistorico, dolarBlueHistorico]);

  const getUltimaFecha = () => new Date(dolarHistorico.at(-1).fecha);

  const setRangoMeses = (meses, id) => {
    if (!dolarHistorico.length) return;

    const fechaFin = getUltimaFecha();
    const fechaInicio = new Date(fechaFin);
    fechaInicio.setMonth(fechaInicio.getMonth() - meses);

    setRangoActivo(id);
    setFechaInicio(fechaInicio);
    setFechaFin(fechaFin);
  };

  const handleYTD = () => {
    if (!dolarHistorico.length) return;

    const fechaFin = getUltimaFecha();
    const fechaInicio = new Date(fechaFin.getFullYear(), 0, 1);

    setRangoActivo("ytd");
    setFechaInicio(fechaInicio);
    setFechaFin(fechaFin);
  };

  const handleResetDates = () => {
    setRangoActivo("todos");
    setFechaInicio(null);
    setFechaFin(null);
  };

  // 🔹 Acumulado del período (Mide la suba de 'Desde' hasta 'Hasta')
  const acumuladoOficial = useMemo(() => {
    if (!filtradoOficial.length) return null;
    const inicial = filtradoOficial[0].venta;
    const final = filtradoOficial.at(-1).venta;
    const pct = ((final - inicial) / inicial) * 100;
    const fechaInicial = filtradoOficial[0].fecha;
    const fechaFinal = filtradoOficial.at(-1).fecha;
    return { inicial, final, pct, fechaInicial, fechaFinal };
  }, [filtradoOficial]);

  const acumuladoBlue = useMemo(() => {
    if (!filtradoBlue.length) return null;
    const inicial = filtradoBlue[0].venta;
    const final = filtradoBlue.at(-1).venta;
    const pct = ((final - inicial) / inicial) * 100;
    const fechaInicial = filtradoBlue[0].fecha;
    const fechaFinal = filtradoBlue.at(-1).fecha;
    return { inicial, final, pct, fechaInicial, fechaFinal };
  }, [filtradoBlue]);

  const filtradoOficialReducido = useMemo(() => {
    if (!filtradoOficial.length) return [];
    if (filtradoOficial.length <= 400) return filtradoOficial;

    const step = Math.ceil(filtradoOficial.length / 400);
    return filtradoOficial.filter((_, idx) => idx % step === 0);
  }, [filtradoOficial]);

  const filtradoBlueReducido = useMemo(() => {
    if (!filtradoBlue.length) return [];
    if (filtradoBlue.length <= 400) return filtradoBlue;

    const step = Math.ceil(filtradoBlue.length / 400);
    return filtradoBlue.filter((_, idx) => idx % step === 0);
  }, [filtradoBlue]);

  const tablaUnificada = useMemo(() => {
    const baseList = vistaDolar === "blue" ? filtradoBlue : filtradoOficial;
    const mapBlue = new Map(
      filtradoBlue.map((item) => [item.fecha, item.venta]),
    );
    const mapOficial = new Map(
      filtradoOficial.map((item) => [item.fecha, item.venta]),
    );

    return [...baseList].reverse().map((item) => ({
      fecha: item.fecha,
      oficial: mapOficial.get(item.fecha) || null,
      blue: mapBlue.get(item.fecha) || null,
    }));
  }, [filtradoOficial, filtradoBlue, vistaDolar]);

  const chartData = useMemo(() => {
    const listLabels =
      vistaDolar === "blue" ? filtradoBlueReducido : filtradoOficialReducido;
    const datasets = [];

    if (vistaDolar === "oficial" || vistaDolar === "ambos") {
      datasets.push({
        label: "Dólar oficial (venta)",
        data: filtradoOficialReducido.map((item) => item.venta),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.3,
      });
    }

    if (vistaDolar === "blue" || vistaDolar === "ambos") {
      datasets.push({
        label: "Dólar blue (venta)",
        data: filtradoBlueReducido.map((item) => item.venta),
        borderColor: "#10B981",
        backgroundColor: "rgba(16,185,129,0.2)",
        tension: 0.3,
      });
    }

    return {
      labels: listLabels.map((item) => formatFechaCompleta(item.fecha)),
      datasets,
    };
  }, [filtradoOficialReducido, filtradoBlueReducido, vistaDolar]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: isDark ? "#E5E7EB" : "#111827",
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: isDark ? "#E5E7EB" : "#111827",
            autoSkip: true,
            maxTicksLimit: 10,
          },
          grid: {
            color: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
          },
        },
        y: {
          ticks: {
            color: isDark ? "#E5E7EB" : "#111827",
          },
          grid: {
            color: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
          },
        },
      },
    };
  }, [isDark]);

  const datePickerCustomProps = useMemo(() => {
    return {
      slotProps: {
        textField: {
          size: "small",
          sx: {
            width: 145,
            "& .MuiOutlinedInput-root": {
              borderRadius: "0.75rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              backgroundColor: isDark ? "rgba(38, 38, 38, 0.8)" : "#f3f4f6",
              paddingRight: "8px",
              transition: "all 0.2s ease",
              "& fieldset": {
                borderColor: isDark
                  ? "rgba(64, 64, 64, 0.6)"
                  : "rgba(229, 231, 235, 0.8)",
              },
              "&:hover fieldset": {
                borderColor: isDark ? "#525252" : "#d1d5db",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
                borderWidth: "1px",
              },
            },
            "& .MuiInputLabel-root": {
              fontSize: "0.75rem",
              fontWeight: 500,
              color: isDark ? "#9ca3af" : "#6b7280",
            },
            "& .MuiInputBase-input": {
              padding: "6px 10px",
              height: "20px",
            },
            "& .MuiSvgIcon-root": {
              fontSize: "1.1rem",
              color: isDark ? "#9ca3af" : "#6b7280",
            },
          },
        },
      },
    };
  }, [isDark]);

  if (!mounted) return null;

  return (
    <div className="p-4 flex flex-col items-center min-h-[calc(100vh-70px)]">
      <h1 className="text-2xl font-bold mb-5 text-center">Dólar Histórico</h1>

      <ThemeProvider theme={muiTheme}>
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={esLocale}
        >
          {/* Barra de Control Unificada */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
            <div className="bg-gray-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-gray-200/70 dark:border-neutral-700/60 flex items-center gap-1 shadow-inner">
              {[
                { id: "oficial", label: "Oficial" },
                { id: "blue", label: "Blue" },
                { id: "ambos", label: "Ambos" },
              ].map((tab) => {
                const isActive = vistaDolar === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVistaDolar(tab.id)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 select-none ${
                      isActive
                        ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm border border-black/5 dark:border-white/10 scale-[1.02]"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <DatePicker
                label="Desde"
                value={fechaInicio}
                onChange={(val) => {
                  setRangoActivo(null);
                  setFechaInicio(val);
                }}
                views={["year", "month", "day"]}
                minDate={minFecha}
                maxDate={fechaFin || maxFecha}
                {...datePickerCustomProps}
              />

              <DatePicker
                label="Hasta"
                value={fechaFin}
                onChange={(val) => {
                  setRangoActivo(null);
                  setFechaFin(val);
                }}
                views={["year", "month", "day"]}
                minDate={fechaInicio || minFecha}
                maxDate={maxFecha}
                {...datePickerCustomProps}
              />
            </div>

            <div className="bg-gray-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-gray-200/70 dark:border-neutral-700/60 flex items-center gap-1 shadow-inner">
              {[
                { id: "1m", label: "1M", fn: () => setRangoMeses(1, "1m") },
                { id: "3m", label: "3M", fn: () => setRangoMeses(3, "3m") },
                { id: "6m", label: "6M", fn: () => setRangoMeses(6, "6m") },
                { id: "ytd", label: "Año en curso", fn: handleYTD },
              ].map((btn) => {
                const isActive = rangoActivo === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={btn.fn}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 select-none ${
                      isActive
                        ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm border border-black/5 dark:border-white/10 scale-[1.02]"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleResetDates}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 select-none ${
                  rangoActivo === "todos"
                    ? "bg-red-500 text-white shadow-sm scale-[1.02]"
                    : "text-red-500 dark:text-red-400 hover:bg-red-500/10"
                }`}
              >
                Todos
              </button>
            </div>
          </div>
        </LocalizationProvider>
      </ThemeProvider>

      {/* 🔹 Tarjetas de Aumento Acumulado en el Período */}
      {!loading && !isFiltering && (
        <div className="w-full xl:w-[90%] 2xl:w-[calc(100%-6rem)] grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {(vistaDolar === "oficial" || vistaDolar === "ambos") &&
            acumuladoOficial && (
              <div
                className={`p-3.5 px-4 rounded-xl border border-gray-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between ${vistaDolar === "oficial" ? "md:col-span-2" : ""}`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Acumulado Dólar Oficial (
                    {formatFechaCompleta(acumuladoOficial.fechaInicial)} a{" "}
                    {formatFechaCompleta(acumuladoOficial.fechaFinal)})
                  </span>
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    <span>
                      Inicial:{" "}
                      <strong className="text-gray-900 dark:text-white font-extrabold">
                        ${acumuladoOficial.inicial.toFixed(2)}
                      </strong>
                    </span>
                    <span className="text-gray-300 dark:text-neutral-700">
                      |
                    </span>
                    <span>
                      Final:{" "}
                      <strong className="text-blue-600 dark:text-blue-400 font-extrabold">
                        ${acumuladoOficial.final.toFixed(2)}
                      </strong>
                    </span>
                  </div>
                </div>

                <span className="text-lg font-black px-3 py-1 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
                  +
                  {acumuladoOficial.pct.toLocaleString("es-AR", {
                    maximumFractionDigits: 2,
                  })}
                  %
                </span>
              </div>
            )}

          {(vistaDolar === "blue" || vistaDolar === "ambos") &&
            acumuladoBlue && (
              <div
                className={`p-3.5 px-4 rounded-xl border border-gray-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between ${vistaDolar === "blue" ? "md:col-span-2" : ""}`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Acumulado Dólar Blue (
                    {formatFechaCompleta(acumuladoBlue.fechaInicial)} a{" "}
                    {formatFechaCompleta(acumuladoBlue.fechaFinal)})
                  </span>
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    <span>
                      Inicial:{" "}
                      <strong className="text-gray-900 dark:text-white font-extrabold">
                        ${acumuladoBlue.inicial.toFixed(2)}
                      </strong>
                    </span>
                    <span className="text-gray-300 dark:text-neutral-700">
                      |
                    </span>
                    <span>
                      Final:{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        ${acumuladoBlue.final.toFixed(2)}
                      </strong>
                    </span>
                  </div>
                </div>

                <span className="text-lg font-black px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                  +
                  {acumuladoBlue.pct.toLocaleString("es-AR", {
                    maximumFractionDigits: 2,
                  })}
                  %
                </span>
              </div>
            )}
        </div>
      )}

      {loading || isFiltering ? (
        <div className="mt-8">
          <CircularProgress />
        </div>
      ) : filtradoOficialReducido.length > 0 ||
        filtradoBlueReducido.length > 0 ? (
        <div className="w-full 2xl:w-[calc(100%-6rem)] 2xl:mx-12 xl:w-[90%] grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
          <div className="h-[65vh] 2xl:h-[65vh]">
            <Line
              data={chartData}
              options={{ ...chartOptions, maintainAspectRatio: false }}
            />
          </div>

          <div className="flex flex-col border border-gray-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden h-[60vh] 2xl:h-[65vh]">
            <div className="bg-gray-50 dark:bg-neutral-800/50 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
              <div
                className={`grid ${
                  vistaDolar === "ambos" ? "grid-cols-3" : "grid-cols-2"
                } text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400`}
              >
                <span className="text-left">Fecha</span>
                {(vistaDolar === "oficial" || vistaDolar === "ambos") && (
                  <span
                    className={
                      vistaDolar === "oficial" ? "text-right" : "text-center"
                    }
                  >
                    Oficial
                  </span>
                )}
                {(vistaDolar === "blue" || vistaDolar === "ambos") && (
                  <span className="text-right">Blue</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {tablaUnificada.map((item, idx) => (
                <div
                  key={idx}
                  className={`grid ${
                    vistaDolar === "ambos" ? "grid-cols-3" : "grid-cols-2"
                  } items-center px-4 py-2.5 border-b border-gray-100 dark:border-neutral-800 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group text-xs font-mono`}
                >
                  <span className="text-left text-gray-600 dark:text-gray-300 font-sans group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {formatFechaCompleta(item.fecha)}
                  </span>

                  {(vistaDolar === "oficial" || vistaDolar === "ambos") && (
                    <span
                      className={`font-bold text-blue-600 dark:text-blue-400 ${
                        vistaDolar === "oficial" ? "text-right" : "text-center"
                      }`}
                    >
                      {item.oficial ? `$${item.oficial.toFixed(2)}` : "-"}
                    </span>
                  )}

                  {(vistaDolar === "blue" || vistaDolar === "ambos") && (
                    <span className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {item.blue ? `$${item.blue.toFixed(2)}` : "-"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p>No hay datos para el rango seleccionado.</p>
      )}
    </div>
  );
}
// "use client";

// import dynamic from "next/dynamic";
// import { useEffect, useState, useMemo } from "react";
// import { Line } from "react-chartjs-2";
// import { getDolaresHistorico } from "../lib/dolar";
// import { formatFechaCompleta } from "../lib/functions";
// import { useTheme } from "next-themes";

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Tooltip,
//   Legend,
// } from "chart.js";

// import { Button, Stack, CircularProgress } from "@mui/material";
// import { createTheme, ThemeProvider } from "@mui/material/styles";
// import { LocalizationProvider } from "@mui/x-date-pickers";
// import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// import esLocale from "date-fns/locale/es";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Tooltip,
//   Legend,
// );

// const DatePicker = dynamic(
//   () => import("@mui/x-date-pickers/DatePicker").then((mod) => mod.DatePicker),
//   { ssr: false },
// );

// export default function DolarPage() {
//   const [dolarHistorico, setDolarHistorico] = useState([]);
//   const [filtrado, setFiltrado] = useState([]);
//   const [fechaInicio, setFechaInicio] = useState(null);
//   const [fechaFin, setFechaFin] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isFiltering, setIsFiltering] = useState(false);
//   const [mounted, setMounted] = useState(false);

//   const { resolvedTheme } = useTheme();
//   const isDark = resolvedTheme === "dark";

//   const muiTheme = useMemo(
//     () =>
//       createTheme({
//         palette: {
//           mode: isDark ? "dark" : "light",
//         },
//       }),
//     [isDark],
//   );

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   // 🔹 Carga datos + setea YTD por defecto
//   useEffect(() => {
//     getDolaresHistorico().then((data) => {
//       const oficiales = data
//         .filter((item) => item.casa === "oficial")
//         .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

//       setDolarHistorico(oficiales);

//       if (oficiales.length) {
//         const ultimaFecha = new Date(oficiales.at(-1).fecha);
//         const inicioAnio = new Date(ultimaFecha.getFullYear(), 0, 1);

//         setFechaInicio(inicioAnio);
//         setFechaFin(ultimaFecha);
//       }

//       setLoading(false);
//     });
//   }, []);

//   // 🔹 Límites de fechas
//   const minFecha = useMemo(() => {
//     if (!dolarHistorico.length) return null;
//     return new Date(dolarHistorico[0].fecha);
//   }, [dolarHistorico]);

//   const maxFecha = useMemo(() => {
//     if (!dolarHistorico.length) return null;
//     return new Date(dolarHistorico.at(-1).fecha);
//   }, [dolarHistorico]);

//   // 🔹 Filtrado
//   useEffect(() => {
//     if (!dolarHistorico.length) return;

//     setIsFiltering(true);

//     const filtered =
//       !fechaInicio && !fechaFin
//         ? dolarHistorico
//         : dolarHistorico.filter((item) => {
//             const fecha = new Date(item.fecha);
//             if (fechaInicio && fecha < fechaInicio) return false;
//             if (fechaFin && fecha > fechaFin) return false;
//             return true;
//           });

//     setFiltrado(filtered);
//     setIsFiltering(false);
//   }, [fechaInicio, fechaFin, dolarHistorico]);

//   const getUltimaFecha = () => new Date(dolarHistorico.at(-1).fecha);

//   const setRangoMeses = (meses) => {
//     if (!dolarHistorico.length) return;

//     const fechaFin = getUltimaFecha();
//     const fechaInicio = new Date(fechaFin);
//     fechaInicio.setMonth(fechaInicio.getMonth() - meses);

//     setFechaInicio(fechaInicio);
//     setFechaFin(fechaFin);
//   };

//   const handleYTD = () => {
//     if (!dolarHistorico.length) return;

//     const fechaFin = getUltimaFecha();
//     const fechaInicio = new Date(fechaFin.getFullYear(), 0, 1);

//     setFechaInicio(fechaInicio);
//     setFechaFin(fechaFin);
//   };

//   const handleResetDates = () => {
//     setFechaInicio(null);
//     setFechaFin(null);
//   };

//   // 🔹 Downsampling
//   const filtradoReducido = useMemo(() => {
//     if (!filtrado.length) return [];
//     if (filtrado.length <= 400) return filtrado;

//     const step = Math.ceil(filtrado.length / 400);
//     return filtrado.filter((_, idx) => idx % step === 0);
//   }, [filtrado]);

//   const chartData = useMemo(() => {
//     return {
//       labels: filtradoReducido.map((item) => formatFechaCompleta(item.fecha)),
//       datasets: [
//         {
//           label: "Dólar oficial (venta)",
//           data: filtradoReducido.map((item) => item.venta),
//           borderColor: "#3B82F6",
//           backgroundColor: "rgba(59,130,246,0.2)",
//           tension: 0.3,
//         },
//       ],
//     };
//   }, [filtradoReducido]);

//   const chartOptions = useMemo(() => {
//     return {
//       responsive: true,
//       plugins: {
//         legend: {
//           labels: {
//             color: isDark ? "#E5E7EB" : "#111827",
//           },
//         },
//         tooltip: {
//           callbacks: {
//             label: (ctx) => `$${ctx.parsed.y.toFixed(2)}`,
//           },
//         },
//       },
//       scales: {
//         x: {
//           ticks: {
//             color: isDark ? "#E5E7EB" : "#111827",
//             autoSkip: true,
//             maxTicksLimit: 10,
//           },
//           grid: {
//             color: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
//           },
//         },
//         y: {
//           ticks: {
//             color: isDark ? "#E5E7EB" : "#111827",
//           },
//           grid: {
//             color: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
//           },
//         },
//       },
//     };
//   }, [isDark]);

//   if (!mounted) return null;

//   return (
//     <div className="p-4 flex flex-col items-center min-h-[calc(100vh-70px)]">
//       <h1 className="text-2xl font-bold mb-4 text-center">
//         Dólar oficial histórico
//       </h1>

//       <ThemeProvider theme={muiTheme}>
//         <LocalizationProvider
//           dateAdapter={AdapterDateFns}
//           adapterLocale={esLocale}
//         >
//           <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
//             <DatePicker
//               label="Desde"
//               value={fechaInicio}
//               onChange={setFechaInicio}
//               views={["year", "month", "day"]}
//               minDate={minFecha}
//               maxDate={fechaFin || maxFecha}
//               slotProps={{
//                 textField: { size: "small", sx: { width: 200 } },
//               }}
//             />

//             <DatePicker
//               label="Hasta"
//               value={fechaFin}
//               onChange={setFechaFin}
//               views={["year", "month", "day"]}
//               minDate={fechaInicio || minFecha}
//               maxDate={maxFecha}
//               slotProps={{
//                 textField: { size: "small", sx: { width: 200 } },
//               }}
//             />

//             <Stack direction="row" spacing={1}>
//               <Button
//                 size="small"
//                 variant="outlined"
//                 onClick={() => setRangoMeses(1)}
//               >
//                 1M
//               </Button>
//               <Button
//                 size="small"
//                 variant="outlined"
//                 onClick={() => setRangoMeses(3)}
//               >
//                 3M
//               </Button>
//               <Button
//                 size="small"
//                 variant="outlined"
//                 onClick={() => setRangoMeses(6)}
//               >
//                 6M
//               </Button>
//               <Button size="small" variant="outlined" onClick={handleYTD}>
//                 Año en curso
//               </Button>
//               <Button
//                 size="small"
//                 variant="outlined"
//                 color="error"
//                 onClick={handleResetDates}
//               >
//                 Todos los valores
//               </Button>
//             </Stack>
//           </Stack>
//         </LocalizationProvider>
//       </ThemeProvider>

//       {loading || isFiltering ? (
//         <div className="mt-8">
//           <CircularProgress />
//         </div>
//       ) : filtradoReducido.length > 0 ? (
//         <div className="w-full 2xl:w-[calc(100%-6rem)] 2xl:mx-12  2xl:mt-8 xl:w-[90%] grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-4">
//           <div className="h-[65vh] 2xl:h-[65vh]">
//             <Line
//               data={chartData}
//               options={{ ...chartOptions, maintainAspectRatio: false }}
//             />
//           </div>

//           {/* Card de la Tabla Lateral */}
//           <div className="flex flex-col border border-gray-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden h-[60vh] 2xl:h-[65vh]">
//             {/* Encabezado Fijo */}
//             <div className="bg-gray-50 dark:bg-neutral-800/50 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
//               <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 pl-4 pr-6 ">
//                 <span>Fecha</span>
//                 <span>Venta</span>
//               </div>
//             </div>

//             {/* Cuerpo con Scroll */}
//             <div className="flex-1 overflow-y-auto custom-scrollbar">
//               {[...filtrado].reverse().map((item, idx) => (
//                 <div
//                   key={idx}
//                   className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 dark:border-neutral-800 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group"
//                 >
//                   <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
//                     {formatFechaCompleta(item.fecha)}
//                   </span>
//                   <span className="font-mono text-sm font-bold text-blue-500 dark:text-blue-300 bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded shadow-sm">
//                     ${item.venta.toFixed(2)}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       ) : (
//         <p>No hay datos para el rango seleccionado.</p>
//       )}
//     </div>
//   );
// }
