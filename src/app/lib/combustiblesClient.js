"use client";

import { useState, useMemo } from "react";

export default function CombustiblesClient({ data }) {
  const [selectedProvincia, setSelectedProvincia] = useState("");
  const [selectedLocalidades, setSelectedLocalidades] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [soloActualizados, setSoloActualizados] = useState(true);

  // 1. Extraer provincias únicas de los datos
  const provincias = useMemo(() => {
    if (!data) return [];
    const setP = new Set();
    Object.values(data).forEach((loc) => {
      const empresas = Object.values(loc);
      if (empresas[0]?.provincia) setP.add(empresas[0].provincia);
    });
    return Array.from(setP).sort();
  }, [data]);

  // 2. Filtrar localidades por provincia
  const localidadesDeProvincia = useMemo(() => {
    if (!selectedProvincia) return [];
    return Object.keys(data)
      .filter((name) => {
        const emps = Object.values(data[name]);
        return emps[0]?.provincia === selectedProvincia;
      })
      .sort();
  }, [data, selectedProvincia]);

  const localidadesFiltradas = localidadesDeProvincia.filter((l) =>
    l.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Lógica de cambio de provincia (Arregla el bug de CABA y persistencia)
  const handleProvinciaChange = (prov) => {
    setSelectedProvincia(prov);
    setSearchTerm("");

    if (!prov) return;

    // Buscamos si la provincia elegida tiene una sola ciudad (Caso CABA)
    const ciudadesDeProv = Object.keys(data).filter((name) => {
      const emps = Object.values(data[name]);
      return emps[0]?.provincia === prov;
    });

    // Si es provincia de una sola ciudad (como CABA), la agregamos automáticamente
    if (ciudadesDeProv.length === 1) {
      const nuevaLoc = ciudadesDeProv[0];
      setSelectedLocalidades((prev) => {
        if (prev.includes(nuevaLoc)) return prev; // Ya está seleccionada
        if (prev.length < 3) return [...prev, nuevaLoc]; // Agregamos si hay cupo
        return prev;
      });
    }
  };

  const toggleLocalidad = (loc) => {
    if (selectedLocalidades.includes(loc)) {
      setSelectedLocalidades(selectedLocalidades.filter((i) => i !== loc));
    } else if (selectedLocalidades.length < 3) {
      setSelectedLocalidades([...selectedLocalidades, loc]);
    }
  };

  if (!data)
    return (
      <div className="p-20 text-center uppercase font-black">
        Cargando base de datos...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen bg-slate-50">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            SURTIDORES <span className="text-blue-600">ARGENTINA</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Precios oficiales del Ministerio de Energía
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedLocalidades.map((l) => (
            <span
              key={l}
              className="bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              {l}{" "}
              <button
                onClick={() => toggleLocalidad(l)}
                className="hover:text-red-400"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-4">
          <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm sticky top-6">
            <div className="mb-6 pb-6 border-b border-slate-100">
              <label className="flex items-center cursor-pointer gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={soloActualizados}
                    onChange={() => setSoloActualizados(!soloActualizados)}
                  />
                  <div
                    className={`block w-10 h-6 rounded-full transition-colors ${soloActualizados ? "bg-blue-600" : "bg-slate-300"}`}
                  ></div>
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${soloActualizados ? "translate-x-4" : ""}`}
                  ></div>
                </div>
                <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">
                  Solo precios recientes
                </span>
              </label>
              <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                Oculta surtidores que no actualizaron en los últimos 60 días.
              </p>
            </div>

            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">
              1. Provincia
            </label>
            <select
              className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mb-6 font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
              value={selectedProvincia}
              onChange={(e) => handleProvinciaChange(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {provincias.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {selectedProvincia && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">
                  2. Ciudad
                </label>
                <input
                  type="text"
                  placeholder="Escribe para buscar..."
                  className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl mb-4 text-sm outline-none focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="max-h-60 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {localidadesFiltradas.map((l) => (
                    <button
                      key={l}
                      onClick={() => toggleLocalidad(l)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-xs transition-all ${selectedLocalidades.includes(l) ? "bg-blue-600 text-white font-bold shadow-md" : "hover:bg-slate-100 text-slate-600"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-3">
          {selectedLocalidades.length > 0 ? (
            <Tablas
              data={data}
              locs={selectedLocalidades}
              soloActualizados={soloActualizados}
            />
          ) : (
            <div className="relative overflow-hidden bg-white border border-slate-200 rounded-[48px] p-8 md:p-16 shadow-sm">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full opacity-50"></div>
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-slate-50 rounded-full opacity-80"></div>

              <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 rotate-3 mb-8">
                  <span className="text-4xl text-white">⛽</span>
                </div>

                <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-4">
                  Comparador de{" "}
                  <span className="text-blue-600">Combustibles</span>
                </h2>

                <p className="text-slate-500 font-medium leading-relaxed mb-10">
                  Analiza y compara los precios actualizados de estaciones de
                  servicio en todo el país. Selecciona una provincia para
                  comenzar.
                </p>

                <div className="grid grid-cols-1 gap-4 w-full">
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-black shadow-sm text-blue-600">
                      1
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                      Elige una Provincia en el panel lateral
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-black shadow-sm text-blue-600">
                      2
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                      Suma hasta 3 ciudades para comparar
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-black shadow-sm text-blue-600">
                      3
                    </div>
                    <p className="text-sm font-bold text-slate-600">
                      Activa el filtro de recencia para mayor precisión
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Tablas({ data, locs, soloActualizados }) {
  const empresas = Array.from(
    new Set(locs.flatMap((l) => Object.keys(data[l]))),
  ).sort();

  return empresas.map((emp) => (
    <div
      key={emp}
      className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden mb-8"
    >
      <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
        <h3 className="text-sm font-black tracking-widest uppercase">{emp}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="p-5 text-left pl-8">Producto</th>
              {locs.map((l) => (
                <th
                  key={l}
                  className="p-5 border-l border-slate-100 text-center"
                >
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <Fila
              data={data}
              locs={locs}
              emp={emp}
              label="Nafta Súper"
              path={["nafta", "super"]}
              soloActualizados={soloActualizados}
            />
            <Fila
              data={data}
              locs={locs}
              emp={emp}
              label="Nafta Premium"
              path={["nafta", "premium"]}
              soloActualizados={soloActualizados}
            />
            <Fila
              data={data}
              locs={locs}
              emp={emp}
              label="Gasoil G2"
              path={["gasoil", "comun"]}
              soloActualizados={soloActualizados}
            />
            <Fila
              data={data}
              locs={locs}
              emp={emp}
              label="Gasoil G3"
              path={["gasoil", "premium"]}
              soloActualizados={soloActualizados}
            />
          </tbody>
        </table>
      </div>
    </div>
  ));
}

function Fila({ data, locs, emp, label, path, soloActualizados }) {
  const LIMITE_DIAS = 60;

  const getRecencia = (fecha) => {
    if (!fecha) return { dias: 999, esViejo: true };
    const dias = Math.floor(
      (new Date() - new Date(fecha)) / (1000 * 60 * 60 * 24),
    );
    return { dias, esViejo: dias > LIMITE_DIAS };
  };

  return (
    <tr className="hover:bg-blue-50/30 transition-colors">
      <td className="p-5 text-sm font-bold text-slate-700 pl-8">{label}</td>
      {locs.map((l) => {
        const item = data[l][emp];
        const precio = item?.[path[0]]?.[path[1]];
        const { dias, esViejo } = getRecencia(item?.fechaActualizacion);

        if (soloActualizados && esViejo && precio) {
          return (
            <td key={l} className="p-5 border-l border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-300 italic uppercase">
                Sin datos recientes
              </span>
            </td>
          );
        }

        return (
          <td key={l} className="p-5 border-l border-slate-100 text-center">
            {precio ? (
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={`text-xl font-black tracking-tight ${esViejo ? "text-slate-300" : "text-blue-700"}`}
                >
                  ${precio}
                </span>
                {esViejo ? (
                  <span className="text-[8px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-black uppercase">
                    Hace {dias} días
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 font-medium">
                    Actualizado: {item.fechaActualizacion}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-200">---</span>
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
