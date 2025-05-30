import { TShirtSize, pointsMapping } from "@shared/schema";

export const tshirtSizes = [
  { value: TShirtSize.XS, label: "XS", points: pointsMapping.XS },
  { value: TShirtSize.S, label: "S", points: pointsMapping.S },
  { value: TShirtSize.M, label: "M", points: pointsMapping.M },
  { value: TShirtSize.L, label: "L", points: pointsMapping.L },
  { value: TShirtSize.XL, label: "XL", points: pointsMapping.XL },
  { value: TShirtSize.XXL, label: "XXL", points: pointsMapping.XXL },
];
