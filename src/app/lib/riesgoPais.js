const BASE_URL =
  "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo";

async function fetchRiesgoPaisUltimo() {
  const res = await fetch(BASE_URL, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Error obteniendo datos`);
  }
  return res.json();
}

export async function getRiesgoPaisUltimo() {
  const data = await fetchRiesgoPaisUltimo();
  return data;
}
