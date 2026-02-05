export default function CardSkeleton({ title }) {
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 animate-pulse min-h-45">
      {/* Título */}
      <div className="h-5 w-1/3 bg-gray-300 dark:bg-gray-700 rounded mb-4" />

      {/* Valor principal */}
      <div className="h-8 w-1/2 bg-gray-300 dark:bg-gray-700 rounded mb-4" />

      {/* Líneas */}
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-600 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-600 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-600 rounded" />
      </div>
    </div>
  );
}
