// src/app/combustibles/CombustiblesClient.jsx
"use client";

import { useState, useMemo, useEffect } from "react";

// Estilos de color distintivo por bandera
const BRAND_COLORS = {
  YPF: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Shell:
    "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  Axion:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  Puma: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Gulf: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  Voy: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  Dapsa: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  Otras:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

// Función para determinar el estado según la antigüedad de los datos
function getEstadoFecha(fechaISO) {
  if (!fechaISO) {
    return {
      dotColor: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
      label: "Sin fecha",
    };
  }

  const fechaReg = new Date(fechaISO);
  const ahora = new Date();
  const diffTiempo = Math.abs(ahora - fechaReg);
  const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

  // Menos de 3 meses (~90 días) -> Verde
  if (diffDias <= 90) {
    return {
      dotColor: "bg-emerald-500 animate-pulse",
      textColor: "text-emerald-600 dark:text-emerald-400",
    };
  }

  // Entre 3 meses y 1 año (90 a 365 días) -> Amarillo
  if (diffDias <= 365) {
    return {
      dotColor: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
    };
  }

  // Más de 1 año -> Rojo
  return {
    dotColor: "bg-rose-500",
    textColor: "text-rose-600 dark:text-rose-400",
  };
}

export default function CombustiblesClient({
  registros = [],
  provincias = [],
}) {
  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [bandera, setBandera] = useState("TODAS");
  const [producto, setProducto] = useState("TODOS");
  const [orden, setOrden] = useState("recientes");

  // Estado para Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(50);

  // EFECTO DE CARGA INICIAL: Asigna Provincia y Localidad dinámicamente según los datos reales
  useEffect(() => {
    if (provincias.length > 0 && !provincia) {
      // Buscar la provincia coincidente exacto o similar (ej: "Buenos Aires")
      const provMatch = provincias.find(
        (p) => p.trim().toLowerCase() === "buenos aires",
      );
      if (provMatch) {
        setProvincia(provMatch);
      }
    }
  }, [provincias, provincia]);

  const localidadesDisponibles = useMemo(() => {
    if (!provincia) return [];
    const setLoc = new Set();
    registros.forEach((r) => {
      if (
        r.provincia?.trim().toLowerCase() === provincia.trim().toLowerCase() &&
        r.localidad
      ) {
        setLoc.add(r.localidad);
      }
    });
    return Array.from(setLoc).sort();
  }, [provincia, registros]);

  useEffect(() => {
    if (localidadesDisponibles.length > 0 && !localidad) {
      // Buscar "Mar del Plata" dentro de las localidades computadas
      const locMatch = localidadesDisponibles.find(
        (l) => l.trim().toLowerCase() === "mar del plata",
      );
      if (locMatch) {
        setLocalidad(locMatch);
      }
    }
  }, [localidadesDisponibles, localidad]);

  const registrosFiltrados = useMemo(() => {
    const filtrados = registros.filter((r) => {
      if (
        provincia &&
        r.provincia?.trim().toLowerCase() !== provincia.trim().toLowerCase()
      )
        return false;
      if (
        localidad &&
        r.localidad?.trim().toLowerCase() !== localidad.trim().toLowerCase()
      )
        return false;
      if (bandera !== "TODAS" && r.bandera !== bandera) return false;
      if (producto !== "TODOS" && r.producto !== producto) return false;
      return true;
    });

    return filtrados.sort((a, b) => {
      if (orden === "recientes") {
        return (
          new Date(b.fechaISO || 0).getTime() -
          new Date(a.fechaISO || 0).getTime()
        );
      }
      if (orden === "antiguos") {
        return (
          new Date(a.fechaISO || 0).getTime() -
          new Date(b.fechaISO || 0).getTime()
        );
      }
      if (orden === "precio_asc") {
        return (a.precio || 0) - (b.precio || 0);
      }
      if (orden === "precio_desc") {
        return (b.precio || 0) - (a.precio || 0);
      }
      return 0;
    });
  }, [registros, provincia, localidad, bandera, producto, orden]);

  // Resetear a la página 1 cuando cambia cualquier filtro
  const handleFiltroChange = (setter, valor) => {
    setter(valor);
    setPaginaActual(1);
  };

  // Cálculo de Paginación
  const totalPaginas =
    Math.ceil(registrosFiltrados.length / registrosPorPagina) || 1;
  const indiceInicial = (paginaActual - 1) * registrosPorPagina;
  const registrosPaginados = registrosFiltrados.slice(
    indiceInicial,
    indiceInicial + registrosPorPagina,
  );

  return (
    <div className="space-y-6">
      {/* Barra de Filtros Estilo "Glass" */}
      <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500 mb-1.5">
              Provincia
            </label>
            <select
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={provincia}
              onChange={(e) => {
                handleFiltroChange(setProvincia, e.target.value);
                setLocalidad("");
              }}
            >
              <option value="">Todas las provincias</option>
              {provincias.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500 mb-1.5">
              Localidad
            </label>
            <select
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-40"
              value={localidad}
              disabled={!provincia}
              onChange={(e) => handleFiltroChange(setLocalidad, e.target.value)}
            >
              <option value="">Todas las localidades</option>
              {localidadesDisponibles.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500 mb-1.5">
              Bandera
            </label>
            <select
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={bandera}
              onChange={(e) => handleFiltroChange(setBandera, e.target.value)}
            >
              <option value="TODAS">Todas las banderas</option>
              <option value="YPF">YPF</option>
              <option value="Shell">Shell</option>
              <option value="Axion">Axion</option>
              <option value="Puma">Puma</option>
              <option value="Gulf">Gulf</option>
              <option value="Voy">Voy</option>
              <option value="Dapsa">Dapsa</option>
              <option value="Otras">Otras</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500 mb-1.5">
              Combustible
            </label>
            <select
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={producto}
              onChange={(e) => handleFiltroChange(setProducto, e.target.value)}
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="Súper">Súper</option>
              <option value="Premium">Premium</option>
              <option value="Diésel Común">Diésel Común</option>
              <option value="Diésel Premium">Diésel Premium</option>
              <option value="GNC">GNC</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500 mb-1.5">
              Ordenar
            </label>
            <select
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={orden}
              onChange={(e) => handleFiltroChange(setOrden, e.target.value)}
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leyenda del Semáforo y Contador */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Mostrando{" "}
          <strong>
            {registrosFiltrados.length === 0 ? 0 : indiceInicial + 1}
          </strong>{" "}
          a{" "}
          <strong>
            {Math.min(
              indiceInicial + registrosPorPagina,
              registrosFiltrados.length,
            )}
          </strong>{" "}
          de <strong>{registrosFiltrados.length}</strong> resultados
        </span>

        <div className="flex items-center gap-4 text-[11px] bg-slate-100/60 dark:bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            &lt; 3 meses
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />3 - 12 meses
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            &gt; 1 año
          </span>
        </div>
      </div>

      {/* Tabla Estilizada */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              <tr>
                <th className="py-3 px-4">Estación / Dirección</th>
                <th className="py-3 px-4">Bandera</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Precio</th>
                <th className="py-3 px-4">Actualizado</th>
                <th className="py-3 px-4">Ubicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {registrosPaginados.map((r, idx) => {
                const colorClass =
                  BRAND_COLORS[r.bandera] || BRAND_COLORS.Otras;
                const estado = getEstadoFecha(r.fechaISO);

                return (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900 dark:text-white text-xs">
                        {r.estacion}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5">
                        {r.direccion || "Sin dirección registrada"}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colorClass}`}
                      >
                        {r.bandera}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{r.producto}</td>
                    <td className="py-3.5 px-4 font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                      $
                      {r.precio?.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${estado.textColor}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${estado.dotColor}`}
                        />
                        {r.fecha}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {r.localidad}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {r.provincia}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Control de Paginación */}
        {registrosFiltrados.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>Mostrar</span>
              <select
                className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={registrosPorPagina}
                onChange={(e) => {
                  setRegistrosPorPagina(Number(e.target.value));
                  setPaginaActual(1);
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>por página</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="mr-2">
                Página <strong>{paginaActual}</strong> de{" "}
                <strong>{totalPaginas}</strong>
              </span>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                disabled={paginaActual >= totalPaginas}
                onClick={() =>
                  setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
                }
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
//--------------------------------------------------------------------------

// "use client";

// import { useState, useMemo } from "react";

// export default function CombustiblesClient({ data }) {
//   const [selectedProvincia, setSelectedProvincia] = useState("");
//   const [selectedLocalidades, setSelectedLocalidades] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [soloActualizados, setSoloActualizados] = useState(true);

//   // 1. Extraer provincias únicas de los datos
//   const provincias = useMemo(() => {
//     if (!data) return [];
//     const setP = new Set();
//     Object.values(data).forEach((loc) => {
//       const empresas = Object.values(loc);
//       if (empresas[0]?.provincia) setP.add(empresas[0].provincia);
//     });
//     return Array.from(setP).sort();
//   }, [data]);

//   // 2. Filtrar localidades por provincia
//   const localidadesDeProvincia = useMemo(() => {
//     if (!selectedProvincia) return [];
//     return Object.keys(data)
//       .filter((name) => {
//         const emps = Object.values(data[name]);
//         return emps[0]?.provincia === selectedProvincia;
//       })
//       .sort();
//   }, [data, selectedProvincia]);

//   const localidadesFiltradas = localidadesDeProvincia.filter((l) =>
//     l.toLowerCase().includes(searchTerm.toLowerCase()),
//   );

//   const handleProvinciaChange = (prov) => {
//     setSelectedProvincia(prov);
//     setSearchTerm("");
//     if (!prov) return;

//     const ciudadesDeProv = Object.keys(data).filter((name) => {
//       const emps = Object.values(data[name]);
//       return emps[0]?.provincia === prov;
//     });

//     if (ciudadesDeProv.length === 1) {
//       const nuevaLoc = ciudadesDeProv[0];
//       setSelectedLocalidades((prev) => {
//         if (prev.includes(nuevaLoc)) return prev;
//         if (prev.length < 3) return [...prev, nuevaLoc];
//         return prev;
//       });
//     }
//   };

//   const toggleLocalidad = (loc) => {
//     if (selectedLocalidades.includes(loc)) {
//       setSelectedLocalidades(selectedLocalidades.filter((i) => i !== loc));
//     } else if (selectedLocalidades.length < 3) {
//       setSelectedLocalidades([...selectedLocalidades, loc]);
//     }
//   };

//   if (!data)
//     return (
//       <div className="p-10 text-center uppercase font-black text-slate-400">
//         Cargando base de datos...
//       </div>
//     );

//   return (
//     <div className="max-w-7xl mx-auto p-4  bg-slate-50 dark:bg-black flex flex-col ">
//       {/* HEADER MÁS COMPACTO */}
//       <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4 shrink-0">
//         <div>
//           <h1 className="text-xl font-black text-slate-800 dark:text-slate-300 tracking-tighter">
//             SURTIDORES{" "}
//             <span className="text-blue-600 dark:text-blue-400">ARGENTINA</span>
//           </h1>
//           <p className="text-slate-500 text-[11px] dark:text-slate-200 font-medium">
//             Precios oficiales del Ministerio de Energía
//           </p>
//         </div>

//         <div className="flex flex-wrap gap-1.5">
//           {selectedLocalidades.map((l) => (
//             <span
//               key={l}
//               className="bg-blue-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-2 shadow-sm"
//             >
//               {l}
//               <button
//                 onClick={() => toggleLocalidad(l)}
//                 className="hover:text-red-500"
//               >
//                 ✕
//               </button>
//             </span>
//           ))}
//         </div>
//       </header>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
//         <aside className="space-y-4">
//           <div className="bg-white dark:bg-black p-4 rounded-2xl border border-slate-200 shadow-sm">
//             {/* FILTRO RECENCIA MÁS PEQUEÑO */}
//             <div className="mb-4 pb-4 border-b border-slate-100">
//               <label className="flex items-center cursor-pointer gap-2">
//                 <div className="relative">
//                   <input
//                     type="checkbox"
//                     className="sr-only"
//                     checked={soloActualizados}
//                     onChange={() => setSoloActualizados(!soloActualizados)}
//                   />
//                   <div
//                     className={`block w-8 h-5 rounded-full transition-colors ${soloActualizados ? "bg-blue-500" : "bg-slate-300"}`}
//                   ></div>
//                   <div
//                     className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${soloActualizados ? "translate-x-3" : ""}`}
//                   ></div>
//                 </div>
//                 <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tighter">
//                   Solo precios recientes
//                 </span>
//               </label>
//             </div>

//             <label className="text-[9px] font-bold text-slate-400 dark:text-slate-200 uppercase block mb-1">
//               1. Provincia
//             </label>
//             <select
//               className="w-full p-2 bg-slate-50 border dark:bg-black border-slate-200 rounded-lg mb-4 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
//               value={selectedProvincia}
//               onChange={(e) => handleProvinciaChange(e.target.value)}
//             >
//               <option value="" className="dark:text-slate-300">
//                 Seleccionar...
//               </option>
//               {provincias.map((p) => (
//                 <option key={p} value={p} className="dark:text-slate-300">
//                   {p}
//                 </option>
//               ))}
//             </select>

//             {selectedProvincia && (
//               <div className="animate-in fade-in slide-in-from-top-1 duration-200">
//                 <label className="text-[9px] font-bold text-slate-400 dark:text-slate-200 uppercase block mb-1">
//                   2. Ciudad
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Buscar..."
//                   className="w-full p-2 bg-slate-50 dark:bg-black border border-slate-200 rounded-lg mb-2 text-xs dark:text-slate-200 outline-none focus:border-blue-500 dark:placeholder:text-slate-200"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 text-[11px]">
//                   {localidadesFiltradas.map((l) => (
//                     <button
//                       key={l}
//                       onClick={() => toggleLocalidad(l)}
//                       className={`w-full text-left px-3 py-1.5 rounded-lg transition-all ${selectedLocalidades.includes(l) ? "bg-blue-500 text-white font-bold dark:text-slate-200" : "hover:bg-slate-100 dark:hover:bg-slate-400 text-slate-600 dark:text-slate-200"}`}
//                     >
//                       {l}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </aside>

//         <section className="lg:col-span-3 h-full">
//           {selectedLocalidades.length > 0 ? (
//             <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
//               <Tablas
//                 data={data}
//                 locs={selectedLocalidades}
//                 soloActualizados={soloActualizados}
//               />
//             </div>
//           ) : (
//             /* CONTENEDOR AJUSTADO PARA EVITAR SCROLL EN 1366x768 */
//             <div className="bg-white dark:bg-black border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center h-[calc(100vh-180px)] relative overflow-hidden">
//               {/* Decoración sutil */}
//               <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/40 rounded-full -mr-16 -mt-16 blur-2xl" />

//               <div className="relative z-10 flex flex-col items-center text-center ">
//                 <div className="w-14 h-14 bg-blue-600 dark:bg-blue-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg ">
//                   <span className="text-2xl">⛽</span>
//                 </div>

//                 <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-300 mb-2">
//                   Comparador de{" "}
//                   <span className="text-blue-600 dark:text-blue-400">
//                     Combustibles
//                   </span>
//                 </h2>

//                 <p className="text-slate-500 dark:text-slate-200 text-[13px] mb-6 font-medium leading-tight">
//                   Selecciona provincia y hasta 3 ciudades para comparar precios.
//                 </p>

//                 {/* Pasos compactos */}
//                 <div className="space-y-4 w-full">
//                   {[
//                     { n: 1, t: "Selecciona una Provincia" },
//                     { n: 2, t: "Suma hasta 3 ciudades" },
//                     { n: 3, t: "Visualiza precios en tiempo real" },
//                   ].map((step) => (
//                     <div
//                       key={step.n}
//                       className="flex items-center gap-3 bg-slate-50/80 dark:bg-slate-800  p-3 rounded-xl border border-slate-100"
//                     >
//                       <div className="w-6 h-6 bg-white dark:bg-black rounded-lg flex items-center justify-center text-[12px] font-black shadow-sm dark:shadow-gray-200 text-blue-600 dark:text-blue-400 border border-blue-50">
//                         {step.n}
//                       </div>
//                       <p className="text-[11px] font-bold text-slate-600 dark:text-slate-100 uppercase tracking-tight">
//                         {step.t}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
//         </section>
//       </div>
//     </div>
//   );
// }

// function Tablas({ data, locs, soloActualizados }) {
//   const empresas = Array.from(
//     new Set(locs.flatMap((l) => Object.keys(data[l]))),
//   ).sort();

//   return empresas.map((emp) => (
//     <div
//       key={emp}
//       className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4"
//     >
//       <div className="bg-slate-900 dark:bg-gray-400 px-4 py-2 text-white dark:text-white">
//         <h3 className="text-[10px] font-black tracking-widest uppercase">
//           {emp}
//         </h3>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse">
//           <thead>
//             <tr className="bg-slate-50 dark:bg-gray-700 text-[9px] font-black text-slate-400 dark:text-slate-200 uppercase border-b border-slate-100">
//               <th className="p-3 text-left pl-6">Producto</th>
//               {locs.map((l) => (
//                 <th
//                   key={l}
//                   className="p-3 border-l border-slate-100 text-center"
//                 >
//                   {l}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {["Nafta Súper", "Nafta Premium", "Gasoil G2", "Gasoil G3"].map(
//               (label, idx) => {
//                 const paths = [
//                   ["nafta", "super"],
//                   ["nafta", "premium"],
//                   ["gasoil", "comun"],
//                   ["gasoil", "premium"],
//                 ];
//                 return (
//                   <Fila
//                     key={label}
//                     data={data}
//                     locs={locs}
//                     emp={emp}
//                     label={label}
//                     path={paths[idx]}
//                     soloActualizados={soloActualizados}
//                   />
//                 );
//               },
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   ));
// }

// function Fila({ data, locs, emp, label, path, soloActualizados }) {
//   const LIMITE_DIAS = 60;
//   const getRecencia = (fecha) => {
//     if (!fecha) return { dias: 999, esViejo: true };
//     const dias = Math.floor(
//       (new Date() - new Date(fecha)) / (1000 * 60 * 60 * 24),
//     );
//     return { dias, esViejo: dias > LIMITE_DIAS };
//   };

//   return (
//     <tr className="hover:bg-blue-50/30 transition-colors">
//       <td className="p-3 text-xs font-bold text-slate-700 dark:text-slate-100 dark:bg-black pl-6">
//         {label}
//       </td>
//       {locs.map((l) => {
//         const item = data[l][emp];
//         const precio = item?.[path[0]]?.[path[1]];
//         const { dias, esViejo } = getRecencia(item?.fechaActualizacion);

//         if (soloActualizados && esViejo && precio) {
//           return (
//             <td
//               key={l}
//               className="p-3 border-l border-slate-100 text-center dark:text-slate-100 dark:bg-black"
//             >
//               <span className="text-[9px] font-bold text-slate-300 italic uppercase">
//                 Sin datos
//               </span>
//             </td>
//           );
//         }

//         return (
//           <td
//             key={l}
//             className="p-3 border-l border-slate-100 text-center dark:text-slate-100 dark:bg-black"
//           >
//             {precio ? (
//               <div className="flex flex-col items-center">
//                 <span
//                   className={`text-base font-black tracking-tight ${esViejo ? "text-slate-300" : "text-blue-700 dark:text-blue-400"}`}
//                 >
//                   ${precio}
//                 </span>
//                 {esViejo ? (
//                   <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-black uppercase">
//                     Hace {dias}d
//                   </span>
//                 ) : (
//                   <span className="text-[9px] text-slate-400 dark:text-slate-100 font-medium">
//                     {item.fechaActualizacion}
//                   </span>
//                 )}
//               </div>
//             ) : (
//               <span className="text-slate-200">---</span>
//             )}
//           </td>
//         );
//       })}
//     </tr>
//   );
// }
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
