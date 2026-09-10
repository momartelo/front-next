import Card from "../components/Card";

const LOGOS = {
  ypf: "/logos/ypf.png",
  shell: "/logos/shell.png",
  axion: "/logos/axion.png",
  puma: "/logos/puma.png",
};

// Formatea "2026-02-11" a "11/2/2026" sin problemas de UTC/Zona Horaria
function formatFechaString(fechaStr) {
  if (!fechaStr) return null;
  const parts = fechaStr.split("T")[0].split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  return `${parseInt(day)}/${parseInt(month)}/${year}`;
}

export default function CombustiblesSection({ combustibles }) {
  if (!combustibles) {
    return (
      <Card
        title={
          <span className="font-bold text-base text-gray-800 dark:text-gray-100">
            ⛽ Combustibles · Mar del Plata
          </span>
        }
      >
        <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500 italic">
          Precios temporalmente no disponibles
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800 mb-2">
          <span className="font-bold text-base text-gray-800 dark:text-gray-100">
            ⛽ Combustibles · MdP
          </span>
          <span className="text-[10px] font-normal text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            Secretaría de Energía
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(combustibles).map(([key, e]) => {
          if (!e) return null;

          const renderItem = (label, item) => {
            const precio = typeof item === "object" ? item?.precio : item;
            const fechaRaw = typeof item === "object" ? item?.fecha : null;
            const fechaFormateada = formatFechaString(fechaRaw);

            return (
              <div className="flex justify-between items-center py-0.5">
                <div className="flex flex-col">
                  <span className="text-gray-600 dark:text-gray-300">
                    {label}
                  </span>
                  {fechaFormateada && (
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-none">
                      Actualizado: {fechaFormateada}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {typeof precio === "number" && !isNaN(precio)
                    ? `$${precio.toFixed(2)}`
                    : "-"}
                </span>
              </div>
            );
          };

          return (
            <div
              key={key}
              className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={LOGOS[key]}
                      alt={e.empresa || key}
                      className="h-4 object-contain"
                    />
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-gray-200">
                      {e.empresa || key}
                    </span>
                  </div>
                  {e.manual && (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium border border-amber-200/40">
                      Manual
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  {renderItem("Súper:", e.nafta?.super)}
                  {renderItem("Premium:", e.nafta?.premium)}
                  {renderItem("Gasoil:", e.gasoil?.comun)}
                  {renderItem("G. Premium:", e.gasoil?.premium)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
// import Card from "../components/Card";
// import { formatFechaHora } from "../lib/date";

// const LOGOS = {
//   ypf: "/logos/ypf.png",
//   shell: "/logos/shell.png",
//   axion: "/logos/axion.png",
//   puma: "/logos/puma.png",
// };

// export default function CombustiblesSection({ combustibles }) {
//   if (!combustibles) {
//     return (
//       <Card
//         title={
//           <>
//             <span className="block w-full text-center pb-4 font-semibold">
//               Combustibles · Mar del Plata
//             </span>
//             <span className="block w-full text-center pb-4 font-semibold">
//               No disponibles
//             </span>
//           </>
//         }
//       ></Card>
//     );
//   }

//   return (
//     <Card
//       title={
//         <span className="block w-full text-center pb-4 font-semibold">
//           Combustibles · Mar del Plata
//         </span>
//       }
//     >
//       <div className="grid grid-cols-2 gap-2 sm:gap-2">
//         {Object.entries(combustibles).map(([key, e]) => {
//           if (!e) return null;

//           return (
//             <div key={key} className="pb-2">
//               <div className="flex items-center gap-2 mb-1">
//                 <img src={LOGOS[key]} className="h-5" />
//                 <p className="font-semibold text-blue-700">{e.empresa}</p>
//                 {e.manual && (
//                   <span className="ml-1 p-0.5 px-2 flex items-center gap-1 text-[11px] bg-amber-50 text-amber-600 font-medium rounded-md">
//                     <span className="h-1.5 w-1.5 mr-1 rounded-full bg-amber-500" />
//                     Dato Manual
//                   </span>
//                 )}
//               </div>

//               <div className="mt-1 text-sm">
//                 <p>Nafta Súper: ${e.nafta.super?.toFixed(2) ?? "-"}</p>
//                 <p>Nafta Premium: ${e.nafta.premium?.toFixed(2) ?? "-"}</p>
//                 <p>Gasoil: ${e.gasoil.comun?.toFixed(2) ?? "-"}</p>
//                 <p>Gasoil Premium: ${e.gasoil.premium?.toFixed(2) ?? "-"}</p>
//               </div>

//               <small className="text-gray-400 text-xs">
//                 Actualizado al: {formatFechaHora(e.fechaActualizacion)?.fecha}
//               </small>
//             </div>
//           );
//         })}

//         <p className="text-gray-400 text-xs col-span-2">
//           Fuente: Secretaría de Energía / Overrides manuales
//         </p>
//       </div>
//     </Card>
//   );
// }
