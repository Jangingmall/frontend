export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  minPrice: number;
  maxPrice: number;
  /** 확정 매핑에 등록하고 BE 응답에 존재하는 코드/ID. 미매핑은 undefined. */
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
