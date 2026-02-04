import Card from "../components/Card";
import { getDolares } from "../lib/dolar";
import { formatFechaHora } from "../lib/date";

export default async function DolaresSection() {
  const dolares = await getDolares();

  return (
    <Card title={<span className="font-semibold text-xl">Dolares</span>}>
      {dolares?.map((d) => {
        const fecha = d.fechaActualizacion
          ? formatFechaHora(d.fechaActualizacion)
          : null;

        return (
          <div key={d.casa} className="border-b last:border-0 py-1.5">
            <p className="font-medium">
              {d.nombre}: ${d.venta.toFixed(2)}
            </p>
            <small className="text-gray-400">
              Actualizado al: {fecha ? `${fecha.fecha} ${fecha.hora}` : "-"}
            </small>
          </div>
        );
      })}
    </Card>
  );
}
