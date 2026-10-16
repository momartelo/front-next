"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Inicio", href: "/", icon: "⌂" },
  {
    label: "Inflación",
    icon: "↗",
    children: [
      { label: "Mensual", href: "/inflacion/mensual" },
      { label: "Interanual", href: "/inflacion/acumulada" },
    ],
  },
  { label: "Dólar", href: "/dolar", icon: "$" },
  { label: "Combustibles", href: "/combustibles", icon: "⛽" },
  { label: "CAC", href: "/cac", icon: "▦" },
];

export default function MobileNavDemo() {
  const { theme, setTheme, systemTheme } = useTheme();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [inflationOpen, setInflationOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setOpen(false);
    setInflationOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;

  const active = (href) =>
    href === "/" ? pathname === "/" : pathname === href;

  const handleClose = () => {
    setOpen(false);
    setInflationOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-[#f9fcf3] backdrop-blur-xl dark:border-neutral-800 dark:bg-gray-950">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 p-4">
        {/* Marca */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2"
          onClick={handleClose}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-sm">
            📊
          </span>
          <span className="min-w-0">
            <span className="block whitespace-nowrap text-sm font-bold sm:text-base">
              Dashboard Económico
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              Indicadores argentinos
            </span>
          </span>
        </Link>

        {/* Controles móviles */}
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setOpen((previous) => !previous)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-sm transition hover:bg-blue-700"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>

        {/* Navegación escritorio */}
        <div className="hidden items-center gap-4 md:flex">
          {items.map((item) =>
            item.children ? (
              <div key={item.label} className="group relative">
                <button
                  type="button"
                  className={`flex items-center gap-1 py-2 text-sm transition px-2 cursor-pointer rounded-lg hover:bg-gray-100 hover:text-blue-500 dark:hover:bg-neutral-900 ${
                    pathname.startsWith("/inflacion") ? "text-blue-500" : ""
                  }`}
                >
                  Inflación <span>⌄</span>
                </button>

                <div className="invisible absolute left-0 top-full w-44 translate-y-1 rounded-xl border border-gray-200 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 dark:border-neutral-800 dark:bg-neutral-900">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`block rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800  hover:text-blue-500  ${
                        active(child.href) ? "text-blue-500" : ""
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`py-2 text-sm transition hover:text-blue-500 hover:bg-gray-100 px-2 rounded-lg dark:hover:bg-neutral-900 ${
                  active(item.href) ? "text-blue-500" : ""
                }`}
              >
                {item.label}
              </Link>
            ),
          )}

          <button
            type="button"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className={`flex h-9 w-9 items-center cursor-pointer justify-center rounded-xl border ${
              currentTheme === "dark"
                ? "border-sky-400 bg-sky-400"
                : "border-blue-800 bg-blue-800"
            }`}
            aria-label="Cambiar tema"
          >
            {currentTheme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Panel flotante móvil */}
        {open && (
          <>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={handleClose}
              className="fixed inset-0 top-18 z-40 cursor-default bg-black/10 backdrop-blur-[2px] md:hidden"
            />

            <div className="absolute right-4 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 md:hidden">
              <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                Navegación principal
              </p>

              <div className="space-y-1">
                {items.map((item) =>
                  item.children ? (
                    <div key={item.label}>
                      <button
                        type="button"
                        onClick={() =>
                          setInflationOpen((previous) => !previous)
                        }
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors duration-200 ${
                          pathname.startsWith("/inflacion")
                            ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                        }`}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-neutral-800">
                          {item.icon}
                        </span>
                        <span className="flex-1 text-left">Inflación</span>
                        <span
                          className={`transition-transform ${
                            inflationOpen ? "rotate-180" : ""
                          }`}
                        >
                          ⌄
                        </span>
                      </button>

                      {inflationOpen && (
                        <div className="ml-8 mt-1 space-y-1 border-l-2 border-blue-100 pl-3 dark:border-neutral-800">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={handleClose}
                              className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                                active(child.href)
                                  ? "font-semibold text-blue-600 dark:text-blue-400"
                                  : "text-gray-500 hover:text-blue-500 dark:text-gray-400"
                              }`}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleClose}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors duration-200 ${
                        active(item.href)
                          ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                      }`}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-neutral-800">
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {active(item.href) && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </Link>
                  ),
                )}
              </div>

              <div className="mt-3 border-t border-gray-200 pt-3 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() =>
                    setTheme(currentTheme === "dark" ? "light" : "dark")
                  }
                  className="flex w-full items-center cursor-pointer gap-3 rounded-xl px-3 py-3 text-sm transition-colors duration-200 text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-neutral-800">
                    {currentTheme === "dark" ? "☀️" : "🌙"}
                  </span>
                  <span className="flex-1 text-left">Apariencia</span>
                  <span className="text-xs text-gray-500">
                    {currentTheme === "dark" ? "Oscuro" : "Claro"}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
// "use client";

// import { useTheme } from "next-themes";
// import { useEffect, useState, useRef } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";

// export default function Nav() {
//   const { theme, setTheme, systemTheme } = useTheme();

//   const [mounted, setMounted] = useState(false);
//   const [openSubmenu, setOpenSubmenu] = useState(null);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   const pathname = usePathname();
//   const navRef = useRef(null);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   // Cerrar los menús al cambiar de ruta
//   useEffect(() => {
//     setMobileMenuOpen(false);
//     setOpenSubmenu(null);
//   }, [pathname]);

//   // Cerrar el menú al hacer clic fuera de la navegación
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (navRef.current && !navRef.current.contains(event.target)) {
//         setMobileMenuOpen(false);
//         setOpenSubmenu(null);
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside);

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   if (!mounted) return null;

//   const currentTheme = theme === "system" ? systemTheme : theme;

//   const navItems = [
//     { label: "Inicio", href: "/" },
//     {
//       label: "Inflación",
//       children: [
//         { label: "Mensual", href: "/inflacion/mensual" },
//         { label: "Interanual", href: "/inflacion/acumulada" },
//       ],
//     },
//     { label: "Dólar", href: "/dolar" },
//     { label: "Combustibles", href: "/combustibles" },
//     { label: "CAC", href: "/cac" },
//   ];

//   // La línea celeste ocupa solamente el ancho del texto
//   const baseLink =
//     "relative inline-block w-fit px-1 py-2 whitespace-nowrap transition-colors duration-300 after:absolute after:left-1 after:bottom-1 after:h-0.5 after:w-0 after:transition-all after:duration-300";

//   const activeLink =
//     "text-blue-500 dark:text-blue-400 after:!w-[calc(100%-0.5rem)] after:bg-blue-400 dark:after:bg-blue-300";

//   const inactiveLink =
//     "hover:text-blue-400 dark:hover:text-blue-300 after:bg-blue-400 dark:after:bg-blue-300 hover:after:!w-[calc(100%-0.5rem)]";

//   const toggleSubmenu = (label) => {
//     setOpenSubmenu((previous) => (previous === label ? null : label));
//   };

//   const toggleTheme = () => {
//     setTheme(currentTheme === "dark" ? "light" : "dark");
//   };

//   return (
//     <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/70 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
//       <nav
//         ref={navRef}
//         className="relative mx-auto flex max-w-7xl items-center justify-between p-4"
//       >
//         {/* Logo: permanece a la izquierda */}
//         <h2 className="flex items-center gap-2 whitespace-nowrap text-base font-semibold sm:text-lg">
//           <span>📊</span>
//           <span>Dashboard Económico</span>
//         </h2>

//         {/* Controles móviles */}
//         <div className="flex shrink-0 items-center gap-2 md:hidden">
//           {/* Selector de tema móvil */}
//           <button
//             type="button"
//             onClick={toggleTheme}
//             className={`relative h-8 w-12 shrink-0 cursor-pointer overflow-hidden rounded-full border shadow-inner transition-all duration-500 ${
//               currentTheme === "dark"
//                 ? "border-blue-800 bg-blue-800"
//                 : "border-sky-400 bg-sky-400"
//             }`}
//             aria-label="Cambiar tema"
//           >
//             <span
//               className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
//                 currentTheme === "dark"
//                   ? "translate-y-0 rotate-0 opacity-100"
//                   : "-translate-y-10 -rotate-12 opacity-0"
//               }`}
//             >
//               🌙
//             </span>

//             <span
//               className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
//                 currentTheme === "dark"
//                   ? "translate-y-10 rotate-12 opacity-0"
//                   : "translate-y-0 rotate-0 opacity-100"
//               }`}
//             >
//               ☀️
//             </span>
//           </button>

//           {/* Botón hamburguesa / cerrar */}
//           <button
//             type="button"
//             onClick={() => {
//               setMobileMenuOpen((previous) => !previous);
//               setOpenSubmenu(null);
//             }}
//             className="relative z-60 flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none dark:hover:bg-neutral-800"
//             aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
//             aria-expanded={mobileMenuOpen}
//             aria-controls="mobile-navigation"
//           >
//             <span className="text-xl leading-none">
//               {mobileMenuOpen ? "✕" : "☰"}
//             </span>
//           </button>
//         </div>

//         {/* Panel de navegación */}
//         <div
//           id="mobile-navigation"
//           className={`${
//             mobileMenuOpen ? "flex" : "hidden"
//           } absolute right-4 top-full z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] flex-col items-end gap-4 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-900 md:static md:mt-0 md:flex md:w-auto md:max-w-none md:flex-row md:items-center md:gap-6 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:dark:bg-transparent`}
//         >
//           <div className="flex w-full flex-col items-end gap-3 md:w-auto md:flex-row md:items-center md:gap-6">
//             {navItems.map((item) =>
//               item.children ? (
//                 <div
//                   key={item.label}
//                   className="relative flex w-full flex-col items-end md:w-auto md:items-start md:[&:hover>div]:block"
//                 >
//                   {/* Botón Inflación */}
//                   <button
//                     type="button"
//                     onClick={() => {
//                       if (window.matchMedia("(max-width: 767px)").matches) {
//                         toggleSubmenu(item.label);
//                       }
//                     }}
//                     className={`${baseLink} cursor-pointer flex items-center justify-end gap-1 md:justify-start ${
//                       pathname.startsWith("/inflacion")
//                         ? activeLink
//                         : inactiveLink
//                     }`}
//                     aria-expanded={openSubmenu === item.label}
//                   >
//                     <span>Inflación</span>
//                     <span
//                       className={`inline-block transition-transform duration-200 ${
//                         openSubmenu === item.label ? "rotate-180" : ""
//                       }`}
//                     >
//                       ▾
//                     </span>
//                   </button>

//                   {/* Submenú */}
//                   <div
//                     className={`${
//                       openSubmenu === item.label ? "block" : "hidden"
//                     } relative z-50 mt-1 w-fit min-w-full rounded-md bg-gray-50 py-2 dark:bg-neutral-800 md:absolute md:left-0 md:top-full md:mt-0 md:w-44 md:min-w-0 md:border md:border-gray-200 md:bg-white md:shadow-lg md:dark:border-neutral-800 md:dark:bg-neutral-900`}
//                   >
//                     {item.children.map((child) => (
//                       <Link
//                         key={child.href}
//                         href={child.href}
//                         onClick={() => {
//                           setMobileMenuOpen(false);
//                           setOpenSubmenu(null);
//                         }}
//                         className="block px-3 py-1 text-right transition-colors md:text-left"
//                       >
//                         <span
//                           className={`${baseLink} ${
//                             pathname === child.href
//                               ? activeLink
//                               : "text-gray-600 dark:text-gray-300 " +
//                                 inactiveLink
//                           }`}
//                         >
//                           {child.label}
//                         </span>
//                       </Link>
//                     ))}
//                   </div>
//                 </div>
//               ) : (
//                 <Link
//                   key={item.label}
//                   href={item.href}
//                   onClick={() => {
//                     setMobileMenuOpen(false);
//                     setOpenSubmenu(null);
//                   }}
//                   className={`${baseLink} self-end text-right md:self-auto md:text-left ${
//                     pathname === item.href ? activeLink : inactiveLink
//                   }`}
//                 >
//                   {item.label}
//                 </Link>
//               ),
//             )}
//           </div>

//           {/* Selector de tema escritorio */}
//           <button
//             type="button"
//             onClick={toggleTheme}
//             className={`relative ml-2 hidden h-8 w-12 shrink-0 cursor-pointer overflow-hidden rounded-full border shadow-inner transition-all duration-500 md:block ${
//               currentTheme === "dark"
//                 ? "border-blue-800 bg-blue-800"
//                 : "border-sky-400 bg-sky-400"
//             }`}
//             aria-label="Cambiar tema"
//           >
//             <span
//               className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
//                 currentTheme === "dark"
//                   ? "translate-y-0 opacity-100"
//                   : "-translate-y-10 opacity-0"
//               }`}
//             >
//               🌙
//             </span>

//             <span
//               className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
//                 currentTheme === "dark"
//                   ? "translate-y-10 opacity-0"
//                   : "translate-y-0 opacity-100"
//               }`}
//             >
//               ☀️
//             </span>
//           </button>
//         </div>
//       </nav>
//     </header>
//   );
// }
