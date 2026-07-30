import { ProductionWorkspace } from "../../../page";

export default async function EditProductionPage({ params }: { params: Promise<{ productionId: string }> }) {
  const { productionId } = await params;
  return <ProductionWorkspace productionId={productionId} />;
}
