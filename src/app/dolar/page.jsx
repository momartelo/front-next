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

// 👉 DatePicker solo en cliente
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

  // 🔹 Carga datos (solo dólar oficial)
  useEffect(() => {
    getDolaresHistorico().then((data) => {
      const oficiales = data
        .filter((item) => item.casa === "oficial")
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      setDolarHistorico(oficiales);
      setFiltrado(oficiales);
      setLoading(false);
    });
  }, []);

  // 🔹 Filtrado por fechas (con loading)
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

  // 🔹 DOWN-SAMPLING para que el gráfico no se trabe
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
    <div className="p-4 flex flex-col items-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Dólar oficial histórico
      </h1>

      {/* Filtros */}
      <ThemeProvider theme={muiTheme}>
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={esLocale}
        >
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            mb={2}
            className="mt-2 sm:mt-0"
          >
            <DatePicker
              label="Desde"
              value={fechaInicio}
              onChange={setFechaInicio}
              views={["year", "month", "day"]}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { width: 200 },
                },
              }}
            />
            <DatePicker
              label="Hasta"
              value={fechaFin}
              onChange={setFechaFin}
              views={["year", "month", "day"]}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { width: 200 },
                },
              }}
            />

            <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
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
                Reset
              </Button>
            </Stack>
          </Stack>
        </LocalizationProvider>
      </ThemeProvider>

      {/* Gráfico + lista */}
      {loading ? (
        <div className="mt-8">
          <CircularProgress />
        </div>
      ) : isFiltering ? (
        <div className="mt-8">
          <CircularProgress />
        </div>
      ) : filtradoReducido.length > 0 ? (
        <div className="w-full xl:w-[90%] grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-4">
          <div className="h-[60vh]">
            <Line
              data={chartData}
              options={{ ...chartOptions, maintainAspectRatio: false }}
            />
          </div>

          <div className="border rounded-lg p-3 max-h-[60vh] overflow-y-auto">
            {filtrado.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span>{formatFechaCompleta(item.fecha)}</span>
                <span className="font-mono font-semibold">
                  ${item.venta.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>No hay datos para el rango seleccionado.</p>
      )}
    </div>
  );
}
