import { ResultsWorkspace } from "./results-workspace";

export default async function ProductionResultsPage({ params }: { params: Promise<{ productionId: string }> }) {
  const { productionId } = await params;
  return <ResultsWorkspace productionId={productionId} />;
}
