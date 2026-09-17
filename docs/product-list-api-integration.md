# PL-2·PL-3 실제 API 연결 준비 (#52)

2026-09-17 기준. 이 문서는 #48 / #49의 연동 보류 결정 이후 **FE 연결 코드의 준비 범위**를 기록한다. 실제 BE·배포 인프라에 접속하여 검증한 결과가 아니다. 기존 GNB·메가패널·PD 분류·URL과 AI 상세페이지는 변경하지 않는다.

확인 소스: [FE dev 0858acb](https://github.com/Jangingmall/frontend/tree/0858acb1f0542bf8bbef44fb81ee0d4d6b7d9636), [BE develop abd42e3](https://github.com/Jangingmall/backend/tree/abd42e32b6f4e7ccc1faa6cc58452b44cbedf43f), [Notion API](https://app.notion.com/p/API-3c29e3e335cc80d08a26e8b864d43f7f).

## 완료 범위와 기본 동작

- MSW 모드에서는 기존 UI·요청·응답 및 모의 데이터를 유지한다.
- 실제 API 모드에서는 `NEXT_PUBLIC_PRODUCT_LIST_API`를 비워 두는 것이 기본이다. 이때 목록·분류·소재·종목 API 함수는 네트워크 요청 전에 `PRODUCT_LIST_API_NOT_READY` 오류를 반환한다. 화면은 기존 오류 상태를 사용한다. 같은 목록 API를 사용하는 홈 상품 섹션에도 적용된다.
- BE·인프라 준비 후 검증 환경에서 `NEXT_PUBLIC_API_MOCKING`을 비우고 `NEXT_PUBLIC_PRODUCT_LIST_API=enabled`로 **다시 빌드**하면 준비한 실서버 경로를 확인할 수 있다. 아래 계약 점검과 실서버 검증 전 운영 환경에는 활성화하지 않는다.
- 종목 UI·요청·URL 복원·SEO는 같은 활성화 조건을 사용한다. 선택지의 요청과 TanStack Query key에는 현재 분류가 함께 들어간다.
- 서버는 기존 `API_BASE_URL` 및 ISR 태그를, 브라우저는 기존 same-origin `/api` 프록시와 `AbortSignal`을 사용한다. 새 프록시·인증·배포 구조는 만들지 않는다.

## 실제 BE 코드에 맞춰 구현한 부분

| 항목          | 처리                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| 페이지 요청   | 화면/URL은 1부터, 실제 요청은 `page - 1`부터. 기존 `size` 유지                                                     |
| 페이지 응답   | Spring Page의 `content`, `number`, `size`, `totalElements`, `totalPages` 검증. 화면 정보는 요청값 대신 응답값 사용 |
| 상품          | `productId → id`, `title → name`, `price`, `status` 변환. 공개 상태 `ON_SALE` / `SOLD_OUT`만 수용                  |
| 이미지        | `thumbnailUrl`을 직접 표시. 임의 imageId·320/640/1280 variant를 생성하지 않음                                      |
| 미제공 데이터 | 장인명·평점·후기 수·배지는 `null`. 미제공 후기 수를 0건으로 읽어 주지 않음                                         |
| 선택지 형태   | 분류는 명세의 `{code,name}`와 기존 `{categoryId,name}` 모두 수용. 소재는 `{code,name}`와 기존 `string[]` 모두 수용 |

`artisanName`, `rating`, `reviewCount`, `primaryBadge`는 제공되는 경우에만 표시하는 준비용 선택 필드다. 현재 BE 목록 DTO는 이 필드를 제공하지 않는다. 카드에 공예 종목명을 추가할 필요는 없다. 현재 BE의 `colors: string[]`에는 화면용 HEX가 없으며, 코드별 색상 팔레트가 합의되지 않아 실제 모드의 색상 칩은 보류한다. 기존 MSW 색상 칩은 유지한다.

페이지 조회 API를 새로 추가하거나, FE의 임시 필드 이름·중첩 형태에 맞춰 BE DTO를 전부 바꾸도록 요청하지 않는다. 목록 찜 mutation과 판매자 등록/수정 API 확장은 이 작업에 포함하지 않는다.

## BE와 확인할 준비용 계약

아래는 구현 완료된 BE 계약이 아니다. 현재 코드와 명세의 차이를 남기고, FE의 변경 위치를 좁혀 놓은 것이다.

| API                               | 현재 BE                                                                  | 준비한 FE 경로 / 남은 확인                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/products`               | Pageable을 받아 `ON_SALE`만 조회. 화면용 필터 및 6개 정렬 enum 처리 없음 | `category`, 반복 `subcategory`·`material`, `minPrice`, `maxPrice`, `hasGiftWrap`, `excludeSoldOut`, 6개 정렬 enum을 직렬화. BE 처리와 OR/AND 의미·전체 건수 확인 필요 |
| `GET /api/products/categories`    | 도자기·옹기 등 기존 공예 분류                                            | 응답 이름을 기존 GNB의 PD 이름과 연결하고 반환된 코드/ID를 요청에 사용. 대분류와 소분류 각각의 코드 제공 방식 확인 필요                                               |
| `GET /api/products/subcategories` | 다완·찻잔 등 **품목**을 전체 조회                                        | 현재 경로에 `category` 조건과 `{code,name}` 공예 **종목** 응답을 가정한 준비 코드. endpoint 재사용 여부와 종목 의미를 먼저 확정해야 함                                |
| `GET /api/products/materials`     | 숫자 `subcategoryId`를 받고 소재 이름 배열 반환. 조건 없으면 빈 배열     | 명세 기준 `category` 조건으로 준비. PD 분류를 받는 최종 파라미터가 `subcategoryId`로 유지되면 해당 직렬화만 수정. 이름 배열 유지 가능                                 |

종목끼리 OR, 소재끼리 OR, 분류·종목·소재·가격·포장·품절 조건 사이 AND를 기대한다. FE가 여러 단일 필터 요청의 결과를 합쳐 정렬·페이지·전체 건수를 대신하지 않는다. PL-2는 하위 분류 단일 이동, 가격은 하나의 최소/최대 구간이다.

현재 Spring 기본 `sort`가 존재한다고 해서 `POPULAR`, `SALES_COUNT`, `WISHLIST_COUNT` 등이 구현된 것은 아니다. 실제 확인 전 enum을 보내는 설정을 켜지 않는다. 소재·포장 조건에 사용할 상품 데이터의 저장/공급 경로도 확인하되, 판매자 API 변경을 자동으로 요구하지 않는다.

### PD 분류 연결

- 화면의 계층과 URL은 `GNB_CATEGORIES` / `toGnbCategoryCode`에서 가져온다. 그 파일을 수정하지 않는다.
- `키친 · 다이닝`과 `키친·다이닝`처럼 가운데점 주위 공백만 정규화한다. 유사한 이름을 임의로 같은 분류로 취급하지 않는다.
- 실제 응답의 `code` 또는 `categoryId`를 `ProductCategory.apiCode`로 보관하고 요청할 때 변환한다. MSW의 `kitchen`·`kitchen-1` 또는 숫자 종목 1~6은 운영 매핑에 쓰지 않는다.
- 매핑되지 않은 분류는 `PRODUCT_CATEGORY_NOT_MAPPED`로 중단한다. 조건을 지운 전체 상품 조회로 대체하지 않는다. 대분류 아래 상품을 포함시키는 조회는 BE가 담당한다.
- 설명은 미제공 시 생략한다. 계층은 GNB 정의, 가격 슬라이더 범위는 FE의 1천~999만 원 표시 범위를 사용한다. `description`·`parentId`·가격 집계 필드를 BE에 새로 요구하지 않는다.

## 최종 계약에 따라 수정할 위치

| 변경                                | 파일                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- |
| 분류·복수 필터·정렬·페이지 파라미터 | `src/api/products/query.ts`                                             |
| 종목 endpoint / 소재의 분류 조건    | `src/api/products/client.ts`의 `fetchProductCrafts` / `getOptionSearch` |
| 응답 필드 형태                      | `src/api/products/backend-validation.ts`                                |
| 상품 표시 / PD 분류 코드 매핑       | `src/api/products/backend-mapper.ts`                                    |
| 운영 준비 제한 및 종목 활성화 조건  | `src/api/products/integration.ts`, `src/lib/env.ts`                     |

환경 변수만 채우면 현재 BE에 바로 연동 완료된다는 의미가 아니다. 위 준비용 계약이 BE 확정안과 다르면 이 위치에서 맞춘 후 검증한다.

## 인프라 준비 후 확인

1. BE의 실제 base URL을 서버 환경 변수 `API_BASE_URL`에 설정하고, 브라우저 `/api` 프록시와 서버의 직접 요청이 같은 BE를 가리키는지 확인한다. 실제 토큰·시크릿은 커밋하지 않는다.
2. PD 분류 코드·상품 매핑, 종목 endpoint의 의미, 소재 분류 조건, 복수 필터·정렬을 확인하여 준비용 계약과 다른 부분을 맞춘다.
3. 검증 환경에서 MSW를 끄고 상품 목록 설정을 켠 뒤 다시 빌드한다.
4. GNB에서 PL-2·PL-3 진입, 대분류 하위 포함, 종목/소재 복수 조합, 가격·포장·품절, 6개 정렬을 확인한다.
5. 첫/중간/마지막/빈 페이지와 전체 건수, 서버 초기 조회와 브라우저 조회의 일치를 확인한다.
6. 선택지의 분류 전환·요청 취소, 초기화, 직접 URL·새로고침·뒤로/앞으로 가기를 확인한다.
7. 실제 상품 이미지·장인명·평점·색상 누락 정책을 확인한다. 통과 후 운영 배포를 별도로 진행한다.

## 로컬 검증의 의미

`backend.test.ts`는 실제 BE DTO 형태의 **로컬 샘플**과 명세 기반 **준비용 선택지 샘플**을 MSW로 전달하여 서버·브라우저 fetch → 응답 봉투 → 검증 → 변환을 검사한다. BE의 필터 SQL·배포 인프라가 동작한다는 증거가 아니다. 실제 BE 검증은 위 체크리스트로 남겨 둔다.

2026-09-17 로컬 결과: 타입·린트·포맷 검사, 단위/컴포넌트 90개 파일·545개 테스트, 실제 API 기본 비활성 프로덕션 빌드 통과. MSW 프로덕션 서버의 홈·목록 E2E 8개 통과. Windows에서 테스트 완료 후 서버 종료가 지연되어 이번 테스트의 3198 서버만 확인·종료했으며 runner 종료 코드는 0이다.
