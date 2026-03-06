"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Editor from "@monaco-editor/react";

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
  const [isDark, setIsDark] = useState(false);

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

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();

    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedJson(json), 300);
    return () => clearTimeout(timeout);
  }, [json]);

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

  const showStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 6000);
  };

  /* =========================
   FORMATEAR JSON
========================= */
  const handleFormat = () => {
    if (parsedJson) {
      // Reescribe el estado `json` formateado
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

  return (
    <div className="flex flex-col max-w-7xl mx-auto p-4 md:p-8 space-y-6 min-h-[calc(100vh-70px)] ">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6 border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Panel de Overrides
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Modifica los precios manualmente
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleFormat}
            className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-white border cursor-pointer border-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition"
          >
            {"{ }"} Formatear
          </button>

          <button
            onClick={handleSave}
            disabled={!parsedJson || !isStructurallyValid}
            className={`px-6 py-2 rounded text-sm dark:text-white font-medium transition cursor-pointer ${
              parsedJson && isStructurallyValid
                ? "text-indigo-600 border border-indigo-600 hover:bg-indigo-600 hover:text-white"
                : "text-gray-400 border border-gray-300 cursor-not-allowed bg-transparent"
            }`}
          >
            Guardar
          </button>
        </div>
      </header>

      {totalChanges > 0 && (
        <div className="absolute top-40 left-0 right-0 mx-auto max-w-7xl bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 text-xs px-3 py-2 rounded shadow z-40 text-center">
          Hay {totalChanges} modificaciones sin guardar
        </div>
      )}

      {/* CONTENEDOR TIPO VSCode */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col min-h-0 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-500">
          {/* Editor */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-mono uppercase tracking-widest text-gray-400 dark:text-gray-500">
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
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={json}
              onChange={(value) => setJson(value)}
              theme={isDark ? "vs-dark" : "vs"}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        </div>

        {/* Panel de cambios tipo VSCode */}
        <aside className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-500 p-4 flex flex-col min-h-0 shadow-lg">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 border-b dark:border-gray-600 pb-2">
            CAMBIOS DETECTADOS ({totalChanges})
          </h2>

          <div className="flex-1 overflow-y-auto pr-2">
            {Object.keys(diff).length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 italic text-sm text-center">
                No se detectan diferencias
              </div>
            ) : (
              Object.entries(diff).map(([empresa, cambio]) => (
                <div
                  key={empresa}
                  className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700 mb-3"
                >
                  <p className="font-bold text-indigo-900 dark:text-indigo-300 text-xs mb-1 uppercase">
                    {empresa}
                  </p>
                  {Object.entries(cambio.from).map(([tipo, productos]) => (
                    <div key={tipo} className="mb-1">
                      <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase ml-1">
                        ⛽ {tipo}
                      </p>
                      {Object.entries(productos).map(([prod, info]) => {
                        const nuevo = cambio.to[tipo][prod];
                        const delta =
                          Number(nuevo.precio) - Number(info.precio);

                        return (
                          <div key={prod} className="text-[11px] mb-2">
                            <span className="font-semibold text-gray-700 dark:text-gray-200 ml-4">
                              ▹ {prod}
                            </span>

                            <div className="ml-6 text-xs space-y-1">
                              {Number(info.precio) !== Number(nuevo.precio) && (
                                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                                  <span className="text-gray-400 w-12">
                                    precio
                                  </span>

                                  <span className="text-red-500 line-through">
                                    {info.precio}
                                  </span>

                                  <span className="text-gray-400">→</span>

                                  <span className="text-green-600 font-bold">
                                    {nuevo.precio}
                                  </span>

                                  <span className="text-green-600 text-[10px] font-bold">
                                    ({delta > 0 ? `+${delta}` : delta})
                                  </span>
                                </div>
                              )}

                              {info.fecha !== nuevo.fecha && (
                                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                  <span className="text-gray-400 w-12">
                                    fecha
                                  </span>

                                  <span className="text-red-500 line-through">
                                    {info.fecha}
                                  </span>

                                  <span className="text-gray-400">→</span>

                                  <span className="text-green-600 font-bold">
                                    {nuevo.fecha}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </aside>
      </main>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            onKeyDown={(e) => e.key === "Enter" && confirmSave()}
          >
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Confirmar Cambios
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Se aplicarán {Object.keys(diff).length} cambios
                </p>
              </div>

              <input
                type="password"
                placeholder="Contraseña de administrador"
                className="w-full border-2 rounded-lg px-4 py-3 focus:border-indigo-500 outline-none transition bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />

              {modalStatus && (
                <div
                  className={`p-2 rounded text-center text-xs font-bold ${
                    modalStatus.includes("❌")
                      ? "text-red-600 bg-red-50 dark:bg-red-900"
                      : "text-indigo-600 bg-indigo-50 dark:bg-indigo-900"
                  }`}
                >
                  {modalStatus}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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

// /* =========================
//    UTILIDADES
// ========================= */

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

// function validateStructure(data) {
//   if (typeof data !== "object" || data === null) return false;

//   return Object.values(data).every((empresa) => {
//     if (typeof empresa !== "object") return false;

//     return ["nafta", "gasoil"].every((tipo) => {
//       if (!empresa[tipo]) return true;

//       return Object.values(empresa[tipo]).every((producto) => {
//         return (
//           typeof producto === "object" &&
//           "precio" in producto &&
//           "fecha" in producto
//         );
//       });
//     });
//   });
// }

// /* =========================
//    COMPONENTE
// ========================= */

// export default function AdminPage() {
//   const [json, setJson] = useState("");
//   const [debouncedJson, setDebouncedJson] = useState("");
//   const [status, setStatus] = useState("");
//   const [modalOpen, setModalOpen] = useState(false);
//   const [passwordInput, setPasswordInput] = useState("");
//   const [modalStatus, setModalStatus] = useState("");
//   const [originalData, setOriginalData] = useState({});

//   /* =========================
//      CARGA INICIAL
//   ========================= */

//   useEffect(() => {
//     async function loadData() {
//       try {
//         const res = await fetch(`/api/admin/combustibles`);
//         if (!res.ok) throw new Error();
//         const data = await res.json();

//         setOriginalData(data);
//         setJson(JSON.stringify(data, null, 2));
//         setDebouncedJson(JSON.stringify(data, null, 2));

//         showStatus("✅ Datos sincronizados");
//       } catch {
//         showStatus("❌ Error al conectar con la API");
//       }
//     }

//     loadData();
//   }, []);

//   /* =========================
//      DEBOUNCE
//   ========================= */

//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       setDebouncedJson(json);
//     }, 300);

//     return () => clearTimeout(timeout);
//   }, [json]);

//   /* =========================
//      PARSEO
//   ========================= */

//   const parsedJson = useMemo(() => {
//     try {
//       return JSON.parse(debouncedJson);
//     } catch {
//       return null;
//     }
//   }, [debouncedJson]);

//   const isStructurallyValid = useMemo(() => {
//     if (!parsedJson) return false;
//     return validateStructure(parsedJson);
//   }, [parsedJson]);

//   /* =========================
//      DIFF
//   ========================= */

//   const diff = useMemo(() => {
//     if (!parsedJson) return {};
//     return getDiff(originalData, parsedJson);
//   }, [parsedJson, originalData]);

//   const totalChanges = useMemo(() => {
//     let count = 0;
//     Object.values(diff).forEach((empresa) => {
//       Object.values(empresa.to).forEach((tipo) => {
//         count += Object.keys(tipo).length;
//       });
//     });
//     return count;
//   }, [diff]);

//   /* =========================
//      HELPERS
//   ========================= */

//   const showStatus = (msg) => {
//     setStatus(msg);
//     setTimeout(() => setStatus(""), 6000);
//   };

//   const handleFormat = () => {
//     if (parsedJson) {
//       setJson(JSON.stringify(parsedJson, null, 2));
//     }
//   };

//   const handleSave = useCallback(() => {
//     if (!parsedJson) return alert("El JSON tiene errores de sintaxis.");
//     if (!isStructurallyValid)
//       return alert("La estructura del JSON es incorrecta.");
//     setModalOpen(true);
//     setModalStatus("");
//   }, [parsedJson, isStructurallyValid]);

//   /* =========================
//      CTRL + S
//   ========================= */

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

//   /* =========================
//      GUARDADO
//   ========================= */

//   async function confirmSave() {
//     if (!passwordInput) return setModalStatus("Escribe la contraseña");

//     setModalStatus("Enviando...");

//     try {
//       const res = await fetch("/api/admin/combustibles", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ password: passwordInput, data: parsedJson }),
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

//   /* =========================
//      RENDER
//   ========================= */

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
//             disabled={!parsedJson || !isStructurallyValid}
//             className={`px-6 py-2 rounded font-bold text-white shadow-md transition ${
//               parsedJson && isStructurallyValid
//                 ? "bg-indigo-600 hover:bg-indigo-700"
//                 : "bg-gray-300 cursor-not-allowed"
//             }`}
//           >
//             Guardar
//           </button>
//         </div>
//       </header>

//       {totalChanges > 0 && (
//         <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-3 py-2 rounded">
//           Hay {totalChanges} modificaciones sin guardar
//         </div>
//       )}

//       {/* CONTENIDO PRINCIPAL */}

//       <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
//         {/* EDITOR */}
//         <div className="lg:col-span-2 space-y-2 flex flex-col min-h-0">
//           <div className="flex justify-between items-center">
//             <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
//               Editor JSON
//             </span>

//             {!parsedJson ? (
//               <span className="text-xs text-red-500 font-bold animate-pulse">
//                 JSON INVÁLIDO
//               </span>
//             ) : !isStructurallyValid ? (
//               <span className="text-xs text-orange-500 font-bold">
//                 ESTRUCTURA INCORRECTA
//               </span>
//             ) : null}
//           </div>

//           <div
//             className={`flex-1 border-2 rounded-lg overflow-hidden min-h-0 ${
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

//         {/* PANEL DE CAMBIOS */}
//         <aside className="bg-gray-50 rounded-lg border p-4 flex flex-col min-h-0">
//           <h2 className="text-sm font-bold text-gray-700 mb-4 border-b pb-2">
//             CAMBIOS DETECTADOS ({totalChanges})
//           </h2>

//           <div className="flex-1 overflow-y-auto pr-2">
//             {Object.keys(diff).length === 0 ? (
//               <div className="h-full flex items-center justify-center text-gray-400 italic text-sm text-center">
//                 No se detectan diferencias
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
//                     <div key={tipo} className="mb-3">
//                       <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
//                         {tipo}
//                       </p>

//                       {Object.entries(productos).map(([prod, info]) => (
//                         <div key={prod} className="text-[11px] mb-2">
//                           <span className="font-bold text-gray-700">
//                             {prod}
//                           </span>

//                           <div className="text-red-500 line-through">
//                             {info.precio} ({info.fecha})
//                           </div>

//                           <div className="text-green-600 font-bold">
//                             {cambio.to[tipo][prod].precio} (
//                             {cambio.to[tipo][prod].fecha})
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
//       {/* Modal */}
//       {modalOpen && (
//         <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div
//             className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
//             onKeyDown={(e) => e.key === "Enter" && confirmSave()}
//           >
//             <div className="p-6 space-y-4">
//               <div className="text-center">
//                 <h2 className="text-xl font-bold text-gray-800">
//                   Confirmar Cambios
//                 </h2>
//                 <p className="text-sm text-gray-500 mt-1">
//                   Se aplicarán {Object.keys(diff).length} cambios
//                 </p>
//               </div>

//               <input
//                 type="password"
//                 placeholder="Contraseña de administrador"
//                 className="w-full border-2 rounded-lg px-4 py-3 focus:border-indigo-500 outline-none transition"
//                 value={passwordInput}
//                 onChange={(e) => setPasswordInput(e.target.value)}
//                 autoFocus
//               />

//               {modalStatus && (
//                 <div
//                   className={`p-2 rounded text-center text-xs font-bold ${
//                     modalStatus.includes("❌")
//                       ? "text-red-600 bg-red-50"
//                       : "text-indigo-600 bg-indigo-50"
//                   }`}
//                 >
//                   {modalStatus}
//                 </div>
//               )}

//               <div className="flex gap-3 pt-2">
//                 <button
//                   className="flex-1 px-4 py-2 rounded-lg font-semibold text-gray-500 hover:bg-gray-100 transition"
//                   onClick={() => {
//                     setModalOpen(false);
//                     setPasswordInput("");
//                   }}
//                 >
//                   Cancelar
//                 </button>
//                 <button
//                   className="flex-1 px-4 py-2 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition"
//                   onClick={confirmSave}
//                 >
//                   Confirmar
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
