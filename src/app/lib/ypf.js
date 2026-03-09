import { kv } from "@vercel/kv";
import { cache } from "react";

const DATASET_URL =
  'http://datos.energia.gob.ar/api/3/action/datastore_search?resource_id=80ac25de-a44a-4445-9215-090cf55cfda5&filters={"localidad":"MAR DEL PLATA"}';

const normalize = (v) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

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

// Devuelve el precio más reciente de un producto
function getLatestPrice(rows, productNames) {
  const filtered = rows.filter((r) =>
    productNames.includes(normalize(r.producto)),
  );

  if (!filtered.length) return null;

  const sorted = filtered.sort(
    (a, b) =>
      new Date(b.fecha_vigencia).getTime() -
      new Date(a.fecha_vigencia).getTime(),
  );

  const latestDate = sorted[0].fecha_vigencia;
  const sameDayRows = sorted.filter((r) => r.fecha_vigencia === latestDate);
  const price = Math.max(...sameDayRows.map((r) => Number(r.precio)));

  return { precio: Number(price.toFixed(2)), fecha: latestDate };
}

// Construye datos de la empresa desde oficial, incluyendo fechas por producto
function buildEmpresa(records, empresaKey, nombre) {
  const keywords = EMPRESAS[empresaKey];

  const baseRows = records.filter((r) => {
    const nombreEnCSV = normalize(r.empresabandera);
    return keywords.some((key) => nombreEnCSV.includes(key));
  });

  if (!baseRows.length) return null;

  let rows = baseRows.filter((r) => String(r.idtipohorario) === "1");
  if (rows.length === 0) rows = baseRows;

  const naftaSuper = getLatestPrice(rows, PRODUCTOS.naftaSuper);
  const naftaPremium = getLatestPrice(rows, PRODUCTOS.naftaPremium);
  const gasoilComun = getLatestPrice(rows, PRODUCTOS.gasoilComun);
  const gasoilPremium = getLatestPrice(rows, PRODUCTOS.gasoilPremium);

  const fechas = [naftaSuper, naftaPremium, gasoilComun, gasoilPremium]
    .filter(Boolean)
    .map((x) => new Date(x.fecha).getTime());

  return {
    empresa: nombre,
    localidad: "Mar del Plata",
    fechaActualizacion: fechas.length
      ? new Date(Math.max(...fechas)).toISOString().slice(0, 10)
      : null,
    nafta: {
      super: naftaSuper?.precio ?? null,
      premium: naftaPremium?.precio ?? null,
    },
    gasoil: {
      comun: gasoilComun?.precio ?? null,
      premium: gasoilPremium?.precio ?? null,
    },
    // Fechas individuales por producto
    naftaSuperFecha: naftaSuper?.fecha ?? null,
    naftaPremiumFecha: naftaPremium?.fecha ?? null,
    gasoilComunFecha: gasoilComun?.fecha ?? null,
    gasoilPremiumFecha: gasoilPremium?.fecha ?? null,
  };
}

// Compara precio oficial vs override por fecha
function elegirPrecio(oficial, manual) {
  if (!oficial) return manual?.precio ?? null;
  if (!manual) return oficial?.precio ?? null;

  const fechaOficial = oficial.fecha || "1900-01-01";
  const fechaManual = manual.fecha || "1900-01-01";

  return new Date(fechaManual) > new Date(fechaOficial)
    ? manual.precio
    : oficial.precio;
}

// Aplica overrides híbridos comparando fechas por producto
function aplicarOverrideHibrido(oficial, manual) {
  if (!manual) return oficial;

  const naftaSuper = elegirPrecio(
    { precio: oficial.nafta.super, fecha: oficial.naftaSuperFecha },
    manual.nafta?.super,
  );
  const naftaPremium = elegirPrecio(
    { precio: oficial.nafta.premium, fecha: oficial.naftaPremiumFecha },
    manual.nafta?.premium,
  );
  const gasoilComun = elegirPrecio(
    { precio: oficial.gasoil.comun, fecha: oficial.gasoilComunFecha },
    manual.gasoil?.comun,
  );
  const gasoilPremium = elegirPrecio(
    { precio: oficial.gasoil.premium, fecha: oficial.gasoilPremiumFecha },
    manual.gasoil?.premium,
  );

  // Detectamos si algún precio viene del JSON
  const manualUsed =
    (manual.nafta?.super && naftaSuper === manual.nafta.super.precio) ||
    (manual.nafta?.premium && naftaPremium === manual.nafta.premium.precio) ||
    (manual.gasoil?.comun && gasoilComun === manual.gasoil.comun.precio) ||
    (manual.gasoil?.premium && gasoilPremium === manual.gasoil.premium.precio);

  // Fecha más reciente entre precios usados
  const fechas = [
    manual.nafta?.super?.fecha && naftaSuper === manual.nafta.super.precio
      ? manual.nafta.super.fecha
      : oficial.naftaSuperFecha,
    manual.nafta?.premium?.fecha && naftaPremium === manual.nafta.premium.precio
      ? manual.nafta.premium.fecha
      : oficial.naftaPremiumFecha,
    manual.gasoil?.comun?.fecha && gasoilComun === manual.gasoil.comun.precio
      ? manual.gasoil.comun.fecha
      : oficial.gasoilComunFecha,
    manual.gasoil?.premium?.fecha &&
    gasoilPremium === manual.gasoil.premium.precio
      ? manual.gasoil.premium.fecha
      : oficial.gasoilPremiumFecha,
  ].filter(Boolean);

  const fechaActualizacion =
    fechas.length > 0
      ? new Date(Math.max(...fechas.map((f) => new Date(f).getTime())))
          .toISOString()
          .slice(0, 10)
      : null;

  return {
    empresa: oficial.empresa,
    localidad: oficial.localidad,
    fechaActualizacion,
    manual: !!manualUsed, // <-- indicador de override
    nafta: { super: naftaSuper, premium: naftaPremium },
    gasoil: { comun: gasoilComun, premium: gasoilPremium },
  };
}

// Función principal
export const getCombustiblesMarDelPlata = cache(async () => {
  try {
    const url = `${DATASET_URL}&limit=1000`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error("HTTP Error en API Energía:", res.status);
      return null;
    }

    const json = await res.json();

    const records = json?.result?.records || [];

    let ypf = buildEmpresa(records, "ypf", "YPF");
    let shell = buildEmpresa(records, "shell", "Shell");
    let axion = buildEmpresa(records, "axion", "Axion");
    let puma = buildEmpresa(records, "puma", "Puma");

    // Leer overrides desde filesystem
    // let overrides = {};
    // try {
    //   const filePath = path.join(
    //     process.cwd(),
    //     "public",
    //     "data",
    //     "overrides.json",
    //   );
    //   const raw = fs.readFileSync(filePath, "utf8");
    //   overrides = JSON.parse(raw);
    // } catch (err) {
    //   console.warn("No se pudo cargar overrides.json, se usan datos oficiales");
    // }

    let overrides = {};

    try {
      overrides = await kv.get("combustibles_overrides");
    } catch (err) {
      console.warn("No se pudo cargar overrides desde KV");
    }

    // Aplicar overrides híbridos
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

    return { ypf, shell, axion, puma };
  } catch (error) {
    console.error("Error en Combustibles:", error);
    return null;
  }
});

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
