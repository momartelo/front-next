import Card from "./components/Card";
import { getDolares, getEuro, getReal } from "./lib/dolar";
import {
  getInflacionMensualActual,
  getInflacionInteranualActual,
} from "./lib/inflacion";
import { formatFechaHora } from "./lib/date";
import { getCACHistorico } from "./lib/cac";

export default async function Dashboard() {
  const [
    dolares,
    euro,
    real,
    inflacionMensual,
    inflacionInteranual,
    cacHistorico,
  ] = await Promise.all([
    getDolares(),
    getEuro(),
    getReal(),
    getInflacionMensualActual(),
    getInflacionInteranualActual(),
    getCACHistorico(),
  ]);

  function getFechaFormateada(item) {
    return item?.fechaActualizacion
      ? formatFechaHora(item.fechaActualizacion)
      : null;
  }

  const fechaEuro = getFechaFormateada(euro);
  const fechaReal = getFechaFormateada(real);

  const inflacionColor = inflacionMensual
    ? inflacionMensual.valor >= 0
      ? "text-red-600"
      : "text-green-600"
    : "";

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tablero económico</h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_0.5fr]">
        <Card title="Dólares">
          {dolares.map((d) => {
            const fecha = getFechaFormateada(d);

            return (
              <div key={d.casa} className="border-b last:border-0 py-2">
                <p className="font-medium">
                  {d.nombre}: ${d.venta.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Fecha de actualización:{" "}
                  {fecha ? `${fecha.fecha} ${fecha.hora}` : "-"}
                </p>
              </div>
            );
          })}
        </Card>

        <div className="flex flex-col gap-4 ">
          <Card title="Euro">
            <p>Compra: {euro.compra.toFixed(2)}</p>
            <p>Venta: {euro.venta.toFixed(2)}</p>
            <p>
              Fecha de actualización:{" "}
              {fechaEuro ? `${fechaEuro.fecha} ${fechaEuro.hora}` : "-"}
            </p>
          </Card>

          <Card title="Real">
            <p>Compra: {real.compra.toFixed(2)}</p>
            <p>Venta: {real.venta.toFixed(2)}</p>
            <p>
              Fecha de actualización:{" "}
              {fechaReal ? `${fechaReal.fecha} ${fechaReal.hora}` : "-"}
            </p>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Inflación mensual">
            {inflacionMensual ? (
              <>
                <p className={`text-2xl font-semibold ${inflacionColor}`}>
                  {inflacionMensual.valor.toFixed(2)}%
                </p>
                <small>{inflacionMensual.fecha}</small>
              </>
            ) : (
              <p className="text-gray-400">No disponible</p>
            )}
          </Card>

          <Card title="Inflación interanual">
            {inflacionInteranual ? (
              <>
                <p className={`text-2xl font-semibold ${inflacionColor}`}>
                  {inflacionInteranual.valor.toFixed(2)}%
                </p>
                <small>{inflacionInteranual.fecha}</small>
              </>
            ) : (
              <p>No disponible</p>
            )}
          </Card>
        </div>
        <Card title="Índice CAC">
          {cacHistorico?.length ? (
            (() => {
              const ultimo = cacHistorico.at(-1);
              const date = new Date(ultimo.period);

              const mes = date.toLocaleString("es-AR", {
                month: "long",
                timeZone: "UTC",
              });

              const año = date.getUTCFullYear();

              return (
                <>
                  <p className="text-2xl font-semibold">
                    {ultimo.general.toLocaleString("es-AR")}
                  </p>
                  <small>
                    {mes} de {año}
                  </small>
                </>
              );
            })()
          ) : (
            <p className="text-gray-400">No disponible</p>
          )}
        </Card>
      </section>
    </main>
  );
}
