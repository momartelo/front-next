import Card from "../components/Card";
import { getCACHistorico } from "../lib/cac";
import { formatPeriodoCAC } from "../lib/date";

export default async function CACSection() {
  const historico = await getCACHistorico();
  const ultimo = historico.at(-1);
  const anterior = historico.at(-2);

  const calcularVariacion = (actual, previo) => {
    if (!previo || !previo) return null;
    return ((actual - previo) / previo) * 100;
  };

  const variacionGeneral = anterior?.general
    ? calcularVariacion(ultimo.general, anterior.general)
    : null;

  const variacionMateriales = anterior?.materials
    ? calcularVariacion(ultimo.materials, anterior.materials)
    : null;

  const variacionManoObra = anterior?.labour_force
    ? calcularVariacion(ultimo.labour_force, anterior.labour_force)
    : null;

  const formatNumber = (value) =>
    Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const renderVariacion = (variacion) => {
    if (variacion === null) return null;

    const isPositive = variacion > 0;
    const isNegative = variacion < 0;

    const badgeStyles = isPositive
      ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      : isNegative
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        : "bg-gray-500/10 text-gray-500 border-gray-500/20";

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${badgeStyles}`}
      >
        {isPositive && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 4l6 8h-4v8h-4v-8H6z" />
          </svg>
        )}
        {isNegative && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 20l-6-8h4V4h4v8h4z" />
          </svg>
        )}
        {variacion === 0 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="5" />
          </svg>
        )}
        {Math.abs(variacion).toFixed(2)}%
      </span>
    );
  };

  if (!ultimo) return <Card title="CAC">No disponible</Card>;

  return (
    <div id="cac" className="flex flex-col">
      <Card title="Índice de la Construcción - CAC">
        <div className="flex flex-col items-center justify-center pt-2 pb-4 border-b border-gray-100 dark:border-neutral-800">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
            Índice General
          </span>
          <div className="flex items-center gap-3">
            <p className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {formatNumber(ultimo.general)}
            </p>
            {renderVariacion(variacionGeneral)}
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <div className="flex justify-between items-center p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
            <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
              Materiales
            </span>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {formatNumber(ultimo.materials)}
              </span>
              {renderVariacion(variacionMateriales)}
            </div>
          </div>

          <div className="flex justify-between items-center p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
            <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
              Mano de obra
            </span>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {formatNumber(ultimo.labour_force)}
              </span>
              {renderVariacion(variacionManoObra)}
            </div>
          </div>

          <div className="pt-2 text-center">
            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-neutral-800/80 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-neutral-700/50">
              Período: {formatPeriodoCAC(ultimo.period)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
// {
//   ultimo ? (
//     <>
//       <p className="text-center text-sm text-gray-500 m-0 p-0">General</p>

//       <p className="text-3xl font-bold text-center  text-blue-600">
//         {formatNumber(ultimoCAC.general)}
//       </p>

//       <div className="space-y-1 text-sm mt-2">
//         <div className="flex justify-between">
//           <span className="text-gray-600">Materiales</span>
//           <span className="font-medium">
//             {formatNumber(ultimoCAC.materials)}
//           </span>
//         </div>
//         <div className="flex justify-between m-0">
//           <span className="text-gray-600">Mano de obra</span>
//           <span className="font-medium ">
//             {formatNumber(ultimoCAC.labour_force)}
//           </span>
//         </div>
//         <p className="text-center text-xs text-gray-600">
//           {formatPeriodoCAC(ultimoCAC.period)}
//         </p>
//       </div>
//     </>
//   ) : (
//     <p className="text-gray-400">No disponible</p>
//   );
// }
