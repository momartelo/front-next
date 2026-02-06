export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center    px-6">
      <div className="text-center max-w-md">
        {/* Icono */}
        <div className="text-6xl mb-4 animate-bounce">🚧</div>

        {/* Título */}
        <h1 className="text-5xl font-bold mb-3  ">404</h1>

        {/* Subtítulo */}
        <p className=" mb-6">❌ Ups… esta página no existe o fue movida.</p>

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
        <p className="mt-6 text-xs ">Dashboard Económico · Next.js</p>
      </div>
    </main>
  );
}
