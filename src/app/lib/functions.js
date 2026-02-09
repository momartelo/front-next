export const formatMesAnio = (fecha) => {
  const d = new Date(fecha);
  const mes = d
    .toLocaleDateString("es-AR", { month: "short" })
    .replace(".", "");
  const anio = d.getFullYear().toString().slice(-2);
  return `${mes}-${anio}`;
};

export const formatFechaCompleta = (fecha) => {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
