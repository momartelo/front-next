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

import { Button, Stack, CircularProgress } from "@mui/material";
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
  const [filtrado, setFiltrado] = useState([]);
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

  // 🔹 Carga datos + setea YTD por defecto
  useEffect(() => {
    getDolaresHistorico().then((data) => {
      const oficiales = data
        .filter((item) => item.casa === "oficial")
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      setDolarHistorico(oficiales);

      if (oficiales.length) {
        const ultimaFecha = new Date(oficiales.at(-1).fecha);
        const inicioAnio = new Date(ultimaFecha.getFullYear(), 0, 1);

        setFechaInicio(inicioAnio);
        setFechaFin(ultimaFecha);
      }

      setLoading(false);
    });
  }, []);

  // 🔹 Límites de fechas
  const minFecha = useMemo(() => {
    if (!dolarHistorico.length) return null;
    return new Date(dolarHistorico[0].fecha);
  }, [dolarHistorico]);

  const maxFecha = useMemo(() => {
    if (!dolarHistorico.length) return null;
    return new Date(dolarHistorico.at(-1).fecha);
  }, [dolarHistorico]);

  // 🔹 Filtrado
  useEffect(() => {
    if (!dolarHistorico.length) return;

    setIsFiltering(true);

    const filtered =
      !fechaInicio && !fechaFin
        ? dolarHistorico
        : dolarHistorico.filter((item) => {
            const fecha = new Date(item.fecha);
            if (fechaInicio && fecha < fechaInicio) return false;
            if (fechaFin && fecha > fechaFin) return false;
            return true;
          });

    setFiltrado(filtered);
    setIsFiltering(false);
  }, [fechaInicio, fechaFin, dolarHistorico]);

  const getUltimaFecha = () => new Date(dolarHistorico.at(-1).fecha);

  const setRangoMeses = (meses) => {
    if (!dolarHistorico.length) return;

    const fechaFin = getUltimaFecha();
    const fechaInicio = new Date(fechaFin);
    fechaInicio.setMonth(fechaInicio.getMonth() - meses);

    setFechaInicio(fechaInicio);
    setFechaFin(fechaFin);
  };

  const handleYTD = () => {
    if (!dolarHistorico.length) return;

    const fechaFin = getUltimaFecha();
    const fechaInicio = new Date(fechaFin.getFullYear(), 0, 1);

    setFechaInicio(fechaInicio);
    setFechaFin(fechaFin);
  };

  const handleResetDates = () => {
    setFechaInicio(null);
    setFechaFin(null);
  };

  // 🔹 Downsampling
  const filtradoReducido = useMemo(() => {
    if (!filtrado.length) return [];
    if (filtrado.length <= 400) return filtrado;

    const step = Math.ceil(filtrado.length / 400);
    return filtrado.filter((_, idx) => idx % step === 0);
  }, [filtrado]);

  const chartData = useMemo(() => {
    return {
      labels: filtradoReducido.map((item) => formatFechaCompleta(item.fecha)),
      datasets: [
        {
          label: "Dólar oficial (venta)",
          data: filtradoReducido.map((item) => item.venta),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59,130,246,0.2)",
          tension: 0.3,
        },
      ],
    };
  }, [filtradoReducido]);

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
            label: (ctx) => `$${ctx.parsed.y.toFixed(2)}`,
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

  if (!mounted) return null;

  return (
    <div className="p-4 flex flex-col items-center min-h-[calc(100vh-70px)]">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Dólar oficial histórico
      </h1>

      <ThemeProvider theme={muiTheme}>
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={esLocale}
        >
          <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
            <DatePicker
              label="Desde"
              value={fechaInicio}
              onChange={setFechaInicio}
              views={["year", "month", "day"]}
              minDate={minFecha}
              maxDate={fechaFin || maxFecha}
              slotProps={{
                textField: { size: "small", sx: { width: 200 } },
              }}
            />

            <DatePicker
              label="Hasta"
              value={fechaFin}
              onChange={setFechaFin}
              views={["year", "month", "day"]}
              minDate={fechaInicio || minFecha}
              maxDate={maxFecha}
              slotProps={{
                textField: { size: "small", sx: { width: 200 } },
              }}
            />

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setRangoMeses(1)}
              >
                1M
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setRangoMeses(3)}
              >
                3M
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setRangoMeses(6)}
              >
                6M
              </Button>
              <Button size="small" variant="outlined" onClick={handleYTD}>
                Año en curso
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleResetDates}
              >
                Todos los valores
              </Button>
            </Stack>
          </Stack>
        </LocalizationProvider>
      </ThemeProvider>

      {loading || isFiltering ? (
        <div className="mt-8">
          <CircularProgress />
        </div>
      ) : filtradoReducido.length > 0 ? (
        <div className="w-full 2xl:w-[calc(100%-6rem)] 2xl:mx-12  2xl:mt-8 xl:w-[90%] grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-4">
          <div className="h-[60vh] 2xl:h-[65vh]">
            <Line
              data={chartData}
              options={{ ...chartOptions, maintainAspectRatio: false }}
            />
          </div>

          {/* Card de la Tabla Lateral */}
          <div className="flex flex-col border border-gray-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden h-[60vh] 2xl:h-[65vh]">
            {/* Encabezado Fijo */}
            <div className="bg-gray-50 dark:bg-neutral-800/50 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 pl-4 pr-6 ">
                <span>Fecha</span>
                <span>Venta</span>
              </div>
            </div>

            {/* Cuerpo con Scroll */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {[...filtrado].reverse().map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 dark:border-neutral-800 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {formatFechaCompleta(item.fecha)}
                  </span>
                  <span className="font-mono text-sm font-bold text-blue-500 dark:text-blue-300 bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded shadow-sm">
                    ${item.venta.toFixed(2)}
                  </span>
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
