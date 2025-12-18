export const runtime = "nodejs";

export async function GET() {
  try {
    const res = await fetch(
      "https://datos.energia.gob.ar/api/3/action/datastore_search?resource_id=80ac25de-a44a-4445-9215-090cf55cfda5&limit=5000",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return Response.json({ records: [] });
    }

    const json = await res.json();
    return Response.json({ records: json?.result?.records || [] });
  } catch (err) {
    return Response.json({ records: [] });
  }
}
