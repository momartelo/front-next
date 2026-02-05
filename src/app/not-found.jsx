export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 px-6">
      <div className="text-center max-w-md">
        {/* Icono */}
        <div className="text-6xl mb-4 animate-bounce">🚧</div>

        {/* Título */}
        <h1 className="text-5xl font-bold mb-3 text-gray-800 dark:text-white">
          404
        </h1>

        {/* Subtítulo */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          ❌ Ups… esta página no existe o fue movida.
        </p>

        {/* Botón */}
        <a
          href="/"
          className="
            inline-block
            px-6 py-3
            rounded-lg
            bg-blue-600
            hover:bg-blue-700
            text-white
            font-medium
            shadow-md
            transition
            hover:scale-105
          "
        >
          🏠 Volver al dashboard
        </a>

        {/* Texto decorativo */}
        <p className="mt-6 text-xs text-gray-400">
          Dashboard Económico · Next.js
        </p>
      </div>
    </main>
  );
}
