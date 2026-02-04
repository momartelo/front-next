import Card from "../components/Card";
import { getEuro, getReal } from "../lib/dolar";
import { formatFechaHora } from "../lib/date";

export default async function MonedasSection() {
  const [euro, real] = await Promise.all([getEuro(), getReal()]);

  const fechaEuro = euro?.fechaActualizacion
    ? formatFechaHora(euro.fechaActualizacion)
    : null;

  const fechaReal = real?.fechaActualizacion
    ? formatFechaHora(real.fechaActualizacion)
    : null;

  return (
    <div className="flex gap-16 border border-gray-200 rounded-lg">
      <Card title={<span className="font-semibold">Euro</span>} noBorder>
        <p className="text-sm">Compra: ${euro?.compra?.toFixed(2) ?? "-"}</p>
        <p className="text-sm">Venta: ${euro?.venta?.toFixed(2) ?? "-"}</p>
        <small className="text-gray-400 text-xs">
          Actualizado al: {fechaEuro?.fecha || "-"}
        </small>
      </Card>

      <Card title={<span className="font-semibold">Real</span>} noBorder>
        <p className="text-sm">Compra: ${real?.compra?.toFixed(2) ?? "-"}</p>
        <p className="text-sm">Venta: ${real?.venta?.toFixed(2) ?? "-"}</p>
        <small className="text-gray-400 text-xs">
          Actualizado al: {fechaReal?.fecha || "-"}
        </small>
      </Card>
    </div>
  );
}
