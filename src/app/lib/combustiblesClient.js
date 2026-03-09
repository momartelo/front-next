"use client";

import { useState } from "react";

export default function CombustiblesClient({ data }) {
  const [selectedLocalidades, setSelectedLocalidades] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  if (!data)
    return <p className="p-10 text-center">No hay datos disponibles.</p>;

  const todasLasLocalidades = Object.keys(data).sort();

  // Extraemos todas las empresas únicas (Shell, YPF, etc.)
  const todasLasEmpresas = Array.from(
    new Set(Object.values(data).flatMap((loc) => Object.keys(loc))),
  ).sort();

  const localidadesFiltradas = todasLasLocalidades.filter((loc) =>
    loc.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Esta función ahora sirve tanto para el panel lateral como para las "X"
  const toggleLocalidad = (loc) => {
    if (selectedLocalidades.includes(loc)) {
      setSelectedLocalidades(
        selectedLocalidades.filter((item) => item !== loc),
      );
    } else if (selectedLocalidades.length < 3) {
      setSelectedLocalidades([...selectedLocalidades, loc]);
      setSearchTerm("");
    } else {
      alert("Máximo 3 localidades para comparar.");
    }
  };

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen font-sans text-slate-900">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">
            Comparador de Precios
          </h1>
          <p className="text-slate-500 mt-1">
            Selecciona hasta 3 ciudades para cruzar datos por bandera.
          </p>
        </div>

        {/* Chips de ciudades seleccionadas (con X para quitar) */}
        <div className="flex flex-wrap gap-2">
          {selectedLocalidades.map((loc) => (
            <button
              key={loc}
              onClick={() => toggleLocalidad(loc)}
              className="group bg-blue-600 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              {loc}
              <span className="bg-blue-500 group-hover:bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                ✕
              </span>
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* PANEL LATERAL */}
        <aside className="lg:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-fit sticky top-4">
          <h2 className="font-bold mb-4 text-slate-700 uppercase text-xs tracking-widest">
            Localidades
          </h2>
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full p-3 bg-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mb-4 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-80 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
            {localidadesFiltradas.map((loc) => {
              const estaSeleccionado = selectedLocalidades.includes(loc);
              return (
                <button
                  key={loc}
                  onClick={() => toggleLocalidad(loc)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${
                    estaSeleccionado
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-100"
                      : "hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  {estaSeleccionado ? "● " : "+ "} {loc}
                </button>
              );
            })}
          </div>
        </aside>

        {/* COMPARATIVA POR EMPRESA */}
        <div className="lg:col-span-3 space-y-10">
          {selectedLocalidades.length > 0 ? (
            todasLasEmpresas.map((empresaNombre) => (
              <section
                key={empresaNombre}
                className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden"
              >
                <div className="bg-slate-900 p-4">
                  <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {empresaNombre}
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase w-1/4">
                          Combustible
                        </th>
                        {selectedLocalidades.map((loc) => (
                          <th
                            key={loc}
                            className="p-4 text-sm font-bold text-slate-700 border-l border-slate-100 text-center relative group"
                          >
                            {loc}
                            {/* Botón X flotante en el encabezado de la tabla */}
                            <button
                              onClick={() => toggleLocalidad(loc)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center justify-center text-[10px]"
                              title="Quitar ciudad"
                            >
                              ✕
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <FilaProducto
                        etiqueta="Nafta Super"
                        campo="super"
                        sub="nafta"
                        empresa={empresaNombre}
                        localidades={selectedLocalidades}
                        data={data}
                      />
                      <FilaProducto
                        etiqueta="Nafta Premium"
                        campo="premium"
                        sub="nafta"
                        empresa={empresaNombre}
                        localidades={selectedLocalidades}
                        data={data}
                      />
                      <FilaProducto
                        etiqueta="Gasoil Común"
                        campo="comun"
                        sub="gasoil"
                        empresa={empresaNombre}
                        localidades={selectedLocalidades}
                        data={data}
                      />
                      <FilaProducto
                        etiqueta="Gasoil Premium"
                        campo="premium"
                        sub="gasoil"
                        empresa={empresaNombre}
                        localidades={selectedLocalidades}
                        data={data}
                      />

                      {/* FILA DE ACTUALIZACIÓN CON ESTILO DE ALERTAS */}
                      <tr className="bg-slate-50/50">
                        <td className="p-4 text-[10px] font-bold text-slate-400 uppercase italic">
                          Fecha de Ref.
                        </td>
                        {selectedLocalidades.map((loc) => {
                          const fecha =
                            data[loc][empresaNombre]?.fechaActualizacion;
                          const esViejo = esFechaVieja(fecha);
                          return (
                            <td
                              key={loc}
                              className={`p-4 text-center border-l border-slate-100 ${esViejo ? "bg-red-50" : ""}`}
                            >
                              <span
                                className={`text-[10px] font-bold ${esViejo ? "text-red-500" : "text-slate-500"}`}
                              >
                                {fecha || "---"}
                                {esViejo && " ⚠️"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          ) : (
            <div className="h-80 flex flex-col items-center justify-center border-4 border-dashed border-slate-200 rounded-[40px] bg-white text-slate-400 transition-all">
              <div className="bg-slate-100 p-6 rounded-full mb-4 text-4xl">
                📊
              </div>
              <p className="text-xl font-semibold">
                Selecciona localidades para comparar
              </p>
              <p className="text-sm">
                Puedes elegir hasta 3 ciudades del panel izquierdo.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Lógica de fecha (30 días de antigüedad)
function esFechaVieja(fechaStr) {
  if (!fechaStr) return false;
  try {
    const [dia, mes, anio] = fechaStr.split("/");
    const fechaActualizacion = new Date(anio, mes - 1, dia);
    const hoy = new Date();
    const diferenciaDias = (hoy - fechaActualizacion) / (1000 * 60 * 60 * 24);
    return diferenciaDias > 30;
  } catch {
    return false;
  }
}

function FilaProducto({ etiqueta, campo, sub, empresa, localidades, data }) {
  // Encontrar el precio más bajo de la fila para resaltarlo
  const precios = localidades
    .map((loc) => parseFloat(data[loc][empresa]?.[sub]?.[campo]))
    .filter((p) => !isNaN(p));
  const minPrecio = precios.length > 0 ? Math.min(...precios) : null;

  return (
    <tr className="hover:bg-blue-50/30 transition-colors">
      <td className="p-4 text-sm font-semibold text-slate-600">{etiqueta}</td>
      {localidades.map((loc) => {
        const precioRaw = data[loc][empresa]?.[sub]?.[campo];
        const precioNum = parseFloat(precioRaw);
        const esMasBarato =
          minPrecio && precioNum === minPrecio && localidades.length > 1;

        return (
          <td
            key={loc}
            className={`p-4 text-center border-l border-slate-100 ${esMasBarato ? "bg-green-50/50" : ""}`}
          >
            <span
              className={`font-mono text-base font-bold ${esMasBarato ? "text-green-600" : precioRaw ? "text-slate-800" : "text-slate-200"}`}
            >
              {precioRaw ? `$${precioRaw}` : "---"}
            </span>
            {esMasBarato && (
              <div className="text-[8px] text-green-500 font-bold uppercase mt-1">
                Mejor Precio
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}

//------------------------------------------------------------------------------
// "use client";

// import { useState, useMemo } from "react";

// export default function CombustiblesPage({ data }) {
//   // Estado para manejar múltiples localidades seleccionadas
//   const [selectedLocalidades, setSelectedLocalidades] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");

//   if (!data)
//     return <p className="p-10 text-center">No hay datos disponibles.</p>;

//   const todasLasLocalidades = Object.keys(data).sort();

//   // Filtrar la lista del desplegable según lo que el usuario escribe
//   const localidadesFiltradas = todasLasLocalidades.filter((loc) =>
//     loc.toLowerCase().includes(searchTerm.toLowerCase()),
//   );

//   // Función para agregar/quitar localidades
//   const toggleLocalidad = (loc) => {
//     if (selectedLocalidades.includes(loc)) {
//       setSelectedLocalidades(
//         selectedLocalidades.filter((item) => item !== loc),
//       );
//     } else {
//       if (selectedLocalidades.length < 3) {
//         setSelectedLocalidades([...selectedLocalidades, loc]);
//         setSearchTerm(""); // Limpiar buscador al seleccionar
//       } else {
//         alert("Puedes comparar hasta 3 localidades a la vez.");
//       }
//     }
//   };

//   return (
//     <main className="p-4 md:p-10 max-w-7xl mx-auto bg-gray-50 min-h-screen">
//       <div className="mb-8">
//         <h1 className="text-4xl font-black text-slate-800 mb-2">
//           Comparador de Combustibles
//         </h1>
//         <p className="text-slate-500">
//           Selecciona hasta 3 ciudades para comparar precios en tiempo real.
//         </p>
//       </div>

//       {/* BUSCADOR Y SELECCIÓN */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
//         <div className="lg:col-span-1 space-y-4">
//           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
//             <label className="block text-sm font-bold text-slate-700 mb-3">
//               Buscar Localidad:
//             </label>
//             <input
//               type="text"
//               placeholder="Ej: Rosario, Córdoba..."
//               className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none mb-4"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />

//             <div className="max-h-60 overflow-y-auto border-t border-slate-100 pt-2">
//               {localidadesFiltradas.map((loc) => (
//                 <button
//                   key={loc}
//                   onClick={() => toggleLocalidad(loc)}
//                   className={`w-full text-left px-4 py-2 rounded-lg mb-1 text-sm transition-colors ${
//                     selectedLocalidades.includes(loc)
//                       ? "bg-blue-600 text-white"
//                       : "hover:bg-slate-100 text-slate-600"
//                   }`}
//                 >
//                   {selectedLocalidades.includes(loc) ? "✓ " : "+ "} {loc}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* VISTA DE COMPARACIÓN */}
//         <div className="lg:col-span-2">
//           {selectedLocalidades.length > 0 ? (
//             <div className="space-y-6">
//               {/* Chips de selección */}
//               <div className="flex gap-2 flex-wrap">
//                 {selectedLocalidades.map((loc) => (
//                   <span
//                     key={loc}
//                     className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"
//                   >
//                     {loc}
//                     <button
//                       onClick={() => toggleLocalidad(loc)}
//                       className="hover:text-red-500"
//                     >
//                       ✕
//                     </button>
//                   </span>
//                 ))}
//               </div>

//               {/* TABLA COMPARATIVA */}
//               <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-left">
//                     <thead>
//                       <tr className="bg-slate-800 text-white">
//                         <th className="p-4">Combustible</th>
//                         {selectedLocalidades.map((loc) => (
//                           <th
//                             key={loc}
//                             className="p-4 border-l border-slate-700"
//                           >
//                             {loc}
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       <FilaComparativa
//                         etiqueta="Nafta Super"
//                         campo="super"
//                         subCampo="nafta"
//                         localidades={selectedLocalidades}
//                         data={data}
//                       />
//                       <FilaComparativa
//                         etiqueta="Nafta Premium"
//                         campo="premium"
//                         subCampo="nafta"
//                         localidades={selectedLocalidades}
//                         data={data}
//                       />
//                       <FilaComparativa
//                         etiqueta="Gasoil Común"
//                         campo="comun"
//                         subCampo="gasoil"
//                         localidades={selectedLocalidades}
//                         data={data}
//                       />
//                       <FilaComparativa
//                         etiqueta="Gasoil Premium"
//                         campo="premium"
//                         subCampo="gasoil"
//                         localidades={selectedLocalidades}
//                         data={data}
//                       />
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               <p className="text-center text-xs text-slate-400 font-medium">
//                 * Los precios mostrados corresponden al promedio de las
//                 estaciones disponibles en cada localidad.
//               </p>
//             </div>
//           ) : (
//             <div className="h-full flex flex-col items-center justify-center bg-slate-100 border-2 border-dashed border-slate-300 rounded-3xl p-10 text-slate-400">
//               <span className="text-5xl mb-4">📊</span>
//               <p className="text-xl font-medium">
//                 Selecciona ciudades a la izquierda para comparar
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </main>
//   );
// }

// // Componente para las filas de la tabla
// function FilaComparativa({ etiqueta, campo, subCampo, localidades, data }) {
//   return (
//     <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
//       <td className="p-4 font-bold text-slate-700 bg-slate-50/50">
//         {etiqueta}
//       </td>
//       {localidades.map((loc) => {
//         // Obtenemos el precio de la primera empresa disponible en esa ciudad para la comparativa rápida
//         const primeraEmpresaKey = Object.keys(data[loc])[0];
//         const precio = data[loc][primeraEmpresaKey][subCampo][campo];

//         return (
//           <td key={loc} className="p-4 border-l border-slate-100">
//             <span className="text-lg font-mono font-bold text-blue-600">
//               {precio ? (
//                 `$${precio}`
//               ) : (
//                 <span className="text-slate-300">---</span>
//               )}
//             </span>
//           </td>
//         );
//       })}
//     </tr>
//   );
// }
