import { kv } from "@vercel/kv";
import { cache } from "react";

// Importación estática: Vercel incluye el JSON en el build.
import localOverrides from "../../../public/data/overrides.json";

// API y CSV de la Secretaría de Energía
const DATASET_URL =
  "https://datos.energia.gob.ar/api/3/action/datastore_search";

const RESOURCE_ID = "80ac25de-a44a-4445-9215-090cf55cfda5";

const CSV_URL =
  "https://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv";

// --------------------------------------------------
// CONFIGURACIÓN KV
// --------------------------------------------------

function tieneCredencialesKV() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  return Boolean(url && token && url.startsWith("https://"));
}

// --------------------------------------------------
// NORMALIZACIÓN
// --------------------------------------------------

const normalize = (v) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

// --------------------------------------------------
// EMPRESAS Y PRODUCTOS
// --------------------------------------------------

const EMPRESAS = {
  ypf: ["ypf"],
  shell: ["shell"],
  axion: ["axion", "pan american", "p.a.e."],
  puma: ["puma", "trafigura"],
};

const PRODUCTOS = {
  naftaSuper: ["nafta (super) entre 92 y 95 ron"],
  naftaPremium: ["nafta (premium) de mas de 95 ron"],
  gasoilComun: ["gas oil grado 2"],
  gasoilPremium: ["gas oil grado 3"],
};

// --------------------------------------------------
// PARSER DE CSV DE RESPALDO
// --------------------------------------------------

function parseCSV(text) {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const obj = {};

    headers.forEach((header, index) => {
      let value = currentLine[index] ? currentLine[index].trim() : "";
      value = value.replace(/^"|"$/g, "");
      obj[header] = value;
    });

    if (
      obj.localidad &&
      obj.localidad.toUpperCase().includes("MAR DEL PLATA")
    ) {
      records.push(obj);
    }
  }

  return records;
}

async function obtenerRegistrosCSV() {
  try {
    console.warn("La API falló. Intentando descargar el CSV directamente...");
    const res = await fetch(CSV_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) throw new Error(`HTTP error descargando CSV: ${res.status}`);

    const csvText = await res.text();
    const records = parseCSV(csvText);

    return records;
  } catch (error) {
    console.error(
      "Error al descargar o procesar el CSV oficial:",
      error.message,
    );
    return [];
  }
}

// --------------------------------------------------
// OBTENER ÚLTIMO PRECIO DE UN PRODUCTO
// --------------------------------------------------

function getLatestPrice(rows, productNames) {
  const filtered = rows.filter((r) =>
    productNames.includes(normalize(r.producto)),
  );

  if (!filtered.length) return null;

  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.fecha_vigencia).getTime() -
      new Date(a.fecha_vigencia).getTime(),
  );

  const latestDate = sorted[0].fecha_vigencia;

  const sameDayRows = sorted.filter((r) => r.fecha_vigencia === latestDate);

  const prices = sameDayRows
    .map((r) => Number(r.precio))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (!prices.length) return null;

  const price = Math.max(...prices);

  return {
    precio: Number(price.toFixed(2)),
    fecha: latestDate,
  };
}

// --------------------------------------------------
// CONSTRUIR OBJETO DE UNA EMPRESA
// --------------------------------------------------

function buildEmpresa(records, empresaKey, nombre, fuenteOrigen = "api") {
  const keywords = EMPRESAS[empresaKey];

  const baseRows = records.filter((r) => {
    const nombreEnCSV = normalize(r.empresabandera);

    return keywords.some((key) => nombreEnCSV.includes(key));
  });

  if (!baseRows.length) return null;

  let rows = baseRows.filter((r) => String(r.idtipohorario) === "1");

  if (rows.length === 0) {
    rows = baseRows;
  }

  const naftaSuper = getLatestPrice(rows, PRODUCTOS.naftaSuper);
  const naftaPremium = getLatestPrice(rows, PRODUCTOS.naftaPremium);
  const gasoilComun = getLatestPrice(rows, PRODUCTOS.gasoilComun);
  const gasoilPremium = getLatestPrice(rows, PRODUCTOS.gasoilPremium);

  const fechas = [naftaSuper, naftaPremium, gasoilComun, gasoilPremium]
    .filter(Boolean)
    .map((x) => new Date(x.fecha).getTime())
    .filter(Number.isFinite);

  return {
    empresa: nombre,
    localidad: "Mar del Plata",
    fuente: fuenteOrigen, // Indica si vino de "api" o "csv"
    fechaActualizacion: fechas.length
      ? new Date(Math.max(...fechas)).toISOString().slice(0, 10)
      : null,
    nafta: {
      super: naftaSuper,
      premium: naftaPremium,
    },
    gasoil: {
      comun: gasoilComun,
      premium: gasoilPremium,
    },
  };
}

// --------------------------------------------------
// ELEGIR ENTRE PRECIO OFICIAL Y MANUAL
// --------------------------------------------------

function elegirObjetoProducto(oficial, manual) {
  if (!oficial && !manual) return null;
  if (!oficial) return manual;
  if (!manual) return oficial;

  const fechaOficial = oficial.fecha || "1900-01-01";
  const fechaManual = manual.fecha || "1900-01-01";

  return new Date(fechaManual) > new Date(fechaOficial) ? manual : oficial;
}

// --------------------------------------------------
// APLICAR OVERRIDES MANUALES
// --------------------------------------------------

function aplicarOverrideHibrido(oficial, manual) {
  if (!manual && !oficial) return null;

  if (!manual) return oficial;

  if (!oficial) {
    return {
      ...manual,
      manual: true,
      fuente: "manual",
    };
  }

  const naftaSuper = elegirObjetoProducto(
    oficial.nafta?.super,
    manual.nafta?.super,
  );

  const naftaPremium = elegirObjetoProducto(
    oficial.nafta?.premium,
    manual.nafta?.premium,
  );

  const gasoilComun = elegirObjetoProducto(
    oficial.gasoil?.comun,
    manual.gasoil?.comun,
  );

  const gasoilPremium = elegirObjetoProducto(
    oficial.gasoil?.premium,
    manual.gasoil?.premium,
  );

  // Verificamos si alguno de los productos usó override manual
  const usoSuper = Boolean(
    manual.nafta?.super && naftaSuper === manual.nafta.super,
  );
  const usoPremium = Boolean(
    manual.nafta?.premium && naftaPremium === manual.nafta.premium,
  );
  const usoGasoilComun = Boolean(
    manual.gasoil?.comun && gasoilComun === manual.gasoil.comun,
  );
  const usoGasoilPremium = Boolean(
    manual.gasoil?.premium && gasoilPremium === manual.gasoil.premium,
  );

  const manualUsed =
    usoSuper || usoPremium || usoGasoilComun || usoGasoilPremium;

  const fechas = [
    naftaSuper?.fecha,
    naftaPremium?.fecha,
    gasoilComun?.fecha,
    gasoilPremium?.fecha,
  ].filter(Boolean);

  const fechasValidas = fechas
    .map((f) => new Date(f).getTime())
    .filter(Number.isFinite);

  const fechaActualizacion = fechasValidas.length
    ? new Date(Math.max(...fechasValidas)).toISOString().slice(0, 10)
    : null;

  return {
    empresa: oficial.empresa || manual.empresa,
    localidad: oficial.localidad || manual.localidad,
    fuente: manualUsed ? "manual" : oficial.fuente, // Mantiene "api" o "csv" si no usó manual
    fechaActualizacion,
    manual: Boolean(manualUsed),
    nafta: {
      super: naftaSuper,
      premium: naftaPremium,
    },
    gasoil: {
      comun: gasoilComun,
      premium: gasoilPremium,
    },
  };
}

// --------------------------------------------------
// CASCADA: API OFICIAL -> CSV DIRECTO
// --------------------------------------------------

async function obtenerRegistrosOficialesConFuente() {
  const params = new URLSearchParams({
    resource_id: RESOURCE_ID,
    limit: "1000",
    filters: JSON.stringify({
      localidad: "MAR DEL PLATA",
    }),
  });

  const url = `${DATASET_URL}?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    if (!json?.success || !Array.isArray(json?.result?.records)) {
      throw new Error("Estructura de JSON inválida");
    }

    clearTimeout(timeout);
    return { records: json.result.records, fuente: "api" };
  } catch (error) {
    clearTimeout(timeout);
    console.warn("La API oficial falló. Usando respaldo CSV...", error.message);

    const recordsCSV = await obtenerRegistrosCSV();
    return { records: recordsCSV, fuente: "csv" };
  }
}

// --------------------------------------------------
// OBTENER OVERRIDES: KV O JSON LOCAL
// --------------------------------------------------

async function obtenerOverrides() {
  let overrides = null;

  if (tieneCredencialesKV()) {
    try {
      overrides = await kv.get("combustibles_overrides");
    } catch (error) {
      console.warn("Error leyendo Vercel KV:", error.message);
    }
  }

  if (
    !overrides ||
    typeof overrides !== "object" ||
    Object.keys(overrides).length === 0
  ) {
    overrides = localOverrides;
  }

  return overrides;
}

// --------------------------------------------------
// FUNCIÓN PRINCIPAL
// --------------------------------------------------

export const getCombustiblesMarDelPlata = cache(async () => {
  try {
    // 1. Obtener registros y la fuente detectada ("api" o "csv")
    const { records, fuente } = await obtenerRegistrosOficialesConFuente();

    // 2. Construir datos por empresa pasando la fuente detectada
    let ypf = buildEmpresa(records, "ypf", "YPF", fuente);
    let shell = buildEmpresa(records, "shell", "Shell", fuente);
    let axion = buildEmpresa(records, "axion", "Axion", fuente);
    let puma = buildEmpresa(records, "puma", "Puma", fuente);

    // 3. Obtener overrides
    const overrides = await obtenerOverrides();

    // 4. Combinar precios
    if (overrides) {
      ypf = overrides.ypf ? aplicarOverrideHibrido(ypf, overrides.ypf) : ypf;
      shell = overrides.shell
        ? aplicarOverrideHibrido(shell, overrides.shell)
        : shell;
      axion = overrides.axion
        ? aplicarOverrideHibrido(axion, overrides.axion)
        : axion;
      puma = overrides.puma
        ? aplicarOverrideHibrido(puma, overrides.puma)
        : puma;
    }

    // 5. Resultado final
    const resultado = {
      ypf,
      shell,
      axion,
      puma,
    };

    if (!Object.values(resultado).some(Boolean)) {
      console.error("No hay precios disponibles.");
      return null;
    }

    return resultado;
  } catch (error) {
    console.error("Error general en Combustibles:", error);
    return null;
  }
});

//----------------------------------------------------------------------

// import { kv } from "@vercel/kv";
// import { cache } from "react";

// // Importación estática: Vercel incluye el JSON en el build.
// import localOverrides from "../../../public/data/overrides.json";

// // API de la Secretaría de Energía
// const DATASET_URL =
//   "https://datos.energia.gob.ar/api/3/action/datastore_search";

// const RESOURCE_ID = "80ac25de-a44a-4445-9215-090cf55cfda5";

// // --------------------------------------------------
// // CONFIGURACIÓN KV
// // --------------------------------------------------

// function tieneCredencialesKV() {
//   const url = process.env.KV_REST_API_URL;
//   const token = process.env.KV_REST_API_TOKEN;

//   return Boolean(url && token && url.startsWith("https://"));
// }

// // --------------------------------------------------
// // NORMALIZACIÓN
// // --------------------------------------------------

// const normalize = (v) =>
//   String(v || "")
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .trim();

// // --------------------------------------------------
// // EMPRESAS Y PRODUCTOS
// // --------------------------------------------------

// const EMPRESAS = {
//   ypf: ["ypf"],
//   shell: ["shell"],
//   axion: ["axion", "pan american", "p.a.e."],
//   puma: ["puma", "trafigura"],
// };

// const PRODUCTOS = {
//   naftaSuper: ["nafta (super) entre 92 y 95 ron"],
//   naftaPremium: ["nafta (premium) de mas de 95 ron"],
//   gasoilComun: ["gas oil grado 2"],
//   gasoilPremium: ["gas oil grado 3"],
// };

// // --------------------------------------------------
// // OBTENER ÚLTIMO PRECIO DE UN PRODUCTO
// // --------------------------------------------------

// function getLatestPrice(rows, productNames) {
//   const filtered = rows.filter((r) =>
//     productNames.includes(normalize(r.producto)),
//   );

//   if (!filtered.length) return null;

//   const sorted = [...filtered].sort(
//     (a, b) =>
//       new Date(b.fecha_vigencia).getTime() -
//       new Date(a.fecha_vigencia).getTime(),
//   );

//   const latestDate = sorted[0].fecha_vigencia;

//   const sameDayRows = sorted.filter((r) => r.fecha_vigencia === latestDate);

//   const prices = sameDayRows
//     .map((r) => Number(r.precio))
//     .filter((price) => Number.isFinite(price) && price > 0);

//   if (!prices.length) return null;

//   const price = Math.max(...prices);

//   return {
//     precio: Number(price.toFixed(2)),
//     fecha: latestDate,
//   };
// }

// // --------------------------------------------------
// // CONSTRUIR OBJETO DE UNA EMPRESA
// // --------------------------------------------------

// function buildEmpresa(records, empresaKey, nombre) {
//   const keywords = EMPRESAS[empresaKey];

//   const baseRows = records.filter((r) => {
//     const nombreEnCSV = normalize(r.empresabandera);

//     return keywords.some((key) => nombreEnCSV.includes(key));
//   });

//   if (!baseRows.length) return null;

//   // Priorizar estaciones con horario habitual.
//   let rows = baseRows.filter((r) => String(r.idtipohorario) === "1");

//   if (rows.length === 0) {
//     rows = baseRows;
//   }

//   const naftaSuper = getLatestPrice(rows, PRODUCTOS.naftaSuper);

//   const naftaPremium = getLatestPrice(rows, PRODUCTOS.naftaPremium);

//   const gasoilComun = getLatestPrice(rows, PRODUCTOS.gasoilComun);

//   const gasoilPremium = getLatestPrice(rows, PRODUCTOS.gasoilPremium);

//   const fechas = [naftaSuper, naftaPremium, gasoilComun, gasoilPremium]
//     .filter(Boolean)
//     .map((x) => new Date(x.fecha).getTime())
//     .filter(Number.isFinite);

//   return {
//     empresa: nombre,
//     localidad: "Mar del Plata",
//     fechaActualizacion: fechas.length
//       ? new Date(Math.max(...fechas)).toISOString().slice(0, 10)
//       : null,
//     nafta: {
//       super: naftaSuper,
//       premium: naftaPremium,
//     },
//     gasoil: {
//       comun: gasoilComun,
//       premium: gasoilPremium,
//     },
//   };
// }

// // --------------------------------------------------
// // ELEGIR ENTRE PRECIO OFICIAL Y MANUAL
// // --------------------------------------------------

// function elegirObjetoProducto(oficial, manual) {
//   if (!oficial && !manual) return null;
//   if (!oficial) return manual;
//   if (!manual) return oficial;

//   const fechaOficial = oficial.fecha || "1900-01-01";
//   const fechaManual = manual.fecha || "1900-01-01";

//   return new Date(fechaManual) > new Date(fechaOficial) ? manual : oficial;
// }

// // --------------------------------------------------
// // APLICAR OVERRIDES MANUALES
// // --------------------------------------------------

// function aplicarOverrideHibrido(oficial, manual) {
//   if (!manual && !oficial) return null;

//   if (!manual) return oficial;

//   // Si no hay información oficial, utilizar los datos manuales.
//   if (!oficial) {
//     return {
//       ...manual,
//       manual: true,
//     };
//   }

//   const naftaSuper = elegirObjetoProducto(
//     oficial.nafta?.super,
//     manual.nafta?.super,
//   );

//   const naftaPremium = elegirObjetoProducto(
//     oficial.nafta?.premium,
//     manual.nafta?.premium,
//   );

//   const gasoilComun = elegirObjetoProducto(
//     oficial.gasoil?.comun,
//     manual.gasoil?.comun,
//   );

//   const gasoilPremium = elegirObjetoProducto(
//     oficial.gasoil?.premium,
//     manual.gasoil?.premium,
//   );

//   const manualUsed =
//     (manual.nafta?.super && naftaSuper === manual.nafta.super) ||
//     (manual.nafta?.premium && naftaPremium === manual.nafta.premium) ||
//     (manual.gasoil?.comun && gasoilComun === manual.gasoil.comun) ||
//     (manual.gasoil?.premium && gasoilPremium === manual.gasoil.premium);

//   const fechas = [
//     naftaSuper?.fecha,
//     naftaPremium?.fecha,
//     gasoilComun?.fecha,
//     gasoilPremium?.fecha,
//   ].filter(Boolean);

//   const fechasValidas = fechas
//     .map((f) => new Date(f).getTime())
//     .filter(Number.isFinite);

//   const fechaActualizacion = fechasValidas.length
//     ? new Date(Math.max(...fechasValidas)).toISOString().slice(0, 10)
//     : null;

//   return {
//     empresa: oficial.empresa || manual.empresa,
//     localidad: oficial.localidad || manual.localidad,
//     fechaActualizacion,
//     manual: Boolean(manualUsed),
//     nafta: {
//       super: naftaSuper,
//       premium: naftaPremium,
//     },
//     gasoil: {
//       comun: gasoilComun,
//       premium: gasoilPremium,
//     },
//   };
// }

// // --------------------------------------------------
// // CONSULTAR API OFICIAL
// // --------------------------------------------------

// async function obtenerRegistrosOficiales() {
//   const params = new URLSearchParams({
//     resource_id: RESOURCE_ID,
//     limit: "1000",
//     filters: JSON.stringify({
//       localidad: "MAR DEL PLATA",
//     }),
//   });

//   const controller = new AbortController();

//   const timeout = setTimeout(() => {
//     controller.abort();
//   }, 8000);

//   try {
//     const url = `${DATASET_URL}?${params.toString()}`;

//     const res = await fetch(url, {
//       method: "GET",
//       cache: "no-store",
//       signal: controller.signal,
//       headers: {
//         "User-Agent": "Mozilla/5.0",
//         Accept: "application/json",
//       },
//     });

//     if (!res.ok) {
//       const detalle = await res.text();

//       console.error(
//         `No se pudo actualizar desde la API de combustibles: HTTP ${res.status}`,
//         detalle,
//       );

//       return [];
//     }

//     const json = await res.json();

//     if (!json?.success || !Array.isArray(json?.result?.records)) {
//       console.warn("La API de Energía no devolvió registros válidos.");

//       return [];
//     }

//     return json.result.records;
//   } catch (error) {
//     console.error("Error consultando la API de combustibles:", error.message);

//     return [];
//   } finally {
//     clearTimeout(timeout);
//   }
// }

// // --------------------------------------------------
// // OBTENER OVERRIDES: KV O JSON LOCAL
// // --------------------------------------------------

// async function obtenerOverrides() {
//   let overrides = null;

//   // Primero intentar Vercel KV.
//   if (tieneCredencialesKV()) {
//     try {
//       overrides = await kv.get("combustibles_overrides");
//     } catch (error) {
//       console.warn("Error leyendo Vercel KV:", error.message);
//     }
//   }

//   // Si KV no tiene datos, utilizar el JSON local.
//   if (
//     !overrides ||
//     typeof overrides !== "object" ||
//     Object.keys(overrides).length === 0
//   ) {
//     overrides = localOverrides;
//   }

//   return overrides;
// }

// // --------------------------------------------------
// // FUNCIÓN PRINCIPAL
// // --------------------------------------------------

// export const getCombustiblesMarDelPlata = cache(async () => {
//   try {
//     // 1. Obtener datos oficiales.
//     const records = await obtenerRegistrosOficiales();

//     // 2. Construir datos por empresa.
//     let ypf = buildEmpresa(records, "ypf", "YPF");
//     let shell = buildEmpresa(records, "shell", "Shell");
//     let axion = buildEmpresa(records, "axion", "Axion");
//     let puma = buildEmpresa(records, "puma", "Puma");

//     // 3. Obtener datos manuales.
//     const overrides = await obtenerOverrides();

//     // 4. Combinar precios oficiales y manuales.
//     if (overrides) {
//       ypf = overrides.ypf ? aplicarOverrideHibrido(ypf, overrides.ypf) : ypf;

//       shell = overrides.shell
//         ? aplicarOverrideHibrido(shell, overrides.shell)
//         : shell;

//       axion = overrides.axion
//         ? aplicarOverrideHibrido(axion, overrides.axion)
//         : axion;

//       puma = overrides.puma
//         ? aplicarOverrideHibrido(puma, overrides.puma)
//         : puma;
//     }

//     // 5. Resultado final.
//     const resultado = {
//       ypf,
//       shell,
//       axion,
//       puma,
//     };

//     // Si no hay datos de ninguna fuente.
//     if (!Object.values(resultado).some(Boolean)) {
//       console.error("No hay precios oficiales ni manuales disponibles.");

//       return null;
//     }

//     return resultado;
//   } catch (error) {
//     console.error("Error en Combustibles:", error);

//     return null;
//   }
// });

// ----------------------------------------------------------------------------------------------------------------------

// import fs from "fs";
// import path from "path";

// const DATASET_URL =
//   'http://datos.energia.gob.ar/api/3/action/datastore_search?resource_id=80ac25de-a44a-4445-9215-090cf55cfda5&filters={"localidad":"MAR DEL PLATA"}';

// const normalize = (v) =>
//   String(v || "")
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .trim();

// const EMPRESAS = {
//   ypf: ["ypf"],
//   shell: ["shell"],
//   axion: ["axion", "pan american", "p.a.e."],
//   puma: ["puma", "trafigura"],
// };

// const PRODUCTOS = {
//   naftaSuper: ["nafta (super) entre 92 y 95 ron"],
//   naftaPremium: ["nafta (premium) de mas de 95 ron"],
//   gasoilComun: ["gas oil grado 2"],
//   gasoilPremium: ["gas oil grado 3"],
// };

// // Devuelve el precio más reciente de un producto
// function getLatestPrice(rows, productNames) {
//   const filtered = rows.filter((r) =>
//     productNames.includes(normalize(r.producto)),
//   );

//   if (!filtered.length) return null;

//   const sorted = filtered.sort(
//     (a, b) =>
//       new Date(b.fecha_vigencia).getTime() -
//       new Date(a.fecha_vigencia).getTime(),
//   );

//   const latestDate = sorted[0].fecha_vigencia;
//   const sameDayRows = sorted.filter((r) => r.fecha_vigencia === latestDate);
//   const price = Math.max(...sameDayRows.map((r) => Number(r.precio)));

//   return { precio: Number(price.toFixed(2)), fecha: latestDate };
// }

// // Construye datos de la empresa desde oficial, incluyendo fechas por producto
// function buildEmpresa(records, empresaKey, nombre) {
//   const keywords = EMPRESAS[empresaKey];

//   const baseRows = records.filter((r) => {
//     const nombreEnCSV = normalize(r.empresabandera);
//     return keywords.some((key) => nombreEnCSV.includes(key));
//   });

//   if (!baseRows.length) return null;

//   let rows = baseRows.filter((r) => String(r.idtipohorario) === "1");
//   if (rows.length === 0) rows = baseRows;

//   const naftaSuper = getLatestPrice(rows, PRODUCTOS.naftaSuper);
//   const naftaPremium = getLatestPrice(rows, PRODUCTOS.naftaPremium);
//   const gasoilComun = getLatestPrice(rows, PRODUCTOS.gasoilComun);
//   const gasoilPremium = getLatestPrice(rows, PRODUCTOS.gasoilPremium);

//   const fechas = [naftaSuper, naftaPremium, gasoilComun, gasoilPremium]
//     .filter(Boolean)
//     .map((x) => new Date(x.fecha).getTime());

//   return {
//     empresa: nombre,
//     localidad: "Mar del Plata",
//     fechaActualizacion: fechas.length
//       ? new Date(Math.max(...fechas)).toISOString().slice(0, 10)
//       : null,
//     nafta: {
//       super: naftaSuper?.precio ?? null,
//       premium: naftaPremium?.precio ?? null,
//     },
//     gasoil: {
//       comun: gasoilComun?.precio ?? null,
//       premium: gasoilPremium?.precio ?? null,
//     },
//     // Fechas individuales por producto
//     naftaSuperFecha: naftaSuper?.fecha ?? null,
//     naftaPremiumFecha: naftaPremium?.fecha ?? null,
//     gasoilComunFecha: gasoilComun?.fecha ?? null,
//     gasoilPremiumFecha: gasoilPremium?.fecha ?? null,
//   };
// }

// // Compara precio oficial vs override por fecha
// function elegirPrecio(oficial, manual) {
//   if (!oficial) return manual?.precio ?? null;
//   if (!manual) return oficial?.precio ?? null;

//   const fechaOficial = oficial.fecha || "1900-01-01";
//   const fechaManual = manual.fecha || "1900-01-01";

//   return new Date(fechaManual) > new Date(fechaOficial)
//     ? manual.precio
//     : oficial.precio;
// }

// // Aplica overrides híbridos comparando fechas por producto
// function aplicarOverrideHibrido(oficial, manual) {
//   if (!manual) return oficial;

//   const naftaSuper = elegirPrecio(
//     { precio: oficial.nafta.super, fecha: oficial.naftaSuperFecha },
//     manual.nafta?.super,
//   );
//   const naftaPremium = elegirPrecio(
//     { precio: oficial.nafta.premium, fecha: oficial.naftaPremiumFecha },
//     manual.nafta?.premium,
//   );
//   const gasoilComun = elegirPrecio(
//     { precio: oficial.gasoil.comun, fecha: oficial.gasoilComunFecha },
//     manual.gasoil?.comun,
//   );
//   const gasoilPremium = elegirPrecio(
//     { precio: oficial.gasoil.premium, fecha: oficial.gasoilPremiumFecha },
//     manual.gasoil?.premium,
//   );

//   // Detectamos si algún precio viene del JSON
//   const manualUsed =
//     (manual.nafta?.super && naftaSuper === manual.nafta.super.precio) ||
//     (manual.nafta?.premium && naftaPremium === manual.nafta.premium.precio) ||
//     (manual.gasoil?.comun && gasoilComun === manual.gasoil.comun.precio) ||
//     (manual.gasoil?.premium && gasoilPremium === manual.gasoil.premium.precio);

//   // Fecha más reciente entre precios usados
//   const fechas = [
//     manual.nafta?.super?.fecha && naftaSuper === manual.nafta.super.precio
//       ? manual.nafta.super.fecha
//       : oficial.naftaSuperFecha,
//     manual.nafta?.premium?.fecha && naftaPremium === manual.nafta.premium.precio
//       ? manual.nafta.premium.fecha
//       : oficial.naftaPremiumFecha,
//     manual.gasoil?.comun?.fecha && gasoilComun === manual.gasoil.comun.precio
//       ? manual.gasoil.comun.fecha
//       : oficial.gasoilComunFecha,
//     manual.gasoil?.premium?.fecha &&
//     gasoilPremium === manual.gasoil.premium.precio
//       ? manual.gasoil.premium.fecha
//       : oficial.gasoilPremiumFecha,
//   ].filter(Boolean);

//   const fechaActualizacion =
//     fechas.length > 0
//       ? new Date(Math.max(...fechas.map((f) => new Date(f).getTime())))
//           .toISOString()
//           .slice(0, 10)
//       : null;

//   return {
//     empresa: oficial.empresa,
//     localidad: oficial.localidad,
//     fechaActualizacion,
//     manual: !!manualUsed, // <-- indicador de override
//     nafta: { super: naftaSuper, premium: naftaPremium },
//     gasoil: { comun: gasoilComun, premium: gasoilPremium },
//   };
// }

// // Función principal
// export async function getCombustiblesMarDelPlata() {
//   try {
//     const url = `${DATASET_URL}&limit=1000`;

//     const controller = new AbortController();
//     const timeout = setTimeout(() => controller.abort(), 8000);

//     const res = await fetch(url, {
//       method: "GET",
//       cache: "no-store",
//       signal: controller.signal,
//       headers: {
//         "User-Agent": "Mozilla/5.0",
//         Accept: "application/json",
//       },
//     });

//     clearTimeout(timeout);

//     if (!res.ok) {
//       console.error("HTTP Error en API Energía:", res.status);
//       return null;
//     }

//     const json = await res.json();
//     const records = json?.result?.records || [];

//     let ypf = buildEmpresa(records, "ypf", "YPF");
//     let shell = buildEmpresa(records, "shell", "Shell");
//     let axion = buildEmpresa(records, "axion", "Axion");
//     let puma = buildEmpresa(records, "puma", "Puma");

//     // Leer overrides desde filesystem
//     let overrides = {};
//     try {
//       const filePath = path.join(
//         process.cwd(),
//         "public",
//         "data",
//         "overrides.json",
//       );
//       const raw = fs.readFileSync(filePath, "utf8");
//       overrides = JSON.parse(raw);
//     } catch (err) {
//       console.warn("No se pudo cargar overrides.json, se usan datos oficiales");
//     }

//     // Aplicar overrides híbridos
//     if (overrides) {
//       ypf = overrides.ypf ? aplicarOverrideHibrido(ypf, overrides.ypf) : ypf;
//       shell = overrides.shell
//         ? aplicarOverrideHibrido(shell, overrides.shell)
//         : shell;
//       axion = overrides.axion
//         ? aplicarOverrideHibrido(axion, overrides.axion)
//         : axion;
//       puma = overrides.puma
//         ? aplicarOverrideHibrido(puma, overrides.puma)
//         : puma;
//     }

//     return { ypf, shell, axion, puma };
//   } catch (error) {
//     console.error("Error en Combustibles:", error);
//     return null;
//   }
// }

// --------------------------------------------------------------------------------------

// import https from "https";

// Volvemos a filtrar por Mar del Plata en la URL para que la API nos de solo lo que necesitamos
// const DATASET_URL =
//   'http://datos.energia.gob.ar/api/3/action/datastore_search?resource_id=80ac25de-a44a-4445-9215-090cf55cfda5&filters={"localidad":"MAR DEL PLATA"}';

// const normalize = (v) =>
//   String(v || "")
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .trim();

// const EMPRESAS = {
//   ypf: ["ypf"],
//   shell: ["shell"],
//   axion: ["axion", "pan american", "p.a.e."],
//   puma: ["puma", "trafigura"],
// };

// const PRODUCTOS = {
//   naftaSuper: ["nafta (super) entre 92 y 95 ron"],
//   naftaPremium: ["nafta (premium) de mas de 95 ron"],
//   gasoilComun: ["gas oil grado 2"],
//   gasoilPremium: ["gas oil grado 3"],
// };

// function getLatestPrice(rows, productNames) {
//   const filtered = rows.filter((r) =>
//     productNames.includes(normalize(r.producto)),
//   );

//   if (!filtered.length) return null;

//   const sorted = filtered.sort(
//     (a, b) =>
//       new Date(b.fecha_vigencia).getTime() -
//       new Date(a.fecha_vigencia).getTime(),
//   );

//   const latestDate = sorted[0].fecha_vigencia;
//   const sameDayRows = sorted.filter((r) => r.fecha_vigencia === latestDate);
//   const price = Math.max(...sameDayRows.map((r) => Number(r.precio)));

//   return { precio: Number(price.toFixed(2)), fecha: latestDate };
// }

// function buildEmpresa(records, empresaKey, nombre) {
//   const keywords = EMPRESAS[empresaKey];

//   // Filtramos por empresa en los registros de Mar del Plata
//   const baseRows = records.filter((r) => {
//     const nombreEnCSV = normalize(r.empresabandera);
//     return keywords.some((key) => nombreEnCSV.includes(key));
//   });

//   if (!baseRows.length) return null;

//   // Intentamos Diurno (1), si no hay (como pasa con Axion), usamos Nocturno
//   let rows = baseRows.filter((r) => String(r.idtipohorario) === "1");
//   if (rows.length === 0) {
//     rows = baseRows;
//   }

//   const naftaSuper = getLatestPrice(rows, PRODUCTOS.naftaSuper);
//   const naftaPremium = getLatestPrice(rows, PRODUCTOS.naftaPremium);
//   const gasoilComun = getLatestPrice(rows, PRODUCTOS.gasoilComun);
//   const gasoilPremium = getLatestPrice(rows, PRODUCTOS.gasoilPremium);

//   const fechas = [naftaSuper, naftaPremium, gasoilComun, gasoilPremium]
//     .filter(Boolean)
//     .map((x) => new Date(x.fecha).getTime());

//   return {
//     empresa: nombre,
//     localidad: "Mar del Plata",
//     fechaActualizacion: fechas.length
//       ? new Date(Math.max(...fechas)).toISOString().slice(0, 10)
//       : null,
//     nafta: {
//       super: naftaSuper?.precio ?? null,
//       premium: naftaPremium?.precio ?? null,
//     },
//     gasoil: {
//       comun: gasoilComun?.precio ?? null,
//       premium: gasoilPremium?.precio ?? null,
//     },
//   };
// }

// export async function getCombustiblesMarDelPlata() {
//   try {
//     // const agent = new https.Agent({
//     //   rejectUnauthorized: false,
//     // });

//     const url = `${DATASET_URL}&limit=1000`;

//     const controller = new AbortController();
//     const timeout = setTimeout(() => controller.abort(), 8000); // 8 segundos máx

//     const res = await fetch(url, {
//       method: "GET",
//       cache: "no-store",
//       signal: controller.signal,
//       headers: {
//         "User-Agent": "Mozilla/5.0",
//         Accept: "application/json",
//       },
//     });

//     clearTimeout(timeout);

//     // 2. Restauramos la seguridad SSL para el resto de la aplicación
//     // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

//     if (!res.ok) {
//       console.error("HTTP Error en API Energía:", res.status);
//       return null;
//     }

//     const json = await res.json();
//     const records = json?.result?.records || [];

//     return {
//       ypf: buildEmpresa(records, "ypf", "YPF"),
//       shell: buildEmpresa(records, "shell", "Shell"),
//       axion: buildEmpresa(records, "axion", "Axion"),
//       puma: buildEmpresa(records, "puma", "Puma"),
//     };
//   } catch (error) {
//     console.error("Error en Combustibles:", error);
//     return null;
//   }
// }
