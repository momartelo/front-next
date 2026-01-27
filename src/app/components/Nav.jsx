export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur ">
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <h2 className="font-semibold text-lg">📊 Dashboard Económico</h2>

        <div className="flex gap-4 text-sm text-gray-600">
          <a href="/" className="hover:text-black">
            Inicio
          </a>
          <a href="/inflacion" className="hover:text-black">
            Inflación
          </a>
          <a href="#dolar" className="hover:text-black">
            Dólar
          </a>
          <a href="#combustibles" className="hover:text-black">
            Combustibles
          </a>
          <a href="#cac" className="hover:text-black">
            CAC
          </a>
        </div>
      </nav>
    </header>
  );
}
