export function formatFechaHora(iso) {
  const d = new Date(iso);

  return {
    fecha: d.toLocaleDateString("es-AR"),
    hora: d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export const formatPeriodoCAC = (period) => {
  if (!period) return "-";

  const [year, month] = period.split("-"); // "2025", "10", "01"

  const date = new Date(Number(year), Number(month) - 1);

  return date.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
};
