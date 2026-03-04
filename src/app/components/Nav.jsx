"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
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

  // 🎨 Estilos reutilizables
  const baseLink =
    "relative px-1 py-2 transition-colors duration-300 after:absolute after:left-0 after:-bottom-px after:h-0.5 after:w-0 after:transition-all after:duration-300";

  const activeLink =
    "text-blue-500 dark:text-blue-400 after:w-full after:bg-blue-400 dark:after:bg-blue-300";

  const inactiveLink =
    "hover:text-blue-400 dark:hover:text-blue-300 after:bg-blue-400 dark:after:bg-blue-300 hover:after:w-full";

  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70">
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <h2 className="font-semibold text-lg flex items-center gap-1">
          <span>📊</span>
          <span className="hidden sm:inline">Dashboard Económico</span>
        </h2>

        <div className="flex items-center gap-6 text-sm relative">
          {navItems.map((item) =>
            item.children ? (
              <div key={item.label} className="relative group">
                <button
                  className={`${baseLink} ${
                    pathname.includes("/inflacion") ? activeLink : inactiveLink
                  }`}
                >
                  {item.label} ▾
                </button>

                <div className="absolute left-0 top-full hidden group-hover:block w-44 rounded-md shadow-lg border z-50 bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 py-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-3  mx-2 py-0.5 transition-colors"
                    >
                      <span
                        className={`${baseLink} inline-block ${
                          pathname === child.href
                            ? activeLink
                            : "text-gray-600 dark:text-gray-300 " + inactiveLink
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
                className={`${baseLink} ${
                  pathname === item.href ? activeLink : inactiveLink
                }`}
              >
                {item.label}
              </Link>
            ),
          )}

          {/* Toggle dark / light */}
          <button
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className={`relative ml-2 h-8 w-12 rounded-full border transition-all duration-500 overflow-hidden shadow-inner cursor-pointer
              ${
                currentTheme === "dark"
                  ? "bg-blue-800 border-blue-800"
                  : "bg-sky-400 border-sky-400"
              }`}
            aria-label="Cambiar tema"
          >
            {/* Luna */}
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

            {/* Sol */}
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
        </div>
      </nav>
    </header>
  );
}
