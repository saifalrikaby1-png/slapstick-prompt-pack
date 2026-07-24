import { SignInPublicPage } from "./sign-in-public";

export default async function Page({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  return <SignInPublicPage plan={plan} />;
}
