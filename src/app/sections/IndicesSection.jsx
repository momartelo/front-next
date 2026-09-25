import Card from "../components/Card";
import { formatFechaISO } from "../lib/date";
import { getIndiceUVAActual } from "../lib/indiceUVA";
import { getRiesgoPaisUltimo } from "../lib/riesgoPais";

export default async function IndicesSection() {
  const [uva, riesgo] = await Promise.all([
    getIndiceUVAActual(),
    getRiesgoPaisUltimo(),
  ]);

  return (
    <div className="contents lg:flex lg:flex-col lg:gap-3 lg:flex-1">
      {/* 3. Valor UVA */}
      <Card center titleCenter={true} padding="p-3 sm:p-4" className="h-full">
        <div className="h-full flex flex-col justify-between items-center w-full">
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider block">
            Valor UVA
          </span>

          <div className="my-auto py-2">
            {uva ? (
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                ${uva.valor.toFixed(2)}
              </p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>

          <small className="text-gray-400 dark:text-gray-500 text-[10px] block">
            {uva ? formatFechaISO(uva.fecha) : "—"}
          </small>
        </div>
      </Card>

      {/* 4. Riesgo País */}
      <Card center titleCenter={true} padding="p-3 sm:p-4" className="h-full">
        <div className="h-full flex flex-col justify-between items-center w-full">
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider block">
            Riesgo País
          </span>

          <div className="my-auto py-2">
            {riesgo ? (
              <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-500 tracking-tight">
                {riesgo.valor.toFixed(0)}{" "}
                <span className="text-xs font-bold text-gray-400">pts</span>
              </p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>

          <small className="text-gray-400 dark:text-gray-500 text-[10px] block">
            {riesgo ? formatFechaISO(riesgo.fecha) : "—"}
          </small>
        </div>
      </Card>
    </div>
  );
}
// import Card from "../components/Card";
// import { formatFechaISO } from "../lib/date";
// import { getIndiceUVAActual } from "../lib/indiceUVA";
// import { getInflacionMensualActual } from "../lib/inflacion";
// import { getRiesgoPaisUltimo } from "../lib/riesgoPais";

// export default async function IndicesSection() {
//   const [uva, riesgo, mensual] = await Promise.all([
//     getIndiceUVAActual(),
//     getRiesgoPaisUltimo(),
//     getInflacionMensualActual(),
//   ]);

//   const inflacionColor = mensual
//     ? mensual.valor >= 0
//       ? "text-red-600"
//       : "text-green-600"
//     : "";

//   return (
//     <>
//       <Card title="Índice UVA" center>
//         {uva ? (
//           <>
//             <p className={`text-2xl font-semibold ${inflacionColor}`}>
//               {uva.valor.toFixed(2)}
//             </p>
//             <small className="text-gray-400 text-xs">
//               {formatFechaISO(uva.fecha)}
//             </small>
//           </>
//         ) : (
//           "—"
//         )}
//       </Card>

//       <Card title="Riesgo País" center>
//         {riesgo ? (
//           <>
//             <p className={`text-2xl font-semibold ${inflacionColor}`}>
//               {riesgo.valor.toFixed(0)}
//             </p>
//             <small className="text-gray-400 text-xs">
//               {formatFechaISO(riesgo.fecha)}
//             </small>
//           </>
//         ) : (
//           "—"
//         )}
//       </Card>
//     </>
//   );
// }
