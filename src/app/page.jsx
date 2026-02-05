import { Suspense } from "react";
import CardSkeleton from "./components/CardSkeleton";
import DolaresSection from "./sections/DolaresSection";
import MonedasSection from "./sections/MonedasSection";
import InflacionSection from "./sections/InflacionSection";
import IndicesSection from "./sections/IndicesSection";
import CombustiblesSection from "./sections/CombustiblesSection";
import CACSection from "./sections/CACSection";
import ShareButton from "./components/ShareButton";
import CACSelectorSection from "./sections/CACSelectorSection";
import CACSChartSection from "./sections/CACChartSection";

import { getDolares } from "./lib/dolar";
import { getCombustiblesMarDelPlata } from "./lib/ypf";
import { getCACHistorico } from "./lib/cac";

export default async function Dashboard() {
  // 👉 fetch server (1 sola vez)
  const [dolares, combustibles, cac] = await Promise.all([
    getDolares(),
    getCombustiblesMarDelPlata(),
    getCACHistorico(),
  ]);

  const ultimoCAC = cac?.at(-1);

  const shareData = {
    blue: dolares?.find((d) => d.nombre === "Blue")?.venta || "0",
    ypf: combustibles?.ypf?.nafta?.super || "0",
    cac: ultimoCAC?.general || "0",
  };

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.4fr]">
        <Suspense fallback={<CardSkeleton title="Dólares" />}>
          <DolaresSection />
        </Suspense>

        <div className="flex flex-col gap-4">
          <Suspense fallback={<CardSkeleton title="Euro / Real" />}>
            <MonedasSection />
          </Suspense>

          <Suspense fallback={<CardSkeleton title="Combustibles" />}>
            <CombustiblesSection />
          </Suspense>
        </div>

        <div className="flex flex-col gap-4">
          <Suspense fallback={<CardSkeleton title="Inflación" />}>
            <InflacionSection />
          </Suspense>

          <Suspense fallback={<CardSkeleton title="Índices" />}>
            <IndicesSection />
          </Suspense>
        </div>

        <div id="cac" className="flex flex-col">
          <Suspense fallback={<CardSkeleton title="CAC" />}>
            <CACSection />
          </Suspense>

          <Suspense fallback={<CardSkeleton title="Evolución CAC" />}>
            <CACSChartSection />
          </Suspense>
        </div>

        <Suspense fallback={<CardSkeleton title="Evolución CAC" />}>
          <CACSelectorSection />
        </Suspense>
      </section>

      {/* 👉 le pasamos los datos ya listos */}
      <ShareButton datos={shareData} />
    </main>
  );
}

// export const runtime = "nodejs";
// // export const revalidate = 900;
// export const dynamic = "force-dynamic";
// import Card from "./components/Card";
// import { getDolares, getEuro, getReal } from "./lib/dolar";
// import {
//   getInflacionMensualActual,
//   getInflacionInteranualActual,
// } from "./lib/inflacion";
// import { formatFechaHora, formatPeriodoCAC } from "./lib/date";
// import { getCACHistorico } from "./lib/cac";
// import CACChart from "./components/CACChart";
// import CACSelector from "./components/CACSelector";
// import { getCombustiblesMarDelPlata } from "./lib/ypf";
// import ShareButton from "./components/ShareButton";
// import { getIndiceUVAActual } from "./lib/indiceUVA";
// import { getRiesgoPaisUltimo } from "./lib/riesgoPais";
// import styles from "./page.module.css";

// export default async function Dashboard() {
//   // Manejo de errores con Promise.allSettled para que si una API falla, el resto cargue
//   const [
//     dolares,
//     euro,
//     real,
//     inflacionMensual,
//     inflacionInteranual,
//     cacHistorico,
//     combustibles,
//     indiceUVA,
//     riesgoPais,
//   ] = await Promise.all([
//     getDolares(),
//     getEuro(),
//     getReal(),
//     getInflacionMensualActual(),
//     getInflacionInteranualActual(),
//     getCACHistorico(),
//     getCombustiblesMarDelPlata(),
//     getIndiceUVAActual(),
//     getRiesgoPaisUltimo(),
//   ]);

//   const getFechaFormateada = (item) =>
//     item?.fechaActualizacion ? formatFechaHora(item.fechaActualizacion) : null;

//   const fechaEuro = getFechaFormateada(euro);
//   const fechaReal = getFechaFormateada(real);

//   const formatFechaISO = (fechaISO) => {
//     if (!fechaISO) return "-";

//     return new Date(fechaISO).toLocaleDateString("es-AR", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });
//   };

//   const inflacionColor = inflacionMensual
//     ? inflacionMensual.valor >= 0
//       ? "text-red-600"
//       : "text-green-600"
//     : "";

//   const cacUltimos12 = (cacHistorico || []).slice(-12);

//   const formatNumber = (value) =>
//     Number(value).toLocaleString("es-AR", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });

//   const ultimoCAC = cacHistorico?.length ? cacHistorico.at(-1) : null;

//   const LOGOS = {
//     ypf: "/logos/ypf.png",
//     shell: "/logos/shell.png",
//     axion: "/logos/axion.png",
//     puma: "/logos/puma.png",
//   };

//   const datosParaCompartir = {
//     blue: dolares?.find((d) => d.nombre === "Blue")?.venta || "0",
//     ypf: combustibles?.ypf?.nafta?.super || "0",
//     cac: ultimoCAC ? formatNumber(ultimoCAC.general) : "No disp.",
//   };

//   return (
//     <main className="p-6 max-w-7xl mx-auto">
//       {/* <h1 className="text-3xl font-semibold mb-6 text-center">
//         Dashboard económico
//       </h1> */}

//       <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.4fr]">
//         {/* DÓLARES */}
//         <Card title="Dólares">
//           {dolares?.map((d) => {
//             const fecha = getFechaFormateada(d);
//             return (
//               <div key={d.casa} className="border-b last:border-0 py-2">
//                 <p className="font-medium">
//                   {d.nombre}: ${d.venta.toFixed(2)}
//                 </p>
//                 <small className="text-gray-400">
//                   Actualizado al: {fecha ? `${fecha.fecha} ${fecha.hora}` : "-"}
//                 </small>
//               </div>
//             );
//           })}
//         </Card>

//         {/* EURO / REAL */}
//         <div className="flex flex-col gap-4 ">
//           <div className="flex gap-16  border border-gray-200 rounded-lg ">
//             <Card
//               title={<span className="font-semibold">Euro</span>}
//               noBorder
//               titleCenter={false}
//             >
//               <p className="text-sm">
//                 Compra: ${euro?.compra?.toFixed(2) ?? "-"}
//               </p>
//               <p className="text-sm">
//                 Venta: ${euro?.venta?.toFixed(2) ?? "-"}
//               </p>
//               <small className="text-gray-400 text-xs">
//                 Actualizado al: {fechaEuro ? `${fechaEuro.fecha}` : "-"}
//               </small>
//             </Card>

//             <Card
//               title={<span className="font-semibold">Real</span>}
//               noBorder
//               titleCenter={false}
//             >
//               <p className="text-sm">
//                 Compra: ${real?.compra?.toFixed(2) ?? "-"}
//               </p>
//               <p className="text-sm">
//                 Venta: ${real?.venta?.toFixed(2) ?? "-"}
//               </p>
//               <small className="text-gray-400 text-xs">
//                 Actualizado al: {fechaReal ? `${fechaReal.fecha}` : "-"}
//               </small>
//             </Card>
//           </div>

//           {/* COMBUSTIBLES */}
//           <Card
//             title={
//               <span className="block w-full text-center pb-4 font-semibold">
//                 Combustibles · Mar del Plata
//               </span>
//             }
//           >
//             {combustibles &&
//             (combustibles.ypf ||
//               combustibles.shell ||
//               combustibles.axion ||
//               combustibles.puma) ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 {["ypf", "shell", "axion", "puma"].map((key) => {
//                   const e = combustibles[key];
//                   if (!e) return null;

//                   return (
//                     <div key={key} className="pb-2">
//                       <div className="flex items-center gap-2 mb-1">
//                         <img
//                           src={LOGOS[key]}
//                           alt=""
//                           className="h-5 w-auto object-contain"
//                           // Borramos la línea del onError que causaba el error
//                         />
//                         <p className="font-semibold text-blue-700">
//                           {e.empresa}
//                         </p>
//                       </div>
//                       <div className="mt-1 text-sm">
//                         <p>Nafta Súper: ${e.nafta.super?.toFixed(2) ?? "-"}</p>
//                         <p>
//                           Nafta Premium: ${e.nafta.premium?.toFixed(2) ?? "-"}
//                         </p>
//                         <p>Gasoil: ${e.gasoil.comun?.toFixed(2) ?? "-"}</p>
//                         <p>
//                           Gasoil Premium: ${e.gasoil.premium?.toFixed(2) ?? "-"}
//                         </p>
//                       </div>
//                       <small className="text-gray-400 text-xs">
//                         Actualizado al:{" "}
//                         {formatFechaHora(e.fechaActualizacion)?.fecha || "-"}
//                       </small>
//                     </div>
//                   );
//                 })}
//               </div>
//             ) : (
//               <p className="text-gray-400 text-center">
//                 Datos no disponibles hoy
//               </p>
//             )}
//           </Card>
//         </div>

//         {/* INFLACIÓN */}
//         <div className="flex flex-col gap-4">
//           <Card title="Inflación mensual" center>
//             {inflacionMensual ? (
//               <>
//                 <p className={`text-2xl font-semibold ${inflacionColor}`}>
//                   {inflacionMensual.valor.toFixed(2)}%
//                 </p>
//                 <small className="text-gray-400 text-xs">
//                   {formatFechaISO(inflacionMensual.fecha)}
//                 </small>
//               </>
//             ) : (
//               <p className="text-gray-400">No disponible</p>
//             )}
//           </Card>

//           <Card title="Inflación interanual" center>
//             {inflacionInteranual ? (
//               <>
//                 <p className={`text-2xl font-semibold ${inflacionColor}`}>
//                   {inflacionInteranual.valor.toFixed(2)}%
//                 </p>
//                 <small className="text-gray-400 text-xs">
//                   {formatFechaISO(inflacionInteranual.fecha)}
//                 </small>
//               </>
//             ) : (
//               <p>No disponible</p>
//             )}
//           </Card>

//           <Card title="Indice UVA" center>
//             {indiceUVA ? (
//               <>
//                 <p className={`text-2xl font-semibold ${inflacionColor}`}>
//                   {indiceUVA.valor.toFixed(2)}
//                 </p>
//                 <small className="text-gray-400 text-xs">
//                   {formatFechaISO(indiceUVA.fecha)}
//                 </small>
//               </>
//             ) : (
//               <p>No disponible</p>
//             )}
//           </Card>

//           <Card title="Riesgo Pais" center>
//             {riesgoPais ? (
//               <>
//                 <p className={`text-2xl font-semibold ${inflacionColor}`}>
//                   {riesgoPais.valor.toFixed(2)}
//                 </p>
//                 <small className="text-gray-400 text-xs">
//                   {formatFechaISO(riesgoPais.fecha)}
//                 </small>
//               </>
//             ) : (
//               <p>No disponible</p>
//             )}
//           </Card>
//         </div>

//         {/* CAC */}
//         <div id="cac" className="flex flex-col">
//           <Card title="Índice de la Construcción - CAC">
//             {ultimoCAC ? (
//               <>
//                 <p className="text-center text-sm text-gray-500 m-0 p-0">
//                   General
//                 </p>

//                 <p className="text-3xl font-bold text-center  text-blue-600">
//                   {formatNumber(ultimoCAC.general)}
//                 </p>

//                 <div className="space-y-1 text-sm mt-2">
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Materiales</span>
//                     <span className="font-medium">
//                       {formatNumber(ultimoCAC.materials)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between m-0">
//                     <span className="text-gray-600">Mano de obra</span>
//                     <span className="font-medium ">
//                       {formatNumber(ultimoCAC.labour_force)}
//                     </span>
//                   </div>
//                   <p className="text-center text-xs text-gray-600">
//                     {formatPeriodoCAC(ultimoCAC.period)}
//                   </p>
//                 </div>
//               </>
//             ) : (
//               <p className="text-gray-400">No disponible</p>
//             )}
//           </Card>

//           <section className="mt-4">
//             <Card title="Evolución CAC">
//               <CACChart data={cacUltimos12} />
//             </Card>
//           </section>
//         </div>

//         <CACSelector cacHistorico={cacHistorico || []} ultimoCAC={ultimoCAC} />
//       </section>

//       <ShareButton datos={datosParaCompartir} />
//     </main>
//   );
// }
