"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Nav() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // evita hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <header
      className="
        sticky top-0 z-50 backdrop-blur border-b border-gray-200 "
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <h2 className="font-semibold text-lg flex items-center gap-1">
          <span>📊</span>
          <span className="hidden sm:inline">Dashboard Económico</span>
        </h2>

        <div className="flex items-center gap-4 text-sm">
          {[
            ["Inicio", "/"],
            ["Inflación", "/inflacion"],
            ["Dólar", "/dolar"],
            ["Combustibles", "/combustibles"],
            ["CAC", "/cac"],
          ].map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}

          {/* Toggle dark / light */}
          <button
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className={`relative ml-2 h-8 w-12 rounded-full border transition-all duration-500 overflow-hidden shadow-inner cursor-pointer
    ${
      currentTheme === "dark"
        ? "bg-blue-800 border-blue-800" // Fondo Noche
        : "bg-sky-400 border-sky-400" // Fondo Día
    }`}
            aria-label="Cambiar tema"
          >
            {/* Icono LUNA: cae desde arriba cuando es dark */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-500
      ${
        currentTheme === "dark"
          ? "translate-y-0 opacity-100 rotate-0"
          : "-translate-y-10 opacity-0 -rotate-12"
      }`}
            >
              <span className="text-sm">🌙</span>
            </div>

            {/* Icono SOL: cae desde arriba cuando es light (o se va hacia abajo en dark) */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-all duration-500
      ${
        currentTheme === "dark"
          ? "translate-y-10 opacity-0 rotate-12"
          : "translate-y-0 opacity-100 rotate-0"
      }`}
            >
              <span className="text-sm">☀️</span>
            </div>
          </button>
          {/* <button
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className={`ml-2 rounded-md border px-2 py-1 text-xs cursor-pointer transition-colors duration-300
    ${
      currentTheme === "dark"
        ? "bg-sky-200  text-gray-700" // Fondo celeste claro para el Sol
        : "bg-blue-900 text-white" // Fondo azul muy oscuro para la Luna
    } 
  `}
            aria-label="Cambiar tema"
          >
            {currentTheme === "dark" ? "☀️" : "🌙"}
          </button> */}
        </div>
      </nav>
    </header>
  );
}
