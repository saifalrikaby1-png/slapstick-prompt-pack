import { CharacterBuilder } from "../character-builder";
import { Suspense } from "react";

export default function CharactersPage() {
  return <Suspense fallback={null}><CharacterBuilder /></Suspense>;
}
