// import { getCombustiblesPorLocalidad } from "../lib/combustiblesPorCiudad";

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

//-----------------------------------------------------------------------------------
//! Version 2

// export const dynamic = "force-dynamic";
// import CombustiblesClient from "../lib/combustiblesClient";
// import { getCombustiblesPorLocalidad } from "../lib/combustiblesPorCiudad";

// export default async function Page() {
//   const data = await getCombustiblesPorLocalidad();

//   return <CombustiblesClient data={data} />;
// }

// app/combustibles/page.jsx
// app/combustibles/page.jsx
// app/combustibles/page.jsx
// src/app/combustibles/page.jsx
import { getDatosCombustibles } from "../lib/combustiblesPorCiudad";
import CombustiblesClient from "../lib/combustiblesClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function CombustiblesData() {
  const datos = await getDatosCombustibles();

  if (datos.error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
        <strong>Error de carga:</strong> {datos.error}
      </div>
    );
  }

  return (
    <CombustiblesClient
      registros={datos.registros}
      provincias={datos.provincias}
    />
  );
}

export default function CombustiblesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Precios de Combustibles
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Consulta y compara los precios vigentes por provincia, localidad y
          estación de servicio
        </p>
      </div>

      <Suspense fallback={<TablaLoadingSkeleton />}>
        <CombustiblesData />
      </Suspense>
    </div>
  );
}

function TablaLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 h-20" />
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-10 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}
