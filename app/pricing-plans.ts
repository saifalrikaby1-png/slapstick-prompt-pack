export const pricingPlans = [
  { id: "starter", name: "Starter", monthlyPrice: "$4.99", allowance: "10 Full Production Packs per month", costPerPack: "Approx. $0.50 per full pack", description: "For creators beginning their AI-video production workflow.", featured: false },
  { id: "creator", name: "Creator", monthlyPrice: "$11.99", allowance: "35 Full Production Packs per month", costPerPack: "Approx. $0.34 per full pack", description: "For active creators producing new short-form videos every week.", featured: true },
  { id: "studio", name: "Studio", monthlyPrice: "$19.99", allowance: "60 Full Production Packs per month", costPerPack: "Approx. $0.33 per full pack", description: "For channels and small studios producing at higher volume.", featured: false },
  { id: "pro", name: "Pro", monthlyPrice: "$29.99", allowance: "120 Full Production Packs per month", costPerPack: "Approx. $0.25 per full pack", description: "For professional creators managing multiple active productions.", featured: false },
] as const;

export const pricingFeatureLine = "All seven styles · Character Builder · Identity locks · Quality Control · export";
