import { kv } from "@vercel/kv";
import { cache } from "react";

const RESOURCE_ID = "80ac25de-a44a-4445-9215-090cf55cfda5";

const BASE_URL = `https://datos.energia.gob.ar/api/3/action/datastore_search?resource_id=${RESOURCE_ID}`;

const normalize = (v) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const EMPRESAS = {
  ypf: ["ypf"],

  shell: ["shell", "shell c.a.p.s.a", "raizen"],

  axion: ["axion", "axion energy", "pan american", "p.a.e", "pae"],

  puma: ["puma", "puma energy", "trafigura"],

  gulf: ["gulf"],

  refinor: ["refinor", "refinor s.a"],

  dapsa: ["dapsa", "dapsa s.a", "destileria argentina de petroleo"],

  voy: ["voy", "voy con energia"],

  blanca: ["blanca", "sin bandera"],
};

function detectarEmpresa(nombre) {
  const n = normalize(nombre);

  for (const empresa in EMPRESAS) {
    if (EMPRESAS[empresa].some((k) => n.includes(k))) {
      return empresa;
    }
  }

  return null;
}

function detectarProducto(nombre) {
  const n = normalize(nombre);

  if (n.includes("super") && n.includes("nafta")) return "naftaSuper";
  if (n.includes("premium") && n.includes("nafta")) return "naftaPremium";
  if (n.includes("grado 2")) return "gasoilComun";
  if (n.includes("grado 3")) return "gasoilPremium";

  return null;
}

async function fetchAllRecords() {
  const limit = 1000;
  let offset = 0;

  let all = [];
  let total = Infinity;

  while (offset < total) {
    const url = `${BASE_URL}&limit=${limit}&offset=${offset}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const json = await res.json();

    const records = json?.result?.records || [];
    total = json?.result?.total || 0;

    all.push(...records);

    offset += limit;
  }

  return all;
}

function procesarRegistros(records) {
  const localidades = {};

  for (const r of records) {
    const localidad = r.localidad?.trim();
    if (!localidad) continue;

    const empresa = detectarEmpresa(r.empresabandera);
    if (!empresa) continue;

    const producto = detectarProducto(r.producto);
    if (!producto) continue;

    const precio = Number(r.precio);
    const fecha = r.fecha_vigencia;

    // crear localidad si no existe
    if (!localidades[localidad]) {
      localidades[localidad] = {};
    }

    // crear empresa si no existe
    if (!localidades[localidad][empresa]) {
      localidades[localidad][empresa] = {};
    }

    const empresaData = localidades[localidad][empresa];

    if (!empresaData[producto]) {
      empresaData[producto] = { precio, fecha };
      continue;
    }

    const actual = empresaData[producto];

    if (
      new Date(fecha) > new Date(actual.fecha) ||
      (fecha === actual.fecha && precio > actual.precio)
    ) {
      empresaData[producto] = { precio, fecha };
    }
  }

  const resultado = {};

  for (const localidad in localidades) {
    resultado[localidad] = {};

    for (const empresa in localidades[localidad]) {
      const data = localidades[localidad][empresa];

      const fechas = Object.values(data).map((x) =>
        new Date(x.fecha).getTime(),
      );

      resultado[localidad][empresa] = {
        empresa: empresa.toUpperCase(),
        localidad,
        fechaActualizacion: fechas.length
          ? new Date(Math.max(...fechas)).toISOString().slice(0, 10)
          : null,
        nafta: {
          super: data.naftaSuper?.precio ?? null,
          premium: data.naftaPremium?.precio ?? null,
        },
        gasoil: {
          comun: data.gasoilComun?.precio ?? null,
          premium: data.gasoilPremium?.precio ?? null,
        },
      };
    }
  }

  return resultado;
}

export const getCombustiblesPorLocalidad = cache(async () => {
  try {
    const cached = await kv.get("combustibles_localidades");

    if (cached) return cached;

    const records = await fetchAllRecords();

    console.log("TOTAL RECORDS:", records.length);

    const data = procesarRegistros(records);

    await kv.set("combustibles_localidades", data, {
      ex: 86400,
    });

    return data;
  } catch (error) {
    console.error("Error combustibles:", error);
    return null;
  }
});
