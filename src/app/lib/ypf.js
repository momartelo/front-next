// Filtramos directamente por localidad en la URL para mayor velocidad
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
  shell: ["shell c.a.p.s.a."],
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

  // Buscamos la fecha más reciente
  const maxDate = Math.max(
    ...filtered.map((r) => new Date(r.fecha_vigencia).getTime())
  );

  const latest = filtered.filter(
    (r) => new Date(r.fecha_vigencia).getTime() === maxDate
  );

  // De los más recientes, tomamos el precio máximo (evita errores de carga duplicada)
  const price = Math.max(...latest.map((r) => Number(r.precio)));

  return {
    precio: Number(price.toFixed(2)),
    fecha: latest[0].fecha_vigencia,
  };
}

function buildEmpresa(records, empresaKey, nombre) {
  const rows = records.filter((r) =>
    EMPRESAS[empresaKey].includes(normalize(r.empresabandera))
  );

  if (!rows.length) return null;

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
    // Añadimos User-Agent para evitar que el servidor de la API nos bloquee
    const res = await fetch(DATASET_URL, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      console.error("Error en la respuesta de la API:", res.status);
      return null;
    }

    const json = await res.json();
    const records = json?.result?.records || [];

    return {
      ypf: buildEmpresa(records, "ypf", "YPF"),
      shell: buildEmpresa(records, "shell", "Shell"),
    };
  } catch (error) {
    // En Vercel, esto aparecerá en los logs si algo falla
    console.error("Fallo al obtener combustibles:", error);
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
