// src/lib/combustiblesPorCiudad.js
import { kv } from "@vercel/kv";

let localMemoryCache = null;
let localMemoryExpiry = 0;

function tieneCredencialesKV() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return Boolean(url && token && url.startsWith("https://"));
}

function detectarEmpresa(empresaStr = "") {
  const str = (empresaStr || "").toUpperCase();
  if (str.includes("YPF")) return "YPF";
  if (str.includes("SHELL") || str.includes("RAIZEN")) return "Shell";
  if (str.includes("AXION") || str.includes("PAE")) return "Axion";
  if (str.includes("PUMA") || str.includes("TRAFIGURA")) return "Puma";
  if (str.includes("GULF")) return "Gulf";
  if (str.includes("VOY")) return "Voy";
  if (str.includes("DAPSA")) return "Dapsa";
  return "Otras";
}

function detectarProducto(prodStr = "") {
  const str = (prodStr || "").toUpperCase();
  if (str.includes("SUPER") || str.includes("SÚPER")) return "Súper";
  if (
    str.includes("PREMIUM") ||
    str.includes("INFINIA") ||
    str.includes("V-POWER") ||
    str.includes("QUANTIUM")
  ) {
    return "Premium";
  }
  if (
    str.includes("DIESEL") ||
    str.includes("GASOIL") ||
    str.includes("GAS OIL")
  ) {
    if (
      str.includes("500") ||
      str.includes("GRADO 2") ||
      str.includes("COMUN") ||
      str.includes("COMÚN")
    ) {
      return "Diésel Común";
    }
    return "Diésel Premium";
  }
  if (str.includes("GNC")) return "GNC";
  return "Otro";
}

export async function getDatosCombustibles() {
  const CACHE_KEY = "combustibles_cache_v2";
  const now = Date.now();

  if (localMemoryCache && now < localMemoryExpiry) {
    return localMemoryCache;
  }

  if (tieneCredencialesKV()) {
    try {
      const cached = await kv.get(CACHE_KEY);
      if (cached && cached.registros && cached.registros.length > 0) {
        localMemoryCache = cached;
        localMemoryExpiry = now + 6 * 60 * 60 * 1000;
        return cached;
      }
    } catch (err) {
      // Ignorar fallback local
    }
  }

  const RESOURCE_ID = "80ac25de-a44a-4445-9215-090cf55cfda5";
  const BASE_URL = `https://datos.energia.gob.ar/api/3/action/datastore_search?resource_id=${RESOURCE_ID}`;
  const limit = 10000;

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  try {
    const firstRes = await fetch(`${BASE_URL}&limit=${limit}&offset=0`, {
      headers,
      cache: "no-store",
    });

    if (!firstRes.ok) throw new Error(`HTTP Error: ${firstRes.status}`);

    const firstJson = await firstRes.json();
    const total = firstJson?.result?.total || 0;
    let records = [...(firstJson?.result?.records || [])];

    if (total > limit) {
      const offsets = [];
      for (let offset = limit; offset < total; offset += limit) {
        offsets.push(offset);
      }

      const promises = offsets.map((offset) =>
        fetch(`${BASE_URL}&limit=${limit}&offset=${offset}`, {
          headers,
          cache: "no-store",
        }).then((r) => (r.ok ? r.json() : null)),
      );

      const results = await Promise.all(promises);
      results.forEach((json) => {
        if (json?.result?.records) {
          records.push(...json.result.records);
        }
      });
    }

    const provinciasSet = new Set();
    const registrosLimpiados = [];

    records.forEach((r) => {
      const provincia = r.provincia ? r.provincia.trim() : "";
      const localidad = r.localidad ? r.localidad.trim() : "";
      const precio = parseFloat(r.precio) || 0;

      // Capturamos el campo de fecha que provee la API (fecha o fechahora)
      const rawFecha = r.fecha_vigencia || r.fechahora || r.fecha || null;
      let fechaISO = "";
      let fechaFormateada = "Sin fecha";

      if (rawFecha) {
        const d = new Date(rawFecha);
        if (!isNaN(d.getTime())) {
          fechaISO = d.toISOString();
          fechaFormateada = d.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        } else {
          fechaFormateada = String(rawFecha).substring(0, 10);
        }
      }

      if (provincia && precio > 0) {
        provinciasSet.add(provincia);
        registrosLimpiados.push({
          estacion: r.empresa || "Estación sin nombre",
          direccion: r.direccion || "",
          bandera: detectarEmpresa(r.empresabandera),
          producto: detectarProducto(r.producto),
          precio,
          localidad,
          provincia,
          fecha: fechaFormateada,
          fechaISO,
        });
      }
    });

    // Ordenamos por fecha más reciente por defecto
    registrosLimpiados.sort(
      (a, b) => new Date(b.fechaISO || 0) - new Date(a.fechaISO || 0),
    );

    const resultadoFinal = {
      success: true,
      provincias: Array.from(provinciasSet).sort(),
      registros: registrosLimpiados,
    };

    localMemoryCache = resultadoFinal;
    localMemoryExpiry = now + 6 * 60 * 60 * 1000;

    if (tieneCredencialesKV()) {
      try {
        await kv.set(CACHE_KEY, resultadoFinal, { ex: 21600 });
      } catch (e) {
        // Manejo silencioso
      }
    }

    return resultadoFinal;
  } catch (err) {
    console.error("Error al consultar API de energía:", err);
    return { error: "No se pudieron cargar los datos o la conexión caducó." };
  }
}
//------------------------------------------

// import { kv } from "@vercel/kv";

// const RESOURCE_ID = "80ac25de-a44a-4445-9215-090cf55cfda5";
// const BASE_URL = `https://datos.energia.gob.ar/api/3/action/datastore_search?resource_id=${RESOURCE_ID}`;

// const normalize = (v) =>
//   String(v || "")
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .trim();

// const EMPRESAS = {
//   ypf: ["ypf"],
//   shell: ["shell", "raizen"],
//   axion: ["axion", "pan american", "pae"],
//   puma: ["puma", "trafigura"],
//   gulf: ["gulf"],
//   refinor: ["refinor"],
//   dapsa: ["dapsa"],
//   voy: ["voy"],
//   independiente: ["blanca", "sin bandera"],
// };

// function detectarEmpresa(nombre) {
//   const n = normalize(nombre);
//   for (const empresa in EMPRESAS) {
//     if (EMPRESAS[empresa].some((k) => n.includes(k))) return empresa;
//   }
//   return null;
// }

// function detectarProducto(nombre) {
//   const n = normalize(nombre);
//   if (n.includes("super") && n.includes("nafta")) return "naftaSuper";
//   if (n.includes("premium") && n.includes("nafta")) return "naftaPremium";
//   if (n.includes("grado 2")) return "gasoilComun";
//   if (n.includes("grado 3")) return "gasoilPremium";
//   return null;
// }

// async function fetchAllRecords() {
//   const limit = 10000;
//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), 12000);

//   try {
//     const firstRes = await fetch(`${BASE_URL}&limit=${limit}&offset=0`, {
//       signal: controller.signal,
//       next: { revalidate: 3600 },
//     });

//     if (!firstRes.ok) throw new Error("Error en la respuesta de la API");

//     const firstJson = await firstRes.json();
//     const total = firstJson?.result?.total || 0;
//     let all = [...(firstJson?.result?.records || [])];

//     if (total > limit) {
//       const offsets = [];
//       for (let offset = limit; offset < total; offset += limit) {
//         offsets.push(offset);
//       }

//       const promises = offsets.map((offset) =>
//         fetch(`${BASE_URL}&limit=${limit}&offset=${offset}`, {
//           signal: controller.signal,
//           next: { revalidate: 3600 },
//         }).then((res) => res.json()),
//       );

//       const results = await Promise.all(promises);
//       results.forEach((json) => {
//         if (json?.result?.records) {
//           all.push(...json.result.records);
//         }
//       });
//     }

//     clearTimeout(timeoutId);
//     return all;
//   } catch (err) {
//     clearTimeout(timeoutId);
//     console.error("Error obteniendo datos de energía:", err);
//     return [];
//   }
// }

// function procesarRegistros(records) {
//   const localidades = {};

//   for (const r of records) {
//     const localidad = r.localidad?.trim();
//     const provincia = r.provincia?.trim();
//     if (!localidad || !provincia) continue;

//     const empresa = detectarEmpresa(r.empresabandera);
//     if (!empresa) continue;

//     const producto = detectarProducto(r.producto);
//     if (!producto) continue;

//     const precio = Number(r.precio);
//     const fecha = r.fecha_vigencia;

//     if (!localidades[localidad]) localidades[localidad] = {};
//     if (!localidades[localidad][empresa])
//       localidades[localidad][empresa] = { _provincia: provincia };

//     const empresaData = localidades[localidad][empresa];

//     if (
//       !empresaData[producto] ||
//       new Date(fecha) > new Date(empresaData[producto].fecha)
//     ) {
//       empresaData[producto] = { precio, fecha };
//     }
//   }

//   const resultado = {};
//   for (const loc in localidades) {
//     resultado[loc] = {};
//     for (const emp in localidades[loc]) {
//       const data = localidades[loc][emp];
//       const fechas = Object.values(data)
//         .filter((x) => x.fecha)
//         .map((x) => new Date(x.fecha).getTime());

//       resultado[loc][emp] = {
//         empresa: emp.toUpperCase(),
//         localidad: loc,
//         provincia: data._provincia,
//         fechaActualizacion: fechas.length
//           ? new Date(Math.max(...fechas)).toISOString().slice(0, 10)
//           : null,
//         nafta: {
//           super: data.naftaSuper?.precio ?? null,
//           premium: data.naftaPremium?.precio ?? null,
//         },
//         gasoil: {
//           comun: data.gasoilComun?.precio ?? null,
//           premium: data.gasoilPremium?.precio ?? null,
//         },
//       };
//     }
//   }
//   return resultado;
// }

// export const getCombustiblesPorLocalidad = async () => {
//   try {
//     const cached = await kv.get("combustibles_v2");
//     if (cached && Object.keys(cached).length > 0) return cached;

//     const records = await fetchAllRecords();
//     if (!records.length) return null;

//     const data = procesarRegistros(records);

//     kv.set("combustibles_v2", data, { ex: 3600 }).catch(console.error);

//     return data;
//   } catch (error) {
//     console.error("Error en getCombustiblesPorLocalidad:", error);
//     return null;
//   }
// };
