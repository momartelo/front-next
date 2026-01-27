"use client";

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
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import esLocale from "date-fns/locale/es";

export default function InflationDashboard() {
  const [inflacionHistorica, setInflacionHistorica] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [filtrada, setFiltrada] = useState([]);

  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

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
    getInflacionMensualHistorica().then((data) => {
      const sorted = data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      setInflacionHistorica(sorted);
      setFiltrada(sorted);
    });
  }, []);

  const handleFiltrar = () => {
    const filtered = inflacionHistorica.filter((item) => {
      const fecha = new Date(item.fecha);
      if (fechaInicio && fecha < fechaInicio) return false;
      if (fechaFin && fecha > fechaFin) return false;
      return true;
    });
    setFiltrada(filtered);
  };

  const handleReset = () => {
    setFechaInicio(null);
    setFechaFin(null);
    setFiltrada(inflacionHistorica);
  };

  const handleUltimos12Meses = () => {
    const hoy = new Date();
    const hace12Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
    const filtered = inflacionHistorica.filter(
      (item) => new Date(item.fecha) >= hace12Meses,
    );
    setFiltrada(filtered);
    setFechaInicio(hace12Meses);
    setFechaFin(hoy);
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

      <ThemeProvider theme={muiTheme}>
        <LocalizationProvider dateAdapter={AdapterDateFns} locale={esLocale}>
          {/* Inputs */}
          <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
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
            <Button variant="outlined" color="primary" onClick={handleFiltrar}>
              Filtrar
            </Button>
            <Button variant="outlined" color="error" onClick={handleReset}>
              Reset
            </Button>
            <Button
              variant="outlined"
              color="success"
              onClick={handleUltimos12Meses}
            >
              Últimos 12 meses
            </Button>
          </Stack>
        </LocalizationProvider>
      </ThemeProvider>

      {/* Gráfico responsive */}
      {filtrada.length > 0 ? (
        <div
          className="
            w-full
            max-w-full
            lg:max-w-5xl
            xl:max-w-6xl
            bg-white dark:bg-gray-800
            p-2 md:p-4
            rounded shadow
          "
        >
          <div className="h-[320px] md:h-[420px] xl:h-[520px]">
            <Line
              data={chartData}
              options={{
                ...chartOptions,
                maintainAspectRatio: false,
              }}
            />
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
