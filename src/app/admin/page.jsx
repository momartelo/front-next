"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

/* =========================
   UTILIDADES
========================= */

function getDiff(original, edited) {
  if (!original || !edited) return {};
  const diff = {};

  Object.keys(edited).forEach((empresa) => {
    const origEmpresa = original[empresa] || {};
    const editedEmpresa = edited[empresa];
    const empresaDiff = { from: {}, to: {} };
    let hasChanges = false;

    ["nafta", "gasoil"].forEach((tipo) => {
      if (!editedEmpresa[tipo]) return;

      Object.keys(editedEmpresa[tipo]).forEach((producto) => {
        const orig = origEmpresa[tipo]?.[producto] || {
          precio: null,
          fecha: null,
        };

        const edit = editedEmpresa[tipo][producto] || {
          precio: null,
          fecha: null,
        };

        const precioChanged = Number(orig.precio) !== Number(edit.precio);
        const fechaChanged = orig.fecha !== edit.fecha;

        if (precioChanged || fechaChanged) {
          hasChanges = true;

          if (!empresaDiff.from[tipo]) empresaDiff.from[tipo] = {};
          if (!empresaDiff.to[tipo]) empresaDiff.to[tipo] = {};

          empresaDiff.from[tipo][producto] = orig;
          empresaDiff.to[tipo][producto] = edit;
        }
      });
    });

    if (hasChanges) diff[empresa] = empresaDiff;
  });

  return diff;
}

function validateStructure(data) {
  if (typeof data !== "object" || data === null) return false;

  return Object.values(data).every((empresa) => {
    if (typeof empresa !== "object") return false;

    return ["nafta", "gasoil"].every((tipo) => {
      if (!empresa[tipo]) return true;

      return Object.values(empresa[tipo]).every((producto) => {
        return (
          typeof producto === "object" &&
          "precio" in producto &&
          "fecha" in producto
        );
      });
    });
  });
}

/* =========================
   COMPONENTE
========================= */

export default function AdminPage() {
  const [json, setJson] = useState("");
  const [debouncedJson, setDebouncedJson] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [modalStatus, setModalStatus] = useState("");
  const [originalData, setOriginalData] = useState({});

  /* =========================
     CARGA INICIAL
  ========================= */

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/admin/combustibles`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        setOriginalData(data);
        setJson(JSON.stringify(data, null, 2));
        setDebouncedJson(JSON.stringify(data, null, 2));

        showStatus("✅ Datos sincronizados");
      } catch {
        showStatus("❌ Error al conectar con la API");
      }
    }

    loadData();
  }, []);

  /* =========================
     DEBOUNCE
  ========================= */

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedJson(json);
    }, 300);

    return () => clearTimeout(timeout);
  }, [json]);

  /* =========================
     PARSEO
  ========================= */

  const parsedJson = useMemo(() => {
    try {
      return JSON.parse(debouncedJson);
    } catch {
      return null;
    }
  }, [debouncedJson]);

  const isStructurallyValid = useMemo(() => {
    if (!parsedJson) return false;
    return validateStructure(parsedJson);
  }, [parsedJson]);

  /* =========================
     DIFF
  ========================= */

  const diff = useMemo(() => {
    if (!parsedJson) return {};
    return getDiff(originalData, parsedJson);
  }, [parsedJson, originalData]);

  const totalChanges = useMemo(() => {
    let count = 0;
    Object.values(diff).forEach((empresa) => {
      Object.values(empresa.to).forEach((tipo) => {
        count += Object.keys(tipo).length;
      });
    });
    return count;
  }, [diff]);

  /* =========================
     HELPERS
  ========================= */

  const showStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 6000);
  };

  const handleFormat = () => {
    if (parsedJson) {
      setJson(JSON.stringify(parsedJson, null, 2));
    }
  };

  const handleSave = useCallback(() => {
    if (!parsedJson) return alert("El JSON tiene errores de sintaxis.");
    if (!isStructurallyValid)
      return alert("La estructura del JSON es incorrecta.");
    setModalOpen(true);
    setModalStatus("");
  }, [parsedJson, isStructurallyValid]);

  /* =========================
     CTRL + S
  ========================= */

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  /* =========================
     GUARDADO
  ========================= */

  async function confirmSave() {
    if (!passwordInput) return setModalStatus("Escribe la contraseña");

    setModalStatus("Enviando...");

    try {
      const res = await fetch("/api/admin/combustibles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput, data: parsedJson }),
      });

      if (res.ok) {
        setModalStatus("✅ ¡Guardado!");
        setOriginalData(parsedJson);
        setJson(JSON.stringify(parsedJson, null, 2));

        showStatus("✅ Cambios aplicados con éxito");

        setTimeout(() => {
          setModalOpen(false);
          setPasswordInput("");
        }, 1000);
      } else {
        setModalStatus("❌ Password incorrecta");
      }
    } catch {
      setModalStatus("❌ Error de red");
    }
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="flex flex-col max-w-6xl mx-auto p-4 md:p-8 space-y-6 bg-white min-h-[calc(100vh-70px)]">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Panel de Overrides
          </h1>
          <p className="text-sm text-gray-500">
            Modifica los precios manualmente
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleFormat}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition"
          >
            {"{ }"} Formatear
          </button>

          <button
            onClick={handleSave}
            disabled={!parsedJson || !isStructurallyValid}
            className={`px-6 py-2 rounded font-bold text-white shadow-md transition ${
              parsedJson && isStructurallyValid
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Guardar
          </button>
        </div>
      </header>

      {totalChanges > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-3 py-2 rounded">
          Hay {totalChanges} modificaciones sin guardar
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* EDITOR */}
        <div className="lg:col-span-2 space-y-2 flex flex-col min-h-0">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
              Editor JSON
            </span>

            {!parsedJson ? (
              <span className="text-xs text-red-500 font-bold animate-pulse">
                JSON INVÁLIDO
              </span>
            ) : !isStructurallyValid ? (
              <span className="text-xs text-orange-500 font-bold">
                ESTRUCTURA INCORRECTA
              </span>
            ) : null}
          </div>

          <div
            className={`flex-1 border-2 rounded-lg overflow-hidden min-h-0 ${
              parsedJson
                ? "border-gray-200 focus-within:border-indigo-400"
                : "border-red-400"
            }`}
          >
            <textarea
              className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50 text-gray-800"
              value={json}
              onChange={(e) => setJson(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        {/* PANEL DE CAMBIOS */}
        <aside className="bg-gray-50 rounded-lg border p-4 flex flex-col min-h-0">
          <h2 className="text-sm font-bold text-gray-700 mb-4 border-b pb-2">
            CAMBIOS DETECTADOS ({totalChanges})
          </h2>

          <div className="flex-1 overflow-y-auto pr-2">
            {Object.keys(diff).length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 italic text-sm text-center">
                No se detectan diferencias
              </div>
            ) : (
              Object.entries(diff).map(([empresa, cambio]) => (
                <div
                  key={empresa}
                  className="bg-white p-3 rounded shadow-sm border-l-4 border-indigo-500 mb-4"
                >
                  <p className="font-bold text-indigo-900 text-xs mb-2 uppercase">
                    {empresa}
                  </p>

                  {Object.entries(cambio.from).map(([tipo, productos]) => (
                    <div key={tipo} className="mb-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                        {tipo}
                      </p>

                      {Object.entries(productos).map(([prod, info]) => (
                        <div key={prod} className="text-[11px] mb-2">
                          <span className="font-bold text-gray-700">
                            {prod}
                          </span>

                          <div className="text-red-500 line-through">
                            {info.precio} ({info.fecha})
                          </div>

                          <div className="text-green-600 font-bold">
                            {cambio.to[tipo][prod].precio} (
                            {cambio.to[tipo][prod].fecha})
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            onKeyDown={(e) => e.key === "Enter" && confirmSave()}
          >
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Confirmar Cambios
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Se aplicarán {Object.keys(diff).length} cambios de empresa
                </p>
              </div>

              <input
                type="password"
                placeholder="Contraseña de administrador"
                className="w-full border-2 rounded-lg px-4 py-3 focus:border-indigo-500 outline-none transition"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />

              {modalStatus && (
                <div
                  className={`p-2 rounded text-center text-xs font-bold ${
                    modalStatus.includes("❌")
                      ? "text-red-600 bg-red-50"
                      : "text-indigo-600 bg-indigo-50"
                  }`}
                >
                  {modalStatus}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-gray-500 hover:bg-gray-100 transition"
                  onClick={() => {
                    setModalOpen(false);
                    setPasswordInput("");
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition"
                  onClick={confirmSave}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// -------------------------------------------------------------------------

// "use client";

// import { useState, useEffect, useMemo, useCallback } from "react";

// // --- UTILIDADES ---
// function getDiff(original, edited) {
//   if (!original || !edited) return {};
//   const diff = {};

//   Object.keys(edited).forEach((empresa) => {
//     const origEmpresa = original[empresa] || {};
//     const editedEmpresa = edited[empresa];
//     const empresaDiff = { from: {}, to: {} };
//     let hasChanges = false;

//     ["nafta", "gasoil"].forEach((tipo) => {
//       if (!editedEmpresa[tipo]) return;

//       Object.keys(editedEmpresa[tipo]).forEach((producto) => {
//         const orig = origEmpresa[tipo]?.[producto] || {
//           precio: null,
//           fecha: null,
//         };
//         const edit = editedEmpresa[tipo][producto] || {
//           precio: null,
//           fecha: null,
//         };

//         const precioChanged = Number(orig.precio) !== Number(edit.precio);
//         const fechaChanged = orig.fecha !== edit.fecha;

//         if (precioChanged || fechaChanged) {
//           hasChanges = true;

//           if (!empresaDiff.from[tipo]) empresaDiff.from[tipo] = {};
//           if (!empresaDiff.to[tipo]) empresaDiff.to[tipo] = {};

//           empresaDiff.from[tipo][producto] = orig;
//           empresaDiff.to[tipo][producto] = edit;
//         }
//       });
//     });

//     if (hasChanges) diff[empresa] = empresaDiff;
//   });

//   return diff;
// }

// export default function AdminPage() {
//   const [json, setJson] = useState("");
//   const [status, setStatus] = useState("");
//   const [modalOpen, setModalOpen] = useState(false);
//   const [passwordInput, setPasswordInput] = useState("");
//   const [modalStatus, setModalStatus] = useState("");
//   const [originalData, setOriginalData] = useState({});
//   const [isValidJson, setIsValidJson] = useState(true);

//   // 1️⃣ Carga inicial
//   useEffect(() => {
//     async function loadData() {
//       try {
//         const res = await fetch(`/api/admin/combustibles`);
//         if (!res.ok) throw new Error();
//         const data = await res.json();
//         setOriginalData(data);
//         setJson(JSON.stringify(data, null, 2));
//         showStatus("✅ Datos sincronizados");
//       } catch {
//         showStatus("❌ Error al conectar con la API");
//       }
//     }
//     loadData();
//   }, []);

//   // 2️⃣ Parse seguro sin efectos secundarios
//   const parsedJson = useMemo(() => {
//     try {
//       return JSON.parse(json);
//     } catch {
//       return null;
//     }
//   }, [json]);

//   useEffect(() => {
//     setIsValidJson(!!parsedJson);
//   }, [parsedJson]);

//   // 3️⃣ Diff memoizado limpio
//   const diff = useMemo(() => {
//     if (!parsedJson) return {};
//     return getDiff(originalData, parsedJson);
//   }, [parsedJson, originalData]);

//   // 4️⃣ Conteo real de modificaciones
//   const totalChanges = useMemo(() => {
//     let count = 0;
//     Object.values(diff).forEach((empresa) => {
//       Object.values(empresa.to).forEach((tipo) => {
//         count += Object.keys(tipo).length;
//       });
//     });
//     return count;
//   }, [diff]);

//   // 5️⃣ Status helper
//   const showStatus = (msg) => {
//     setStatus(msg);
//     setTimeout(() => setStatus(""), 8000);
//   };

//   const handleFormat = () => {
//     if (parsedJson) {
//       setJson(JSON.stringify(parsedJson, null, 2));
//     }
//   };

//   const handleSave = useCallback(() => {
//     if (!parsedJson) return alert("El JSON tiene errores de sintaxis.");
//     setModalOpen(true);
//     setModalStatus("");
//   }, [parsedJson]);

//   // Ctrl + S
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if ((e.ctrlKey || e.metaKey) && e.key === "s") {
//         e.preventDefault();
//         handleSave();
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [handleSave]);

//   async function confirmSave() {
//     if (!passwordInput) return setModalStatus("Escribe la contraseña");

//     setModalStatus("Enviando...");

//     try {
//       const res = await fetch("/api/admin/combustibles", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           password: passwordInput,
//           data: parsedJson,
//         }),
//       });

//       if (res.ok) {
//         setModalStatus("✅ ¡Guardado!");
//         setOriginalData(parsedJson);
//         setJson(JSON.stringify(parsedJson, null, 2));
//         showStatus("✅ Cambios aplicados con éxito");

//         setTimeout(() => {
//           setModalOpen(false);
//           setPasswordInput("");
//         }, 1000);
//       } else {
//         setModalStatus("❌ Password incorrecta");
//       }
//     } catch {
//       setModalStatus("❌ Error de red");
//     }
//   }

//   return (
//     <div className="flex flex-col max-w-6xl mx-auto p-4 md:p-8 space-y-6 bg-white min-h-[calc(100vh-70px)]">
//       <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-800">
//             Panel de Overrides
//           </h1>
//           <p className="text-sm text-gray-500">
//             Modifica los precios manualmente
//           </p>
//         </div>
//         <div className="flex gap-2">
//           <button
//             onClick={handleFormat}
//             className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition"
//           >
//             {"{ }"} Formatear
//           </button>
//           <button
//             onClick={handleSave}
//             disabled={!parsedJson}
//             className={`px-6 py-2 rounded font-bold text-white shadow-md transition ${
//               parsedJson
//                 ? "bg-indigo-600 hover:bg-indigo-700"
//                 : "bg-gray-300 cursor-not-allowed"
//             }`}
//           >
//             Guardar
//           </button>
//         </div>
//       </header>

//       <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
//         <div className="lg:col-span-2 space-y-2 flex flex-col min-h-0">
//           <div className="flex justify-between items-center">
//             <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
//               Editor JSON
//             </span>
//             {!parsedJson && (
//               <span className="text-xs text-red-500 font-bold animate-pulse">
//                 JSON INVÁLIDO
//               </span>
//             )}
//           </div>

//           <div
//             className={`flex-1 relative border-2 rounded-lg overflow-hidden min-h-0 ${
//               parsedJson
//                 ? "border-gray-200 focus-within:border-indigo-400"
//                 : "border-red-400"
//             }`}
//           >
//             <textarea
//               className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50 text-gray-800"
//               value={json}
//               onChange={(e) => setJson(e.target.value)}
//               spellCheck={false}
//             />
//           </div>
//         </div>
//         <aside className="bg-gray-50 rounded-lg border p-4 flex flex-col min-h-0">
//           <h2 className="text-sm font-bold text-gray-700 mb-4 border-b pb-2">
//             CAMBIOS DETECTADOS ({totalChanges})
//           </h2>

//           <div className="flex-1 overflow-y-auto pr-2">
//             {Object.keys(diff).length === 0 ? (
//               <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 italic text-sm text-center">
//                 <p>No se detectan diferencias</p>
//                 <p className="text-xs mt-1">(Modifica un precio o fecha)</p>
//               </div>
//             ) : (
//               Object.entries(diff).map(([empresa, cambio]) => (
//                 <div
//                   key={empresa}
//                   className="bg-white p-3 rounded shadow-sm border-l-4 border-indigo-500 mb-4"
//                 >
//                   <p className="font-bold text-indigo-900 text-xs mb-2 uppercase">
//                     {empresa}
//                   </p>

//                   {Object.entries(cambio.from).map(([tipo, productos]) => (
//                     <div key={tipo} className="mb-3 last:mb-0">
//                       <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
//                         {tipo}
//                       </p>

//                       {Object.entries(productos).map(([prod, info]) => (
//                         <div
//                           key={prod}
//                           className="text-[11px] space-y-1 mb-2 border-b border-gray-50 pb-1 last:border-0"
//                         >
//                           <span className="font-bold text-gray-700">
//                             {prod}
//                           </span>

//                           <div className="flex items-center gap-1 text-red-500 line-through decoration-red-300">
//                             {info.precio}
//                             <span className="text-[9px]">({info.fecha})</span>
//                           </div>

//                           <div className="flex items-center gap-1 text-green-600 font-bold">
//                             {cambio.to[tipo][prod].precio}
//                             <span className="text-[9px]">
//                               ({cambio.to[tipo][prod].fecha})
//                             </span>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   ))}
//                 </div>
//               ))
//             )}
//           </div>
//         </aside>
//       </main>
//     </div>
//   );
// }

//---------------------------------------------------------

// "use client";

// import { useState, useEffect, useRef } from "react";

// // Componente reutilizable para mensajes de status con fade
// function StatusMessage({ msg }) {
//   return (
//     <div className="min-w-45 h-10 flex items-center justify-center overflow-hidden">
//       <div
//         className={`p-2 rounded font-medium text-sm transition-opacity duration-500 ease-in-out
//           ${msg ? "opacity-100" : "opacity-0"}
//           ${
//             msg?.includes("❌")
//               ? "bg-red-100 text-red-700"
//               : msg?.includes("✅")
//                 ? "bg-green-100 text-green-700"
//                 : "bg-gray-100 text-gray-700"
//           }`}
//       >
//         {msg}
//       </div>
//     </div>
//   );
// }

// export default function AdminPage() {
//   const [json, setJson] = useState("");
//   const [status, setStatus] = useState("");
//   const [modalOpen, setModalOpen] = useState(false);
//   const [passwordInput, setPasswordInput] = useState("");
//   const [modalStatus, setModalStatus] = useState("");
//   const passwordRef = useRef(null);

//   useEffect(() => {
//     async function loadData() {
//       try {
//         const res = await fetch(`/api/admin/combustibles`);
//         if (!res.ok) throw new Error("Error cargando datos");

//         const data = await res.json();
//         setJson(JSON.stringify(data, null, 2));
//         showStatus("✅ Datos cargados");
//       } catch {
//         showStatus("❌ Error cargando datos");
//       }
//     }
//     loadData();
//   }, []);

//   function showStatus(msg) {
//     setStatus(msg);
//     setTimeout(() => setStatus(""), 10000);
//   }

//   function handleSave() {
//     setModalOpen(true);
//     setModalStatus("");
//     setTimeout(() => passwordRef.current?.focus(), 100);
//   }

//   async function confirmSave() {
//     setModalStatus("Guardando...");
//     try {
//       const parsed = JSON.parse(json);
//       const res = await fetch("/api/admin/combustibles", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ password: passwordInput, data: parsed }),
//       });

//       if (res.ok) {
//         setModalStatus("✅ Guardado correctamente");
//         showStatus("✅ Guardado correctamente");
//         setTimeout(() => {
//           setModalOpen(false);
//           setPasswordInput("");
//         }, 1200);
//       } else {
//         setModalStatus("❌ Password incorrecta");
//         passwordRef.current?.focus();
//       }
//     } catch {
//       setModalStatus("❌ JSON inválido");
//       passwordRef.current?.focus();
//     }
//   }

//   return (
//     <div className="max-w-3xl mx-auto p-6 space-y-6">
//       <h1 className="text-3xl font-semibold text-center mb-4">
//         Administrador Manual de Combustibles
//       </h1>

//       {/* JSON editable */}
//       <div className="border rounded shadow p-3 h-96 bg-gray-50">
//         <textarea
//           className="w-full h-full text-sm resize-none focus:outline-none bg-gray-50 overflow-auto"
//           value={json}
//           onChange={(e) => setJson(e.target.value)}
//           spellCheck={false}
//           autoCorrect="off"
//           autoCapitalize="off"
//           autoComplete="off"
//         />
//       </div>

//       {/* Botón guardar con status */}
//       <div className="flex items-center justify-between space-x-4">
//         <StatusMessage msg={status} />
//         <button
//           onClick={handleSave}
//           className="px-6 py-2 rounded-lg bg-linear-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-md hover:from-blue-600 hover:to-blue-800 transition-all duration-300"
//         >
//           Guardar
//         </button>
//       </div>

//       {/* Modal de password */}
//       {modalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-300">
//           <div className="bg-white p-6 rounded-2xl shadow-2xl w-80 space-y-4 transform transition-transform duration-300 scale-100">
//             <h2 className="text-lg font-semibold text-center">
//               Ingrese contraseña para guardar
//             </h2>
//             <input
//               type="password"
//               ref={passwordRef}
//               className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
//               value={passwordInput}
//               onChange={(e) => setPasswordInput(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && confirmSave()}
//             />
//             <StatusMessage msg={modalStatus} />
//             <div className="flex justify-end space-x-2">
//               <button
//                 className="px-4 py-2 rounded border hover:bg-gray-100 transition"
//                 onClick={() => {
//                   setModalOpen(false);
//                   setPasswordInput("");
//                 }}
//               >
//                 Cancelar
//               </button>
//               <button
//                 className="px-4 py-2 rounded-lg bg-linear-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-md hover:from-blue-600 hover:to-blue-800 transition-all duration-300"
//                 onClick={confirmSave}
//               >
//                 Guardar
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
