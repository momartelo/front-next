import Card from "../components/Card";
import { formatFechaISO } from "../lib/date";
import { getIndiceUVAActual } from "../lib/indiceUVA";
import { getInflacionMensualActual } from "../lib/inflacion";
import { getRiesgoPaisUltimo } from "../lib/riesgoPais";

export default async function IndicesSection() {
  const [uva, riesgo, mensual] = await Promise.all([
    getIndiceUVAActual(),
    getRiesgoPaisUltimo(),
    getInflacionMensualActual(),
  ]);

  const inflacionColor = mensual
    ? mensual.valor >= 0
      ? "text-red-600"
      : "text-green-600"
    : "";

  return (
    <>
      <Card title="Índice UVA" center>
        {uva ? (
          <>
            <p className={`text-2xl font-semibold ${inflacionColor}`}>
              {uva.valor.toFixed(2)}
            </p>
            <small className="text-gray-400 text-xs">
              {formatFechaISO(uva.fecha)}
            </small>
          </>
        ) : (
          "—"
        )}
      </Card>

      <Card title="Riesgo País" center>
        {riesgo ? (
          <>
            <p className={`text-2xl font-semibold ${inflacionColor}`}>
              {riesgo.valor.toFixed(0)}
            </p>
            <small className="text-gray-400 text-xs">
              {formatFechaISO(riesgo.fecha)}
            </small>
          </>
        ) : (
          "—"
        )}
      </Card>
    </>
  );
}
