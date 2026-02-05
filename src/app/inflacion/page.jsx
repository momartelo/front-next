"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { getInflacionMensualHistorica } from "../lib/inflacion";

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

import { Button, Stack } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import esLocale from "date-fns/locale/es";

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

  // 🌙 Dark / Light sin hydration mismatch
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);

    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, []);

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? "dark" : "light",
        },
      }),
    [isDark],
  );

  // Carga datos
  useEffect(() => {
    getInflacionMensualHistorica().then((data) => {
      const sorted = data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      setInflacionHistorica(sorted);
      setFiltrada(sorted);
    });
  }, []);

  // 🔥 FILTRADO AUTOMÁTICO
  useEffect(() => {
    if (!inflacionHistorica.length) return;

    // si no hay fechas, mostrar todo
    if (!fechaInicio && !fechaFin) {
      setFiltrada(inflacionHistorica);
      return;
    }

    const filtered = inflacionHistorica.filter((item) => {
      const fecha = new Date(item.fecha);
      if (fechaInicio && fecha < fechaInicio) return false;
      if (fechaFin && fecha > fechaFin) return false;
      return true;
    });

    setFiltrada(filtered);
  }, [fechaInicio, fechaFin, inflacionHistorica]);

  const handleReset = () => {
    setFechaInicio(null);
    setFechaFin(null);
  };

  const formatMesAnio = (fecha) => {
    const d = new Date(fecha);
    const mes = d
      .toLocaleDateString("es-AR", { month: "short" })
      .replace(".", "");
    const anio = d.getFullYear().toString().slice(-2);
    return `${mes}-${anio}`;
  };

  const handleUltimos12Meses = () => {
    if (inflacionHistorica.length === 0) return;

    const ultimos12 = inflacionHistorica.slice(-12);

    setFechaInicio(new Date(ultimos12[0].fecha));
    setFechaFin(new Date(ultimos12[ultimos12.length - 1].fecha));
  };

  const chartData = {
    labels: filtrada.map((item) =>
      new Date(item.fecha).toLocaleDateString("es-AR", {
        month: "short",
        year: "numeric",
      }),
    ),
    datasets: [
      {
        label: "Inflación mensual (%)",
        data: filtrada.map((item) => item.valor),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
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

  return (
    <div className="p-4 flex flex-col items-center bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-gray-100">
        Inflación mensual histórica
      </h1>

      <div className="mt-2 xl:mt-4 2xl:mt-4">
        <ThemeProvider theme={muiTheme}>
          <LocalizationProvider dateAdapter={AdapterDateFns} locale={esLocale}>
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
                <Button variant="outlined" color="error" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={handleUltimos12Meses}
                >
                  Últimos 12 indices
                </Button>
              </Stack>
            </Stack>
          </LocalizationProvider>
        </ThemeProvider>
      </div>

      {/* Gráfico */}
      {filtrada.length > 0 ? (
        <div className="w-full max-w-none 2xl:px-8 bg-white dark:bg-gray-800 p-2 md:p-4 rounded shadow">
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
            <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900 overflow-hidden w-1/2 sm:w-auto mx-auto sm:mx-0">
              <h3 className="text-center text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 py-1">
                Valores del período
              </h3>

              <div className="max-h-[55vh] overflow-y-auto space-y-1 pr-1">
                {filtrada.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-center px-2 py-1 rounded transition hover:bg-gray-200 dark:hover:bg-gray-700`}
                  >
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {formatMesAnio(item.fecha)}
                    </span>

                    <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {item.valor.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-300">
          No hay datos para el rango seleccionado.
        </p>
      )}
    </div>
  );
}
