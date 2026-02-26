import Card from "../components/Card";
import { getCombustiblesMarDelPlata } from "../lib/ypf";
import { formatFechaHora } from "../lib/date";

const LOGOS = {
  ypf: "/logos/ypf.png",
  shell: "/logos/shell.png",
  axion: "/logos/axion.png",
  puma: "/logos/puma.png",
};

export default async function CombustiblesSection() {
  const combustibles = await getCombustiblesMarDelPlata();

  if (!combustibles) {
    return (
      <Card
        title={
          <>
            <span className="block w-full text-center pb-4 font-semibold">
              Combustibles · Mar del Plata
            </span>
            <span className="block w-full text-center pb-4 font-semibold">
              No disponibles
            </span>
          </>
        }
      ></Card>
    );
  }

  return (
    <Card
      title={
        <span className="block w-full text-center pb-4 font-semibold">
          Combustibles · Mar del Plata
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:gap-2">
        {Object.entries(combustibles).map(([key, e]) => {
          if (!e) return null;

          return (
            <div key={key} className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <img src={LOGOS[key]} className="h-5" />
                <p className="font-semibold text-blue-700">{e.empresa}</p>
              </div>
              <div className="mt-1 text-sm">
                <p>Nafta Súper: ${e.nafta.super?.toFixed(2) ?? "-"}</p>
                <p>Nafta Premium: ${e.nafta.premium?.toFixed(2) ?? "-"}</p>
                <p>Gasoil: ${e.gasoil.comun?.toFixed(2) ?? "-"}</p>
                <p>Gasoil Premium: ${e.gasoil.premium?.toFixed(2) ?? "-"}</p>
              </div>

              <small className="text-gray-400 text-xs">
                Actualizado al:{" "}
                {formatFechaHora(e.fechaActualizacion)?.fecha || "-"}
              </small>
            </div>
          );
        })}
        <p className="text-gray-400 text-xs">Fuente: Secretaria de energia</p>
      </div>
    </Card>
  );
}
