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

    return (
      <span
        className={`flex items-center gap-1 text-sm font-semibold ${
          variacion > 0
            ? "text-red-600"
            : variacion < 0
              ? "text-green-600"
              : "text-gray-500"
        }`}
      >
        {variacion > 0 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 4l6 8h-4v8h-4v-8H6z" />
          </svg>
        )}
        {variacion < 0 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 20l-6-8h4V4h4v8h4z" />
          </svg>
        )}
        {variacion === 0 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
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
        <p className="text-center text-sm text-gray-500 m-0 p-0">General</p>

        <div className="flex items-center justify-center gap-8">
          <p className="text-3xl font-bold text-blue-600">
            {formatNumber(ultimo.general)}
          </p>
          {renderVariacion(variacionGeneral)}
        </div>

        <div className="space-y-2 text-sm mt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Materiales</span>
            <div className="flex items-center gap-3">
              <span className="font-medium text-xl">
                {formatNumber(ultimo.materials)}
              </span>
              {renderVariacion(variacionMateriales)}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Mano de obra</span>
            <div className="flex items-center gap-3">
              <span className="font-medium text-xl">
                {formatNumber(ultimo.labour_force)}
              </span>
              {renderVariacion(variacionManoObra)}
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-2">
            {formatPeriodoCAC(ultimo.period)}
          </p>
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
