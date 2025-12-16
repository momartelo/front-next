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
