import Card from "../components/Card";
import { getDolares } from "../lib/dolar";
import { formatFechaHora } from "../lib/date";

export default async function DolaresSection() {
  const dolares = await getDolares();

  return (
    <Card
      title={
        <span className="font-bold text-lg text-gray-800 dark:text-gray-100">
          💵 Dólares
        </span>
      }
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {dolares?.map((d) => {
          const fecha = d.fechaActualizacion
            ? formatFechaHora(d.fechaActualizacion)
            : null;

          return (
            <div
              key={d.casa}
              className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/40 px-2 rounded-lg transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {d.nombre}
                </p>
                <small className="text-gray-400 dark:text-gray-500 text-[11px] block">
                  {fecha ? `${fecha.fecha} · ${fecha.hora}` : "Sin fecha"}
                </small>
              </div>

              <div className="text-right">
                <span className="inline-block bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-sm px-2.5 py-1 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                  ${d.venta?.toFixed(2) ?? "0.00"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// import Card from "../components/Card";
// import { getDolares } from "../lib/dolar";
// import { formatFechaHora } from "../lib/date";

// export default async function DolaresSection() {
//   const dolares = await getDolares();

//   return (
//     <Card title={<span className="font-semibold text-xl">Dolares</span>}>
//       {dolares?.map((d) => {
//         const fecha = d.fechaActualizacion
//           ? formatFechaHora(d.fechaActualizacion)
//           : null;

//         return (
//           <div key={d.casa} className="border-b last:border-0 py-1.5">
//             <p className="font-medium">
//               {d.nombre}: ${d.venta.toFixed(2)}
//             </p>
//             <small className="text-gray-400">
//               Actualizado al: {fecha ? `${fecha.fecha} ${fecha.hora}` : "-"}
//             </small>
//           </div>
//         );
//       })}
//     </Card>
//   );
// }
