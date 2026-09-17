import { publicEnv } from "@/lib/env";
export function canUseProductCrafts() {
  return publicEnv.apiMocking;
}
export function canUseProductMaterials() {
  return publicEnv.apiMocking;
}
