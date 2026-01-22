const BASE_URL = "https://api.argentinadatos.com/v1/finanzas/indices/uva";

async function fetchIndiceUVA() {
  const res = await fetch(BASE_URL, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Error obteniendo indices`);
  }
  return res.json();
}

function getUltimoDato(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return data
    .slice()
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .at(-1);
}

export async function getIndiceUVAActual() {
  const data = await fetchIndiceUVA();
  return getUltimoDato(data);
}
