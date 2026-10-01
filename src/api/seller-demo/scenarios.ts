export type SellerDemoId = "1" | "2";
export function isSellerDemoId(value: string): value is SellerDemoId {
  return value === "1" || value === "2";
}
export const sellerDemoScenarios = {
  "1": {
    name: "청자 분청 찻잔",
    making:
      "물레로 빚고 귀얄로 백토를 발라 붓결을 남긴 뒤 청자빛 유약을 입혔습니다. 장작 가마에서 구워 잔마다 빛깔이 조금씩 다릅니다.",
    care: "첫 사용 전 미지근한 물에 헹궈 주세요. 전자레인지·식기세척기는 피하고 부드러운 스펀지로 손설거지해 주세요.",
    photo: "/seller-demos/1/hero.webp",
  },
  "2": {
    name: "전주 합죽선 매화선",
    making:
      "담양 왕대를 3년 건조한 뒤 손으로 깎아 뼈대를 만듭니다. 한지를 겹겹이 붙인 선면에 매화를 한 획씩 직접 그렸습니다.",
    care: "아래에서 위로 천천히 펼쳐 주세요. 사용 후에는 접어 직사광선과 습기를 피해 보관하고 물세척은 피해 주세요.",
    photo: "/seller-demos/2/photos/01-hero.png",
  },
} as const;
