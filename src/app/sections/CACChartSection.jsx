import Card from "../components/Card";
import CACChart from "../components/CACChart";
import { getCACHistorico } from "../lib/cac";

export default async function CACSChartSection() {
  const { data, anomalies } = await getCACHistorico();

  return (
    <section>
      <Card title="Evolución CAC" padding={"16px 16px 8px 8px"}>
        <CACChart data={data.slice(-12)} anomalies={anomalies} />
      </Card>
    </section>
  );
}
