const BASE_URL = "https://dolarapi.com/v1";

export async function getDolares() {
  const res = await fetch(`${BASE_URL}/dolares`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Error obteniendo dólares");
  }
  console.log(res);
  return res.json();
}

export async function getEuro() {
  const res = await fetch(`${BASE_URL}/cotizaciones/eur`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Error obteniendo euro");
  }

  return res.json();
}

export async function getReal() {
  const res = await fetch(`${BASE_URL}/cotizaciones/brl`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Error obteniendo real");
  }

  return res.json();
}
