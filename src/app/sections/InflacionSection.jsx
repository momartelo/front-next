import Card from "../components/Card";
import { formatFechaISO } from "../lib/date";
import {
  getInflacionMensualActual,
  getInflacionInteranualActual,
} from "../lib/inflacion";

export default async function InflacionSection() {
  const [mensual, interanual] = await Promise.all([
    getInflacionMensualActual(),
    getInflacionInteranualActual(),
  ]);

  const inflacionColor = mensual
    ? mensual.valor >= 0
      ? "text-red-600"
      : "text-green-600"
    : "";

  return (
    <>
      <Card title="Inflación mensual" center>
        {mensual ? (
          <>
            <p className={`text-2xl font-semibold ${inflacionColor}`}>
              {mensual.valor.toFixed(2)}%
            </p>
            <small className="text-gray-400 text-xs">
              {formatFechaISO(mensual.fecha)}
            </small>
          </>
        ) : (
          <p>No disponible</p>
        )}
      </Card>

      <Card title="Inflación interanual" center>
        {interanual ? (
          <>
            <p className={`text-2xl font-semibold ${inflacionColor}`}>
              {interanual.valor.toFixed(2)}%
            </p>
            <small className="text-gray-400 text-xs">
              {formatFechaISO(interanual.fecha)}
            </small>
          </>
        ) : (
          <p>No disponible</p>
        )}
      </Card>
    </>
  );
}
