import Card from "../components/Card";
import { getEuro, getReal } from "../lib/dolar";
import { formatFechaHora } from "../lib/date";

export default async function MonedasSection() {
  const [euro, real] = await Promise.all([getEuro(), getReal()]);

  const fechaEuro = euro?.fechaActualizacion
    ? formatFechaHora(euro.fechaActualizacion)
    : null;

  const fechaReal = real?.fechaActualizacion
    ? formatFechaHora(real.fechaActualizacion)
    : null;

  return (
    <Card noPadding>
      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800 gap-x-4">
        {/* Euro */}
        <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-1.5">
              <span>💶</span> Euro
            </h3>
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Compra:</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  ${euro?.compra?.toFixed(2) ?? "-"}
                </span>
              </p>
              <p className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Venta:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ${euro?.venta?.toFixed(2) ?? "-"}
                </span>
              </p>
            </div>
          </div>
          <small className="text-gray-400 dark:text-gray-500 text-[10px] mt-2 block border-t border-gray-200/40 dark:border-gray-700/40 pt-1">
            Actualizado: {fechaEuro?.fecha || "-"}
          </small>
        </div>

        {/* Real */}
        <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-1.5">
              <span>🇧🇷</span> Real
            </h3>
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Compra:</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  ${real?.compra?.toFixed(2) ?? "-"}
                </span>
              </p>
              <p className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Venta:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ${real?.venta?.toFixed(2) ?? "-"}
                </span>
              </p>
            </div>
          </div>
          <small className="text-gray-400 dark:text-gray-500 text-[10px] mt-2 block border-t border-gray-200/40 dark:border-gray-700/40 pt-1">
            Actualizado: {fechaReal?.fecha || "-"}
          </small>
        </div>
      </div>
    </Card>
  );
}

// import Card from "../components/Card";
// import { getEuro, getReal } from "../lib/dolar";
// import { formatFechaHora } from "../lib/date";

// export default async function MonedasSection() {
//   const [euro, real] = await Promise.all([getEuro(), getReal()]);

//   const fechaEuro = euro?.fechaActualizacion
//     ? formatFechaHora(euro.fechaActualizacion)
//     : null;

//   const fechaReal = real?.fechaActualizacion
//     ? formatFechaHora(real.fechaActualizacion)
//     : null;

//   return (
//     <div className="flex gap-16 border border-gray-200 rounded-lg">
//       <Card title={<span className="font-semibold">Euro</span>} noBorder>
//         <p className="text-sm">Compra: ${euro?.compra?.toFixed(2) ?? "-"}</p>
//         <p className="text-sm">Venta: ${euro?.venta?.toFixed(2) ?? "-"}</p>
//         <small className="text-gray-400 text-xs">
//           Actualizado al: {fechaEuro?.fecha || "-"}
//         </small>
//       </Card>

//       <Card title={<span className="font-semibold">Real</span>} noBorder>
//         <p className="text-sm">Compra: ${real?.compra?.toFixed(2) ?? "-"}</p>
//         <p className="text-sm">Venta: ${real?.venta?.toFixed(2) ?? "-"}</p>
//         <small className="text-gray-400 text-xs">
//           Actualizado al: {fechaReal?.fecha || "-"}
//         </small>
//       </Card>
//     </div>
//   );
// }
