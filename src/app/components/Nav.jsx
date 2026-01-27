export default function Nav() {
  return (
    <header
      className="
        sticky top-0 z-50
        bg-white/80 dark:bg-gray-900/80
        backdrop-blur
        border-b border-gray-200 dark:border-gray-700
      "
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
          📊 Dashboard Económico
        </h2>

        <div className="flex gap-4 text-sm">
          {[
            ["Inicio", "/"],
            ["Inflación", "/inflacion"],
            ["Dólar", "#dolar"],
            ["Combustibles", "#combustibles"],
            ["CAC", "#cac"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
