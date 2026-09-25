"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // Cerrar el submenú si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenSubmenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenSubmenu(null);
  }, [pathname]);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;

  const navItems = [
    { label: "Inicio", href: "/" },
    {
      label: "Inflación",
      children: [
        { label: "Mensual", href: "/inflacion/mensual" },
        { label: "Interanual", href: "/inflacion/acumulada" },
      ],
    },
    { label: "Dólar", href: "/dolar" },
    { label: "Combustibles", href: "/combustibles" },
    { label: "CAC", href: "/cac" },
  ];

  const baseLink =
    "relative px-1 py-2 whitespace-nowrap transition-colors duration-300 after:absolute after:left-0 after:-bottom-px after:h-0.5 after:w-0 after:transition-all after:duration-300";

  const activeLink =
    "text-blue-500 dark:text-blue-400 after:w-full after:bg-blue-400 dark:after:bg-blue-300";

  const inactiveLink =
    "hover:text-blue-400 dark:hover:text-blue-300 after:bg-blue-400 dark:after:bg-blue-300 hover:after:w-full";

  const toggleSubmenu = (label) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70">
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-4 flex-wrap">
        {/* Logo */}
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <span>📊</span>
          <span>Dashboard Económico</span>
        </h2>

        {/* Botón de Menú Hamburguesa + Theme Switcher (Móvil) */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Toggle dark / light móvil */}
          <button
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className={`relative h-8 w-12 rounded-full border transition-all duration-500 overflow-hidden shadow-inner cursor-pointer ${
              currentTheme === "dark"
                ? "bg-blue-800 border-blue-800"
                : "bg-sky-400 border-sky-400"
            }`}
            aria-label="Cambiar tema"
          >
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                currentTheme === "dark"
                  ? "translate-y-0 opacity-100 rotate-0"
                  : "-translate-y-10 opacity-0 -rotate-12"
              }`}
            >
              <span className="text-sm">🌙</span>
            </div>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                currentTheme === "dark"
                  ? "translate-y-10 opacity-0 rotate-12"
                  : "translate-y-0 opacity-100 rotate-0"
              }`}
            >
              <span className="text-sm">☀️</span>
            </div>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 focus:outline-none"
            aria-label="Toggle menu"
          >
            <span className="text-xl">{mobileMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Menú de Navegación (Escritorio + Móvil desplegable) */}
        <div
          className={`${
            mobileMenuOpen ? "block" : "hidden"
          } w-full md:flex md:w-auto md:items-center gap-6 text-sm mt-4 md:mt-0`}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            {navItems.map((item) =>
              item.children ? (
                /* Se agrega 'group' para detectar hover en PC */
                <div
                  key={item.label}
                  className="relative group"
                  ref={dropdownRef}
                >
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={`${baseLink} w-full text-left md:w-auto flex items-center justify-between ${
                      pathname.includes("/inflacion")
                        ? activeLink
                        : inactiveLink
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {item.label}{" "}
                      <span
                        className={`transition-transform duration-200 inline-block group-hover:md:rotate-180 ${
                          openSubmenu === item.label ? "rotate-180" : ""
                        }`}
                      >
                        ▾
                      </span>
                    </span>
                  </button>

                  {/* 
                    Submenú desplegable:
                    - En Móvil (<md): se controla mediante el estado openSubmenu (click).
                    - En PC (>=md): se muestra automáticamente al hacer hover sobre 'group' (group-hover:md:block).
                  */}
                  <div
                    className={`${
                      openSubmenu === item.label ? "block" : "hidden"
                    } group-hover:md:block md:absolute left-0 top-full w-full md:w-44 rounded-md shadow-lg border z-50 bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 py-2 mt-1 md:mt-0`}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-3 mx-2 py-1 transition-colors"
                      >
                        <span
                          className={`${baseLink} inline-block ${
                            pathname === child.href
                              ? activeLink
                              : "text-gray-600 dark:text-gray-300 " +
                                inactiveLink
                          }`}
                        >
                          {child.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${baseLink} block ${
                    pathname === item.href ? activeLink : inactiveLink
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>

          {/* Toggle dark / light (Escritorio) */}
          <button
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className={`hidden md:block relative ml-2 h-8 w-12 rounded-full border transition-all duration-500 overflow-hidden shadow-inner cursor-pointer ${
              currentTheme === "dark"
                ? "bg-blue-800 border-blue-800"
                : "bg-sky-400 border-sky-400"
            }`}
            aria-label="Cambiar tema"
          >
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                currentTheme === "dark"
                  ? "translate-y-0 opacity-100 rotate-0"
                  : "-translate-y-10 opacity-0 -rotate-12"
              }`}
            >
              <span className="text-sm">🌙</span>
            </div>

            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                currentTheme === "dark"
                  ? "translate-y-10 opacity-0 rotate-12"
                  : "translate-y-0 opacity-100 rotate-0"
              }`}
            >
              <span className="text-sm">☀️</span>
            </div>
          </button>
        </div>
      </nav>
    </header>
  );
}
