import https from "https";

// Volvemos a filtrar por Mar del Plata en la URL para que la API nos de solo lo que necesitamos
const DATASET_URL =
  'https://datos.energia.gob.ar/api/3/action/datastore_search?resource_id=80ac25de-a44a-4445-9215-090cf55cfda5&filters={"localidad":"MAR DEL PLATA"}';

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

function getLatestPrice(rows, productNames) {
  const filtered = rows.filter((r) =>
    productNames.includes(normalize(r.producto))
  );
  if (!filtered.length) return null;

  const sorted = filtered.sort(
    (a, b) =>
      new Date(b.fecha_vigencia).getTime() -
      new Date(a.fecha_vigencia).getTime()
  );

  const latestDate = sorted[0].fecha_vigencia;
  const sameDayRows = sorted.filter((r) => r.fecha_vigencia === latestDate);
  const price = Math.max(...sameDayRows.map((r) => Number(r.precio)));

  return { precio: Number(price.toFixed(2)), fecha: latestDate };
}

function buildEmpresa(records, empresaKey, nombre) {
  const keywords = EMPRESAS[empresaKey];

  // Filtramos por empresa en los registros de Mar del Plata
  const baseRows = records.filter((r) => {
    const nombreEnCSV = normalize(r.empresabandera);
    return keywords.some((key) => nombreEnCSV.includes(key));
  });

  if (!baseRows.length) return null;

  // Intentamos Diurno (1), si no hay (como pasa con Axion), usamos Nocturno
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
  };
}

export async function getCombustiblesMarDelPlata() {
  try {
    // 1. Usamos una URL que no dependa de filtros complejos en el string si es posible
    const url = `${DATASET_URL}&limit=1000`;

    const res = await fetch(url, {
      cache: "no-store",
      // Agregamos más headers para que parezca una petición de navegador real
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "es-AR,es;q=0.9",
      },
      // En Next.js 13/14/15, el agent se pasa de forma distinta o se confía en el fetch nativo
    });

    if (!res.ok) {
      console.error("Error en respuesta de API Energía:", res.status);
      return null;
    }

    const json = await res.json();
    const records = json?.result?.records || [];

    if (records.length === 0) {
      console.warn("No se encontraron registros para Mar del Plata");
      return null;
    }

    return {
      ypf: buildEmpresa(records, "ypf", "YPF"),
      shell: buildEmpresa(records, "shell", "Shell"),
      axion: buildEmpresa(records, "axion", "Axion"),
      puma: buildEmpresa(records, "puma", "Puma"),
    };
  } catch (error) {
    console.error("Error capturado en getCombustibles:", error.message);
    return null;
  }
}
// import Papa from "papaparse";

// const DATASET_URL =
//   "https://datos.energia.gob.ar/api/3/action/datastore_search?resource_id=80ac25de-a44a-4445-9215-090cf55cfda5&limit=5000";

// const normalize = (v) =>
//   String(v || "")
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .trim();

// export async function getYPFMarDelPlata() {
//   const res = await fetch(DATASET_URL, {
//     cache: "no-store",
//   });
//   if (!res.ok) return null;

//   const json = await res.json();
//   const records = json?.result?.records || [];

//   const rows = records.filter(
//     (r) =>
//       normalize(r.empresabandera) === "ypf" &&
//       normalize(r.localidad) === "mar del plata"
//   );

//   console.log("YPF MDP ROWS:", rows.slice(0, 10));

//   const find = (names) => {
//     const found = rows.filter((r) => names.includes(normalize(r.producto)));

//     if (!found.length) return null;

//     const avg =
//       found.reduce((sum, r) => sum + Number(r.precio), 0) / found.length;

//     return Number(avg.toFixed(2));
//   };

//   return {
//     empresa: "YPF",
//     localidad: "Mar del Plata",
//     nafta: {
//       super: find(["nafta (super) entre 92 y 95 ron"]),
//       premium: find(["nafta (premium) de mas de 95 ron"]),
//     },
//     gasoil: {
//       comun: find(["gas oil grado 2"]),
//       premium: find(["gas oil grado 3"]),
//     },
//   };
// }
