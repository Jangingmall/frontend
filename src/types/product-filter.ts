export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  minPrice: number;
  maxPrice: number;
  /** 운영 선택지 응답에서 받은 값. GNB URL과 별개이며 미매핑은 undefined. */
  apiCode?: string;
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
