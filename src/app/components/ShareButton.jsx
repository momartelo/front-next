"use client";

import { useEffect, useState } from "react";
import { getDolares } from "@/app/lib/dolar";
import { getCombustiblesMarDelPlata } from "@/app/lib/ypf";
import { getCACHistorico } from "@/app/lib/cac";

export default function ShareButton() {
  const [datos, setDatos] = useState(null);

  const formatNumber = (value) =>
    Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  useEffect(() => {
    async function load() {
      const [dolares, combustibles, cac] = await Promise.all([
        getDolares(),
        getCombustiblesMarDelPlata(),
        getCACHistorico(),
      ]);

      const ultimoCAC = cac?.at(-1);

      setDatos({
        blue: dolares?.find((d) => d.nombre === "Blue")?.venta || "0",
        ypf: combustibles?.ypf?.nafta?.super || "0",
        cac: ultimoCAC ? formatNumber(ultimoCAC.general) : "No disp.",
      });
    }

    load();
  }, []);

  const handleShare = () => {
    const texto = `
📊 *REPORTE ECONÓMICO*

💵 *Dólar Blue:* $${datos.blue}
⛽ *Nafta YPF:* $${datos.ypf}
🏗️ *Índice CAC:* ${datos.cac}

_Enviado desde mi Dashboard_
  `.trim();

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const baseUrl = isMobile
      ? "https://api.whatsapp.com/send"
      : "https://web.whatsapp.com/send";

    window.open(`${baseUrl}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  if (!datos) return null;

  return (
    <button
      onClick={handleShare}
      className="fixed bottom-6 right-6 bg-[#25D366] text-white
                 p-3 rounded-full shadow-2xl hover:bg-[#128C7E]
                 transition-all z-50 border-2 border-white/20"
    >
      <img
        src="/logos/whatsapp.png"
        alt="WhatsApp"
        className="w-6 h-6 brightness-0 invert"
      />
    </button>
  );
}
