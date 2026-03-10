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
  shell: ["shell", "raizen"],
  axion: ["axion", "pan american", "pae"],
  puma: ["puma", "trafigura"],
  gulf: ["gulf"],
  refinor: ["refinor"],
  dapsa: ["dapsa"],
  voy: ["voy"],
  independiente: ["blanca", "sin bandera"],
};

function detectarEmpresa(nombre) {
  const n = normalize(nombre);
  for (const empresa in EMPRESAS) {
    if (EMPRESAS[empresa].some((k) => n.includes(k))) return empresa;
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
  const limit = 5000;
  let offset = 0;
  let all = [];
  let total = Infinity;

  while (offset < total) {
    const res = await fetch(`${BASE_URL}&limit=${limit}&offset=${offset}`, {
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
    const provincia = r.provincia?.trim();
    if (!localidad || !provincia) continue;

    const empresa = detectarEmpresa(r.empresabandera);
    if (!empresa) continue;

    const producto = detectarProducto(r.producto);
    if (!producto) continue;

    const precio = Number(r.precio);
    const fecha = r.fecha_vigencia;

    if (!localidades[localidad]) localidades[localidad] = {};
    if (!localidades[localidad][empresa])
      localidades[localidad][empresa] = { _provincia: provincia };

    const empresaData = localidades[localidad][empresa];

    if (
      !empresaData[producto] ||
      new Date(fecha) > new Date(empresaData[producto].fecha)
    ) {
      empresaData[producto] = { precio, fecha };
    }
  }

  const resultado = {};
  for (const loc in localidades) {
    resultado[loc] = {};
    for (const emp in localidades[loc]) {
      const data = localidades[loc][emp];
      const fechas = Object.values(data)
        .filter((x) => x.fecha)
        .map((x) => new Date(x.fecha).getTime());

      resultado[loc][emp] = {
        empresa: emp.toUpperCase(),
        localidad: loc,
        provincia: data._provincia,
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
    // Usamos v2 para forzar la actualización de la estructura con provincia
    const cached = await kv.get("combustibles_v2");
    if (cached) return cached;

    const records = await fetchAllRecords();
    const data = procesarRegistros(records);
    await kv.set("combustibles_v2", data, { ex: 86400 });
    return data;
  } catch (error) {
    return null;
  }
});
