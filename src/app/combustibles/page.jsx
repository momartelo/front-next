// import { getCombustiblesPorLocalidad } from "../lib/combustiblesPorCiudad";

import CombustiblesClient from "../lib/combustiblesClient";
import { getCombustiblesPorLocalidad } from "../lib/combustiblesPorCiudad";

// export default async function CombustiblesPage() {
//   const data = await getCombustiblesPorLocalidad();

//   if (!data) {
//     return (
//       <main className="p-6">
//         <h1 className="text-2xl font-bold">Combustibles</h1>
//         <p>No se pudieron cargar los datos.</p>
//       </main>
//     );
//   }

//   const localidades = Object.keys(data).sort();

//   return (
//     <main className="p-6 max-w-6xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6">
//         Precios de Combustibles por Localidad
//       </h1>

//       {localidades.map((loc) => {
//         const empresas = data[loc];

//         return (
//           <section key={loc} className="mb-10">
//             <h2 className="text-xl font-semibold mb-4">{loc}</h2>

//             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
//               {Object.entries(empresas).map(([empresaKey, empresa]) => {
//                 if (!empresa) return null;

//                 return (
//                   <div
//                     key={empresaKey}
//                     className="border rounded-lg p-4 shadow-sm bg-white"
//                   >
//                     <h3 className="text-lg font-bold mb-2">
//                       {empresa.empresa}
//                     </h3>

//                     <p className="text-sm text-gray-500 mb-3">
//                       Actualizado: {empresa.fechaActualizacion || "N/A"}
//                     </p>

//                     <div className="space-y-1 text-sm">
//                       <p>
//                         Nafta Super:{" "}
//                         <strong>
//                           {empresa.nafta.super
//                             ? `$${empresa.nafta.super}`
//                             : "-"}
//                         </strong>
//                       </p>

//                       <p>
//                         Nafta Premium:{" "}
//                         <strong>
//                           {empresa.nafta.premium
//                             ? `$${empresa.nafta.premium}`
//                             : "-"}
//                         </strong>
//                       </p>

//                       <p>
//                         Gasoil Común:{" "}
//                         <strong>
//                           {empresa.gasoil.comun
//                             ? `$${empresa.gasoil.comun}`
//                             : "-"}
//                         </strong>
//                       </p>

//                       <p>
//                         Gasoil Premium:{" "}
//                         <strong>
//                           {empresa.gasoil.premium
//                             ? `$${empresa.gasoil.premium}`
//                             : "-"}
//                         </strong>
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </section>
//         );
//       })}
//     </main>
//   );
// }

export default async function Page() {
  // 1. Buscamos los datos en el servidor
  const data = await getCombustiblesPorLocalidad();

  // 2. Se los pasamos al componente de cliente como una "prop" llamada data
  return <CombustiblesClient data={data} />;
}
