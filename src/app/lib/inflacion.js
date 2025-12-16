const BASE_URL = "https://api.argentinadatos.com/v1/finanzas/indices";

async function fetchInflacion(endpoint) {
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Error obteniendo ${endpoint}`);
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

// ---- API pública ----

export async function getInflacionMensualActual() {
  const data = await fetchInflacion("inflacion");
  return getUltimoDato(data);
}

export async function getInflacionInteranualActual() {
  const data = await fetchInflacion("inflacionInteranual");
  return getUltimoDato(data);
}

// (opcional, por si luego querés gráficos)
export async function getInflacionMensualHistorica() {
  return fetchInflacion("inflacion");
}
