import CACSelector from "../components/CACSelector";
import { getCACHistorico } from "../lib/cac";

export default async function CACSelectorSection() {
  const historico = await getCACHistorico();
  const ultimo = historico.at(-1);

  return <CACSelector cacHistorico={historico} ultimoCAC={ultimo} />;
}
