import { notFound } from "next/navigation";
import { ProductionWorkspace } from "../../page";
import { videoStyleIds, VideoStyleId } from "../../video-styles";

export function generateStaticParams() {
  return videoStyleIds.map((style) => ({ style }));
}

export default async function StyleWorkspacePage({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  if (!videoStyleIds.includes(style as VideoStyleId)) notFound();
  return <ProductionWorkspace styleId={style as VideoStyleId} />;
}
