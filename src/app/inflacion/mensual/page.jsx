"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { getInflacionMensualHistorica } from "../../lib/inflacion";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

import { Button, Stack, CircularProgress } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import esLocale from "date-fns/locale/es";
import { formatMesAnio } from "../../lib/functions";

// 👉 DatePicker solo en cliente
const DatePicker = dynamic(
  () => import("@mui/x-date-pickers/DatePicker").then((mod) => mod.DatePicker),
  { ssr: false },
);

export default function InflationDashboard() {
  const [inflacionHistorica, setInflacionHistorica] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [filtrada, setFiltrada] = useState([]);
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

  // Carga datos
  useEffect(() => {
    getInflacionMensualHistorica().then((data) => {
      const sorted = data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      setInflacionHistorica(sorted);
      setFiltrada(sorted);
      setLoading(false);
    });
  }, []);

  // 🔥 FILTRADO AUTOMÁTICO (con loading)
  useEffect(() => {
    if (!inflacionHistorica.length) return;

    setIsFiltering(true);

    const filtered =
      !fechaInicio && !fechaFin
        ? inflacionHistorica
        : inflacionHistorica.filter((item) => {
            const fecha = new Date(item.fecha);
            if (fechaInicio && fecha < fechaInicio) return false;
            if (fechaFin && fecha > fechaFin) return false;
            return true;
          });

    setFiltrada(filtered);
    setIsFiltering(false);
  }, [fechaInicio, fechaFin, inflacionHistorica]);

  const handleUltimos12Meses = () => {
    if (inflacionHistorica.length === 0) return;

    const ultimos12 = inflacionHistorica.slice(-12);

    setFechaInicio(new Date(ultimos12[0].fecha));
    setFechaFin(new Date(ultimos12[ultimos12.length - 1].fecha));
  };

  const handleResetDates = () => {
    setFechaInicio(null);
    setFechaFin(null);
  };

  // 🔹 DOWN-SAMPLING para que el gráfico no se trabe
  const filtradaReducida = useMemo(() => {
    if (!filtrada.length) return [];
    if (filtrada.length <= 400) return filtrada;

    const step = Math.ceil(filtrada.length / 400);
    return filtrada.filter((_, idx) => idx % step === 0);
  }, [filtrada]);

  const chartData = useMemo(() => {
    return {
      labels: filtradaReducida.map((item) =>
        new Date(item.fecha).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      ),
      datasets: [
        {
          label: "Inflación mensual (%)",
          data: filtradaReducida.map((item) => item.valor),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59,130,246,0.2)",
          tension: 0.3,
        },
      ],
    };
  }, [filtradaReducida]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: isDark ? "#E5E7EB" : "#111827",
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: isDark ? "#E5E7EB" : "#111827",
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
        Inflación mensual histórica
      </h1>

      <div className="mt-2 xl:mt-4 2xl:mt-4">
        <ThemeProvider theme={muiTheme}>
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={esLocale}
          >
            <Stack
              direction="row"
              spacing={3}
              justifyContent="center"
              alignItems="center"
              mb={2}
              flexWrap="wrap"
              rowGap={"15px"}
            >
              {/* DatePickers */}
              <Stack
                direction="row"
                spacing={2}
                justifyContent="center"
                mb={2}
                className="mt-2 sm:mt-0"
              >
                <DatePicker
                  views={["year", "month"]}
                  label="Desde"
                  value={fechaInicio}
                  onChange={setFechaInicio}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: 200 },
                    },
                  }}
                />

                <DatePicker
                  views={["year", "month"]}
                  label="Hasta"
                  value={fechaFin}
                  onChange={setFechaFin}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: 200 },
                    },
                  }}
                />
              </Stack>

              {/* Botones */}
              <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleResetDates}
                >
                  Reset
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={handleUltimos12Meses}
                >
                  Últimos 12 índices
                </Button>
              </Stack>
            </Stack>
          </LocalizationProvider>
        </ThemeProvider>
      </div>

      {/* Gráfico */}
      {loading ? (
        <div className="mt-8">
          <CircularProgress />
        </div>
      ) : isFiltering ? (
        <div className="mt-8">
          <CircularProgress />
        </div>
      ) : filtradaReducida.length > 0 ? (
        <div className=" w-full  2xl:w-[calc(100%-6rem)]  2xl:mx-12  2xl:mt-6 p-2 md:p-4 ">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-4">
            <div className="h-[45vh] md:h-[50vh] xl:h-[65vh]">
              <Line
                data={chartData}
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                }}
              />
            </div>
            {/* Card de la Tabla de Valores del Período */}
            <div className="flex flex-col border border-gray-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden h-[45vh] md:h-[50vh] xl:h-[65vh]">
              {/* Encabezado Fijo */}
              <div className="bg-gray-50 dark:bg-neutral-800/50 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <span>Período</span>
                  <span>Variación</span>
                </div>
              </div>

              {/* Cuerpo con Scroll */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {[...filtrada].reverse().map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 dark:border-neutral-800 last:border-0 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {formatMesAnio(item.fecha)}
                    </span>
                    <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                      {item.valor.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p>No hay datos para el rango seleccionado.</p>
      )}
    </div>
  );
}
