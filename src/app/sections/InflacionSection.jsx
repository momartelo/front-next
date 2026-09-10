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
    <div className="flex flex-col gap-3 flex-1">
      {/* 1. Inflación Mensual */}
      <Card center titleCenter={true} padding="p-3 sm:p-4" className="flex-1">
        <div className="h-full flex flex-col justify-between items-center w-full">
          {/* Arriba: Título */}
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider block">
            Inflación Mensual
          </span>

          {/* Centro: Número */}
          <div className="my-auto">
            {mensual ? (
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-500 tracking-tight">
                {mensual.valor.toFixed(2)}%
              </p>
            ) : (
              <p className="text-xs text-gray-400">N/D</p>
            )}
          </div>

          {/* Abajo: Fecha */}
          <small className="text-gray-400 dark:text-gray-500 text-[10px] block">
            {mensual ? formatFechaISO(mensual.fecha) : "—"}
          </small>
        </div>
      </Card>

      {/* 2. Inflación Interanual */}
      <Card center titleCenter={true} padding="p-3 sm:p-4" className="flex-1">
        <div className="h-full flex flex-col justify-between items-center w-full">
          {/* Arriba: Título */}
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider block">
            Inflación Interanual
          </span>

          {/* Centro: Número */}
          <div className="my-auto">
            {interanual ? (
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-500 tracking-tight">
                {interanual.valor.toFixed(2)}%
              </p>
            ) : (
              <p className="text-xs text-gray-400">N/D</p>
            )}
          </div>

          {/* Abajo: Fecha */}
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
