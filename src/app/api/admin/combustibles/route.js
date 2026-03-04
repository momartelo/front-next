// app/api/admin/combustibles/route.js
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// 👉 GET - traer overrides (sin password)
export async function GET() {
  try {
    const data = await kv.get("combustibles_overrides");
    return NextResponse.json(data || {}); // Siempre devuelve algo
  } catch (error) {
    console.error("Error cargando overrides desde KV:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// 👉 POST - guardar overrides (protegido)
export async function POST(req) {
  try {
    const body = await req.json();

    if (body.password !== process.env.ADMIN_PASSWORD) {
      return unauthorized();
    }

    await kv.set("combustibles_overrides", body.data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error guardando overrides:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
// Falta agregar ADMIN_PASSWORD=tuPasswordSegura  en pagina de VERCEL => Project → Settings → Environment Variables
