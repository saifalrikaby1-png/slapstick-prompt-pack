export const pricingPlans = [
  { id: "starter", name: "Starter", monthlyPrice: "$4.99", allowance: "10 AI full packs", description: "A compact starting plan for exploring structured production packs.", featured: false },
  { id: "creator", name: "Creator", monthlyPrice: "$11.99", allowance: "30 AI full packs", description: "For creators developing a repeatable prompt-production workflow.", featured: true },
  { id: "pro", name: "Pro", monthlyPrice: "$19.99", allowance: "60 AI full packs", description: "For frequent production planning across multiple ideas and characters.", featured: false },
  { id: "studio", name: "Studio", monthlyPrice: "$32.99", allowance: "120 AI full packs", description: "For larger prompt-production workloads and organized creative libraries.", featured: false },
] as const;

export const pricingFeatureLine = "All seven styles · Character Builder · Identity locks · Quality Control · export";
