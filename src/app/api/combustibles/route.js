export async function GET() {
  try {
    const res = await fetch(
      "https://datos.energia.gob.ar/api/3/action/datastore_search?resource_id=80ac25de-a44a-4445-9215-090cf55cfda5&limit=5000",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return Response.json({ error: "Fetch failed" }, { status: 500 });
    }

    const json = await res.json();
    const records = json?.result?.records || [];

    return Response.json({ records });
  } catch (error) {
    console.error("Error combustibles API:", error);
    return Response.json(
      { error: "SSL error datos.energia.gob.ar" },
      { status: 500 }
    );
  }
}
