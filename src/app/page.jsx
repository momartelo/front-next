import Card from "./components/Card";
import { getDolares, getEuro, getReal } from "./lib/dolar";
import {
  getInflacionMensualActual,
  getInflacionInteranualActual,
} from "./lib/inflacion";
import { formatFechaHora } from "./lib/date";
import { getCACHistorico } from "./lib/cac";
import CACChart from "./components/CACChart";
import CACSelector from "./components/CACSelector";

import { getCombustiblesMarDelPlata } from "./lib/ypf";

export default async function Dashboard() {
  const [
    dolares,
    euro,
    real,
    inflacionMensual,
    inflacionInteranual,
    cacHistorico,
    combustibles,
  ] = await Promise.all([
    getDolares(),
    getEuro(),
    getReal(),
    getInflacionMensualActual(),
    getInflacionInteranualActual(),
    getCACHistorico(),
    getCombustiblesMarDelPlata(),
  ]);

  const getFechaFormateada = (item) =>
    item?.fechaActualizacion ? formatFechaHora(item.fechaActualizacion) : null;

  const fechaEuro = getFechaFormateada(euro);
  const fechaReal = getFechaFormateada(real);

  const inflacionColor = inflacionMensual
    ? inflacionMensual.valor >= 0
      ? "text-red-600"
      : "text-green-600"
    : "";

  const cacUltimos12 = cacHistorico.slice(-12);

  const formatNumber = (value) =>
    Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const ultimoCAC = cacHistorico.length ? cacHistorico.at(-1) : null;

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-center">
        Dashboard económico
      </h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.4fr]">
        {/* DÓLARES */}
        <Card title="Dólares">
          {dolares.map((d) => {
            const fecha = getFechaFormateada(d);
            return (
              <div key={d.casa} className="border-b last:border-0 py-2">
                <p className="font-medium">
                  {d.nombre}: ${d.venta.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Fecha de actualización:{" "}
                  {fecha ? `${fecha.fecha} ${fecha.hora}` : "-"}
                </p>
              </div>
            );
          })}
        </Card>

        {/* EURO / REAL */}
        <div className="flex flex-col gap-4 ">
          <div className="flex gap-4 justify-evenly border border-gray-200 rounded-lg ">
            <Card
              title={<span className="font-semibold">Euro</span>}
              noBorder
              titleCenter={false}
            >
              <p className="text-sm">Compra: ${euro.compra.toFixed(2)}</p>
              <p className="text-sm">Venta: ${euro.venta.toFixed(2)}</p>
              <small className="text-gray-500 flex flex-wrap">
                <span>Fecha de actualización:</span>
                <span>
                  {fechaEuro ? `${fechaEuro.fecha} ${fechaEuro.hora}` : "-"}
                </span>
              </small>
            </Card>

            <Card
              title={<span className="font-semibold">Real</span>}
              noBorder
              titleCenter={false}
            >
              <p className="text-sm">Compra: ${real.compra.toFixed(2)}</p>
              <p className="text-sm">Venta: ${real.venta.toFixed(2)}</p>
              <small className="text-gray-500 flex flex-wrap">
                <span>Fecha de actualización:</span>
                <span>
                  {fechaReal ? `${fechaReal.fecha} ${fechaReal.hora}` : "-"}
                </span>
              </small>
            </Card>
          </div>
          <Card
            title={
              <span className="block w-full text-center pb-4 font-semibold">
                Combustibles · Mar del Plata
              </span>
            }
          >
            {combustibles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["ypf", "shell"].map((key) => {
                  const e = combustibles[key];
                  if (!e) return null;

                  return (
                    <div key={key} className="pb-2">
                      <p className="font-semibold">{e.empresa}</p>

                      <div className="mt-1 text-sm">
                        <p>Nafta Súper: ${e.nafta.super?.toFixed(2) ?? "-"}</p>
                        <p>
                          Nafta Premium: ${e.nafta.premium?.toFixed(2) ?? "-"}
                        </p>
                        <p>Gasoil: ${e.gasoil.comun?.toFixed(2) ?? "-"}</p>
                        <p>
                          Gasoil Premium: ${e.gasoil.premium?.toFixed(2) ?? "-"}
                        </p>
                      </div>
                      <small className="text-gray-500">
                        Ult. Actualizacion: {e.fechaActualizacion}
                      </small>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400">No disponible</p>
            )}
          </Card>
        </div>

        {/* INFLACIÓN */}
        <div className="flex flex-col gap-4">
          <Card title="Inflación mensual" center>
            {inflacionMensual ? (
              <>
                <p className={`text-2xl font-semibold ${inflacionColor}`}>
                  {inflacionMensual.valor.toFixed(2)}%
                </p>
                <small>{inflacionMensual.fecha}</small>
              </>
            ) : (
              <p className="text-gray-400">No disponible</p>
            )}
          </Card>

          <Card title="Inflación interanual" center>
            {inflacionInteranual ? (
              <>
                <p className={`text-2xl font-semibold ${inflacionColor}`}>
                  {inflacionInteranual.valor.toFixed(2)}%
                </p>
                <small>{inflacionInteranual.fecha}</small>
              </>
            ) : (
              <p>No disponible</p>
            )}
          </Card>
        </div>

        {/* CAC ACTUAL + GRÁFICO */}
        <div className="flex flex-col">
          <Card title="Índice de la Construcción - CAC">
            {cacHistorico.length ? (
              (() => {
                const ultimo = cacHistorico.at(-1);
                const date = new Date(ultimo.period);

                const mes = date.toLocaleString("es-AR", {
                  month: "long",
                  timeZone: "UTC",
                });
                const año = date.getUTCFullYear();

                return (
                  <>
                    <p className="text-3xl font-bold mb-1 text-center mt-1 text-blue-600">
                      {formatNumber(ultimo.general)}
                    </p>

                    <small className="text-gray-500 block mb-3 text-center">
                      {mes} de {año}
                    </small>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Materiales</span>
                        <span className="font-medium">
                          {formatNumber(ultimo.materials)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Mano de obra</span>
                        <span className="font-medium">
                          {formatNumber(ultimo.labour_force)}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()
            ) : (
              <p className="text-gray-400">No disponible</p>
            )}
          </Card>

          <section className="mt-4">
            <Card title="Evolución Índice CAC (últimos 12 meses)">
              <CACChart data={cacUltimos12} />
            </Card>
          </section>
        </div>

        {/* SELECTOR CAC */}
        <CACSelector cacHistorico={cacHistorico} ultimoCAC={ultimoCAC} />
      </section>
    </main>
  );
}

// import Card from "./components/Card";
// import { getDolares, getEuro, getReal } from "./lib/dolar";
// import {
//   getInflacionMensualActual,
//   getInflacionInteranualActual,
// } from "./lib/inflacion";
// import { formatFechaHora } from "./lib/date";
// import { getCACHistorico } from "./lib/cac";
// import CACChart from "./components/CACChart";
// import CACSelector from "./components/CACSelector";

// import { getCombustiblesMarDelPlata } from "./lib/ypf";

// export default async function Dashboard() {
//   const [
//     dolares,
//     euro,
//     real,
//     inflacionMensual,
//     inflacionInteranual,
//     cacHistorico,
//     combustibles,
//   ] = await Promise.all([
//     getDolares(),
//     getEuro(),
//     getReal(),
//     getInflacionMensualActual(),
//     getInflacionInteranualActual(),
//     getCACHistorico(),
//     getCombustiblesMarDelPlata(),
//   ]);

//   const getFechaFormateada = (item) =>
//     item?.fechaActualizacion ? formatFechaHora(item.fechaActualizacion) : null;

//   const fechaEuro = getFechaFormateada(euro);
//   const fechaReal = getFechaFormateada(real);

//   const inflacionColor = inflacionMensual
//     ? inflacionMensual.valor >= 0
//       ? "text-red-600"
//       : "text-green-600"
//     : "";

//   const cacUltimos12 = cacHistorico.slice(-12);

//   const formatNumber = (value) =>
//     Number(value).toLocaleString("es-AR", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });

//   return (
//     <main className="p-6 max-w-7xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6">Tablero económico</h1>

//       <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.4fr]">
//         {/* DÓLARES */}
//         <Card title="Dólares">
//           {dolares.map((d) => {
//             const fecha = getFechaFormateada(d);
//             return (
//               <div key={d.casa} className="border-b last:border-0 py-2">
//                 <p className="font-medium">
//                   {d.nombre}: ${d.venta.toFixed(2)}
//                 </p>
//                 <p className="text-sm text-gray-500">
//                   Fecha de actualización:{" "}
//                   {fecha ? `${fecha.fecha} ${fecha.hora}` : "-"}
//                 </p>
//               </div>
//             );
//           })}
//         </Card>

//         {/* EURO / REAL */}
//         <div className="flex flex-col gap-4">
//           <div className="flex gap-4">
//             <Card title={<span className="font-semibold">Euro</span>}>
//               <p>Compra: ${euro.compra.toFixed(2)}</p>
//               <p>Venta: ${euro.venta.toFixed(2)}</p>
//               <small>
//                 Fecha de actualización:{" "}
//                 {fechaEuro ? `${fechaEuro.fecha} ${fechaEuro.hora}` : "-"}
//               </small>
//             </Card>

//             <Card title={<span className="font-semibold">Real</span>}>
//               <p>Compra: ${real.compra.toFixed(2)}</p>
//               <p>Venta: ${real.venta.toFixed(2)}</p>
//               <small>
//                 Fecha de actualización:{" "}
//                 {fechaReal ? `${fechaReal.fecha} ${fechaReal.hora}` : "-"}
//               </small>
//             </Card>
//           </div>
//           <Card
//             title={
//               <span className="block w-full text-center pb-2">
//                 Combustibles · Mar del Plata
//               </span>
//             }
//           >
//             {combustibles ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 {["ypf", "shell"].map((key) => {
//                   const e = combustibles[key];
//                   if (!e) return null;

//                   return (
//                     <div key={key} className="pb-2">
//                       <p className="font-semibold">{e.empresa}</p>

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
//                       <small className="text-gray-500">
//                         Ult. Actualizacion: {e.fechaActualizacion}
//                       </small>
//                     </div>
//                   );
//                 })}
//               </div>
//             ) : (
//               <p className="text-gray-400">No disponible</p>
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
//                 <small>{inflacionMensual.fecha}</small>
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
//                 <small>{inflacionInteranual.fecha}</small>
//               </>
//             ) : (
//               <p>No disponible</p>
//             )}
//           </Card>
//         </div>

//         {/* CAC ACTUAL + GRÁFICO */}
//         <div className="flex flex-col">
//           <Card title="Índice de la Construcción - CAC">
//             {cacHistorico.length ? (
//               (() => {
//                 const ultimo = cacHistorico.at(-1);
//                 const date = new Date(ultimo.period);

//                 const mes = date.toLocaleString("es-AR", {
//                   month: "long",
//                   timeZone: "UTC",
//                 });
//                 const año = date.getUTCFullYear();

//                 return (
//                   <>
//                     <p className="text-3xl font-bold mb-1 text-center mt-1 text-blue-600">
//                       {formatNumber(ultimo.general)}
//                     </p>

//                     <small className="text-gray-500 block mb-3 text-center">
//                       {mes} de {año}
//                     </small>

//                     <div className="space-y-1 text-sm">
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">Materiales</span>
//                         <span className="font-medium">
//                           {formatNumber(ultimo.materials)}
//                         </span>
//                       </div>

//                       <div className="flex justify-between">
//                         <span className="text-gray-600">Mano de obra</span>
//                         <span className="font-medium">
//                           {formatNumber(ultimo.labour_force)}
//                         </span>
//                       </div>
//                     </div>
//                   </>
//                 );
//               })()
//             ) : (
//               <p className="text-gray-400">No disponible</p>
//             )}
//           </Card>

//           <section className="mt-4">
//             <Card title="Evolución Índice CAC (últimos 12 meses)">
//               <CACChart data={cacUltimos12} />
//             </Card>
//           </section>
//         </div>

//         {/* SELECTOR CAC */}
//         <CACSelector cacHistorico={cacHistorico} />
//       </section>
//     </main>
//   );
// }
