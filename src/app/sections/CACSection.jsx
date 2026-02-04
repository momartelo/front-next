import Card from "../components/Card";
import { getCACHistorico } from "../lib/cac";
import { formatPeriodoCAC } from "../lib/date";

export default async function CACSection() {
  const historico = await getCACHistorico();
  const ultimo = historico.at(-1);

  const formatNumber = (value) =>
    Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (!ultimo) return <Card title="CAC">No disponible</Card>;

  return (
    <div id="cac" className="flex flex-col">
      <Card title="Índice de la Construcción - CAC">
        <p className="text-center text-sm text-gray-500 m-0 p-0">General</p>
        <p className="text-3xl font-bold text-center text-blue-600">
          {formatNumber(ultimo.general)}
        </p>

        <div className="space-y-1 text-sm mt-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Materiales</span>
            <span className="font-medium">
              {formatNumber(ultimo.materials)}
            </span>
          </div>
          <div className="flex justify-between m-0">
            <span className="text-gray-600">Mano de obra</span>
            <span className="font-medium ">
              {formatNumber(ultimo.labour_force)}
            </span>
          </div>
          <p className="text-center text-xs text-gray-600">
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
