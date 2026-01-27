"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { getInflacionMensualHistorica } from "../lib/inflacion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

import { TextField, Button, Stack, Box } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import esLocale from "date-fns/locale/es";

export default function InflationDashboard() {
  const [inflacionHistorica, setInflacionHistorica] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [filtrada, setFiltrada] = useState([]);

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
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Inflación mensual histórica
      </h1>

      <LocalizationProvider dateAdapter={AdapterDateFns} locale={esLocale}>
        {/* Inputs centrados */}
        <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
          <DatePicker
            views={["year", "month"]}
            label="Desde"
            value={fechaInicio}
            onChange={setFechaInicio}
            slotProps={{
              textField: {
                size: "small",
                sx: { width: 200 }, // 👈 acá se achica de verdad
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

        {/* Botones centrados debajo */}
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

      {filtrada.length > 0 ? (
        <div className="bg-white p-2 rounded shadow w-full max-w-4xl">
          <Line data={chartData} />
        </div>
      ) : (
        <p>No hay datos para el rango seleccionado.</p>
      )}
    </div>
  );
}
