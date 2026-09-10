// app/dolar/loading.jsx

export default function LoadingDolarPage() {
  return (
    <div className="p-4 flex flex-col items-center min-h-[calc(100vh-70px)] animate-pulse">
      {/* Título Skeleton */}
      <div className="h-10 w-56 bg-gray-200 dark:bg-neutral-800 rounded-md mb-5" />

      {/* Control Bar Skeleton */}
      <div className="flex flex-wrap justify-center gap-3 mb-5 w-full max-w-4xl">
        <div className="h-10 w-48 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
        <div className="h-10 w-72 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
        <div className="h-10 w-64 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
      </div>

      {/* Tarjetas Skeleton */}
      <div className="w-full xl:w-[90%] 2xl:w-[calc(100%-6rem)] grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="h-18 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
        <div className="h-18 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
      </div>

      {/* Gráfico y Tabla Skeleton */}
      <div className="w-full 2xl:w-[calc(100%-6rem)] 2xl:mx-12 xl:w-[90%] grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        <div className="h-[65vh] w-full bg-gray-200 dark:bg-neutral-800 rounded-xl" />
        <div className="h-[65vh] w-full bg-gray-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    </div>
  );
}
