import { CharacterBuilder } from "../../character-builder";
import { Suspense } from "react";

export default function CharacterBuilderCreatePage() { return <Suspense fallback={null}><CharacterBuilder /></Suspense>; }
