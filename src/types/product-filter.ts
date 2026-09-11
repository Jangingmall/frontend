export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  minPrice: number;
  maxPrice: number;
}

export interface ProductMaterial {
  id: string;
  name: string;
}
