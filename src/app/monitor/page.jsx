import { CATALOGO_COMPARATIVO } from "../lib/catalogo";
import { getDolares } from "../lib/dolar";
import { PRECIOS_TUBOFORTE_AGUA_6 } from "../lib/listaTuboforte";

import { getPrecioSakuraById } from "../lib/scraper";
import { getPrecioRopelato } from "../lib/scraper";

export default async function MonitorPage() {
  const dolares = await getDolares();
  console.log(dolares);
  const dolarOficial = dolares.find((d) => d.casa === "oficial")?.venta || 0;
  const dolarBlue = dolares.find((d) => d.casa === "blue")?.venta || 0;

  const productosComparados = await Promise.all(
    CATALOGO_COMPARATIVO.map(async (material) => {
      const precios = await Promise.all(
        material.links.map(async (link) => {
          let ars = 0;
          let usd = 0;

          if (link.tienda === "Sakura") {
            ars = await getPrecioSakuraById(link.id);
            usd = ars / dolarOficial;
          } else if (link.tienda === "Ropelato") {
            ars = await getPrecioRopelato(link.url);
            usd = ars / dolarOficial;
          } else if (link.tienda === "Tuboforte") {
            const itemFortenor = PRECIOS_TUBOFORTE_AGUA_6.find(
              (f) => f.diametro === material.diametroReferencia
            );

            if (itemFortenor) {
              usd = itemFortenor.precioUsd;
              ars = usd * dolarOficial;
            }
          }

          return { tienda: link.tienda, ars, usd };
        })
      );

      const soloPreciosValidos = precios.filter((p) => p.ars > 0);
      const mejorPrecioArs =
        soloPreciosValidos.length > 0
          ? Math.min(...soloPreciosValidos.map((p) => p.ars))
          : 0;

      return { ...material, precios, mejorPrecioArs };
    })
  );

  return (
    <main className="p-8 max-w-6xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800 tracking-tighter">
          COMPARADOR DE MATERIALES
        </h1>
        <div className="text-right">
          <span className="text-xs font-bold text-gray-400 block uppercase">
            Cotización Dolar Oficial
          </span>
          <span className="text-xl font-mono font-bold text-green-600">
            ${dolarOficial}
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        {productosComparados.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between">
              <span className="font-bold text-gray-700">{item.nombre}</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {item.categoria}
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.precios.map((p, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    p.ars === item.mejorPrecioArs && p.ars > 0
                      ? "border-green-500 bg-green-50/50 shadow-md"
                      : "border-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {p.tienda}
                    </span>
                    {p.ars === item.mejorPrecioArs && p.ars > 0 && (
                      <span className="text-[9px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">
                        MÁS BARATO
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-800">
                      ${Math.round(p.ars).toLocaleString("es-AR")}
                    </span>
                    <span className="text-sm font-bold text-blue-500">
                      u$s {p.usd.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
