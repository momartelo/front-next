"use client";

export default function ShareButton({ datos }) {
  const handleShare = () => {
    const texto =
      `📊 *REPORTE ECONÓMICO* %0A%0A` +
      `💵 *Dólar Blue:* $${datos.blue} %0A` +
      `⛽ *Nafta YPF:* $${datos.ypf} %0A` +
      `🏗️ *Índice CAC:* ${datos.cac} %0A%0A` +
      `_Enviado desde mi Dashboard_`;

    window.open(`https://wa.me/?text=${texto}`, "_blank");
  };

  return (
    <button
      onClick={handleShare}
      className="fixed bottom-6 right-6 bg-[#25D366] text-white px-6 py-3 rounded-full shadow-2xl hover:bg-[#128C7E] transition-all font-bold flex items-center gap-3 z-50 border-2 border-white/20"
    >
      {/* El logo oficial de WhatsApp */}
      <img
        src="/logos/whatsapp.png"
        alt="WhatsApp"
        className="w-6 h-6 brightness-0 invert" // Esto pone el logo en blanco si es oscuro
      />
      <span>Compartir reporte</span>
    </button>
  );
}
