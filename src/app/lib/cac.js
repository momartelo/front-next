export async function getCACHistorico() {
  const res = await fetch("https://prestamos.ikiwi.net.ar/api/cacs", {
    next: { revalidate: 86400 }, // 1 vez por día (más que suficiente)
  });

  if (!res.ok) {
    throw new Error("Error al obtener CAC");
  }

  const data = await res.json();

  // Ordenamos por fecha por las dudas
  data.sort((a, b) => new Date(a.period) - new Date(b.period));

  return data;
}
