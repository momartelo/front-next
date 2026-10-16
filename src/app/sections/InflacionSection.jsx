import Card from "../components/Card";
import { formatFechaISO } from "../lib/date";
import {
  getInflacionMensualActual,
  getInflacionInteranualActual,
} from "../lib/inflacion";

export default async function InflacionSection() {
  const [mensual, interanual] = await Promise.all([
    getInflacionMensualActual(),
    getInflacionInteranualActual(),
  ]);

  return (
    <div className="contents lg:flex lg:flex-col lg:gap-3 lg:flex-1">
      {/* 1. Inflación Mensual */}
      <Card center titleCenter={true} padding="p-3 sm:p-4" className="h-full">
        <div className="h-full flex flex-col justify-between items-center w-full">
          <span className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider block">
            Inflación Mensual
          </span>

          <div className="py-2">
            {mensual ? (
              <p className="text-2xl sm:text-3xl font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 pt-1 pb-1.5 rounded-md border border-red-200/60 dark:border-red-800/50 tracking-tight">
                {mensual.valor.toFixed(2)}%
              </p>
            ) : (
              <p className="text-xs text-gray-400">N/D</p>
            )}
          </div>

          <small className="text-gray-400 dark:text-gray-500 text-[10px] block">
            {mensual ? formatFechaISO(mensual.fecha) : "—"}
          </small>
        </div>
      </Card>

      {/* 2. Inflación Interanual */}
      <Card center titleCenter={true} padding="p-3 sm:p-4" className="h-full">
        <div className="h-full flex flex-col justify-between items-center w-full">
          <span className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider block">
            Inflación Interanual
          </span>

          <div className="py-2 flex items-center justify-center">
            {interanual ? (
              <p className="text-2xl sm:text-3xl font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 pt-1 pb-1.5 rounded-md border border-red-200/60 dark:border-red-800/50 tracking-tight">
                {interanual.valor.toFixed(2)}%
              </p>
            ) : (
              <p className="text-xs text-gray-400">N/D</p>
            )}
          </div>

          <small className="text-gray-400 dark:text-gray-500 text-[10px] block">
            {interanual ? formatFechaISO(interanual.fecha) : "—"}
          </small>
        </div>
      </Card>
    </div>
  );
}
// import Card from "../components/Card";
// import { formatFechaISO } from "../lib/date";
// import {
//   getInflacionMensualActual,
//   getInflacionInteranualActual,
// } from "../lib/inflacion";

// export default async function InflacionSection() {
//   const [mensual, interanual] = await Promise.all([
//     getInflacionMensualActual(),
//     getInflacionInteranualActual(),
//   ]);

//   const inflacionColor = mensual
//     ? mensual.valor >= 0
//       ? "text-red-600"
//       : "text-green-600"
//     : "";

//   return (
//     <>
//       <Card title="Inflación mensual" center>
//         {mensual ? (
//           <>
//             <p className={`text-2xl font-semibold ${inflacionColor}`}>
//               {mensual.valor.toFixed(2)}%
//             </p>
//             <small className="text-gray-400 text-xs">
//               {formatFechaISO(mensual.fecha)}
//             </small>
//           </>
//         ) : (
//           <p>No disponible</p>
//         )}
//       </Card>

//       <Card title="Inflación interanual" center>
//         {interanual ? (
//           <>
//             <p className={`text-2xl font-semibold ${inflacionColor}`}>
//               {interanual.valor.toFixed(2)}%
//             </p>
//             <small className="text-gray-400 text-xs">
//               {formatFechaISO(interanual.fecha)}
//             </small>
//           </>
//         ) : (
//           <p>No disponible</p>
//         )}
//       </Card>
//     </>
//   );
// }
