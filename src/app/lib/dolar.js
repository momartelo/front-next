const BASE_URL = "https://dolarapi.com/v1";

const isDev = process.env.NODE_ENV === "development";

export async function getDolares() {
  const res = await fetch(`${BASE_URL}/dolares`, {
    cache: isDev ? "no-store" : undefined,
    // next: { revalidate: isDev ? 0 : 60 },
  });

  if (!res.ok) {
    throw new Error("Error obteniendo dólares");
  }

  return res.json();
}

export async function getEuro() {
  const res = await fetch(`${BASE_URL}/cotizaciones/eur`, {
    cache: isDev ? "no-store" : undefined,
    next: { revalidate: isDev ? 0 : 60 },
  });

  if (!res.ok) {
    throw new Error("Error obteniendo euro");
  }

  return res.json();
}

export async function getReal() {
  const res = await fetch(`${BASE_URL}/cotizaciones/brl`, {
    cache: isDev ? "no-store" : undefined,
    next: { revalidate: isDev ? 0 : 60 },
  });

  if (!res.ok) {
    throw new Error("Error obteniendo real");
  }

  return res.json();
}
