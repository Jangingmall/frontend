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

/** 쓰임 분류(category)·소재(material)와 별개의 공예 종목. */
export interface ProductCraft {
  id: string;
  name: string;
}
