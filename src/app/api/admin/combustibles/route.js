import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function tieneCredencialesKV() {
  return Boolean(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN &&
    process.env.KV_REST_API_URL.startsWith("https://"),
  );
}

function getLocalOverrides() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "overrides.json",
    );
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

// 👉 GET - Traer overrides desde KV (o desde el JSON local si no hay KV)
export async function GET() {
  try {
    let data = null;

    if (tieneCredencialesKV()) {
      try {
        data = await kv.get("combustibles_overrides");
      } catch (e) {
        console.warn("⚠️ No se pudo leer KV, usando archivo local:", e.message);
      }
    }

    if (!data) {
      data = getLocalOverrides();
    }

    return NextResponse.json(data || {});
  } catch (error) {
    console.error("Error en GET /api/admin/combustibles:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// 👉 POST - Guardar overrides
export async function POST(req) {
  try {
    const body = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (body.password !== adminPassword) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 },
      );
    }

    let kvSaved = false;

    // 1. Intentar guardar en KV si está configurado
    if (tieneCredencialesKV()) {
      try {
        await kv.set("combustibles_overrides", body.data);
        kvSaved = true;
      } catch (e) {
        console.warn(
          "⚠️ No se pudo guardar en KV (¿sin internet o red bloqueada?):",
          e.message,
        );
      }
    }

    // 2. Guardar en el JSON local en entorno de desarrollo
    let localSaved = false;
    if (process.env.NODE_ENV !== "production") {
      try {
        const dirPath = path.join(process.cwd(), "public", "data");
        const filePath = path.join(dirPath, "overrides.json");

        // Aseguramos que la carpeta exista antes de escribir
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, JSON.stringify(body.data, null, 2), "utf8");
        localSaved = true;
      } catch (err) {
        console.warn(
          "⚠️ No se pudo escribir en el archivo local overrides.json:",
          err.message,
        );
      }
    }

    // Si falló KV en producción y tampoco se pudo guardar localmente
    if (process.env.NODE_ENV === "production" && !kvSaved) {
      return NextResponse.json(
        { error: "Error al conectar con la base de datos en la nube (KV)" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      savedInKV: kvSaved,
      savedLocal: localSaved,
    });
  } catch (error) {
    console.error("Error en POST /api/admin/combustibles:", error);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 },
    );
  }
}
// Falta agregar ADMIN_PASSWORD=tuPasswordSegura  en pagina de VERCEL => Project → Settings → Environment Variables

//-----------------------------------------------------------------
// import { kv } from "@vercel/kv";
// import { NextResponse } from "next/server";

// function unauthorized() {
//   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// }

// // 👉 GET - traer overrides (sin password)
// export async function GET() {
//   try {
//     const data = await kv.get("combustibles_overrides");
//     return NextResponse.json(data || {}); // Siempre devuelve algo
//   } catch (error) {
//     console.error("Error cargando overrides desde KV:", error);
//     return NextResponse.json({ error: "Error interno" }, { status: 500 });
//   }
// }

// // 👉 POST - guardar overrides (protegido)
// export async function POST(req) {
//   try {
//     const body = await req.json();

//     if (body.password !== process.env.ADMIN_PASSWORD) {
//       return unauthorized();
//     }

//     await kv.set("combustibles_overrides", body.data);

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("Error guardando overrides:", error);
//     return NextResponse.json({ error: "Error interno" }, { status: 500 });
//   }
// }
// Falta agregar ADMIN_PASSWORD=tuPasswordSegura  en pagina de VERCEL => Project → Settings → Environment Variables
