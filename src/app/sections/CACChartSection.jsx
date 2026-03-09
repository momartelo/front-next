import Card from "../components/Card";
import CACChart from "../components/CACChart";
import { getCACHistorico } from "../lib/cac";

export default async function CACSChartSection() {
  const historico = await getCACHistorico();

  return (
    <section className="mt-4">
      <Card title="Evolución CAC" padding={"8px 24px 8px 0px"}>
        <CACChart data={historico.slice(-12)} />
      </Card>
    </section>
  );
}
