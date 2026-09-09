# 라우팅과 인증

> **원본**: 노션 [라우팅](https://app.notion.com/p/e44ecddcc9cb8297beb201ace1430247) + BE 레포 `docs/PHASE2-2_인증_정책_계약서.md`
> **기준일**: 2026-09-08
> **상태**: 재구성 초안 (설계 진행 중)
> **관련 문서**: [architecture.md](architecture.md) · [data-layer.md](data-layer.md) · [isr.md](isr.md) · [ui-system.md](ui-system.md)

## 1. URL 설계 원칙

- 구매자 공개 영역은 루트 아래, 판매자 영역은 `/seller` 아래에 둔다.
- 리소스 ID가 있는 상품·장인·주문은 dynamic segment를 사용한다.
- 검색·필터·정렬·`page`처럼 새로고침·뒤로가기·공유에서 보존할 상태는 search parameter로 관리한다.
- 경로는 소문자 kebab-case, 프론트 query parameter는 camelCase를 쓴다.
- trailing slash는 사용하지 않고 대표 URL로 정규화한다.
- hash는 페이지 내 앵커만을 위해 사용한다.
- 이메일·주소·토큰·결제 정보는 URL에 넣지 않는다.

## 2. Route Map

### 2.1 공개 · 구매자

| 화면              | 경로                                                                                        | 접근 · 핵심 계약                                                  |
| ----------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 홈                | `/`                                                                                         | 공개                                                              |
| 검색              | `/search?q=`                                                                                | 공개                                                              |
| 상품 목록         | `/products`                                                                                 | 공개. `category`, `sort`, `filter`, `page`                        |
| 상품 상세         | `/products/[slug]-[productId]`                                                              | 공개. `productId`로 API 조회                                      |
| 장인 목록         | `/artisans`                                                                                 | 공개. `certificationLevel`, `category`, `initial`, `sort`, `page` |
| 장인 상세         | `/artisans/[slug]-[artisanId]`                                                              | 공개. `artisanId`로 API 조회                                      |
| 장바구니          | `/cart`                                                                                     | 비회원 허용, 독립 페이지                                          |
| 결제              | `/checkout/[orderId]`                                                                       | 로그인 필요                                                       |
| 주문 완료         | `/checkout/[orderId]/complete`                                                              | 로그인 + 본인 주문 확인                                           |
| 마이페이지        | `/mypage`                                                                                   | `/mypage/orders`로 redirect                                       |
| 주문·후기·찜      | `/mypage/orders`, `/mypage/reviews`, `/mypage/favorites`                                    | 로그인 필요                                                       |
| 계정 관리         | `/mypage/addresses`, `/mypage/payment-methods`, `/mypage/personal-info`, `/mypage/settings` | 로그인 필요                                                       |
| 로그인 · 회원가입 | `/login`, `/signup`                                                                         | 내부 상대 `returnUrl`만 허용 (§6)                                 |
| 고객센터          | `/support`                                                                                  | 공개. `section=faq \| shipping-returns \| dispute`                |

### 2.2 판매자

| 화면               | 경로                   | 접근 · 핵심 계약                                  |
| ------------------ | ---------------------- | ------------------------------------------------- |
| 판매자 진입        | `/seller`              | `ARTISAN` 권한. `/seller/products/new`로 redirect |
| AI 상세페이지 제작 | `/seller/products/new` | `ARTISAN` 권한. 입력 → 생성 → 편집 → 승인·게시    |

## 3. Dynamic Segment와 URL 상태

- 상품 상세 `/products/[slug]-[productId]`, 장인 상세 `/artisans/[slug]-[artisanId]` — `slug`는 표시·SEO용, API 조회 기준은 ID.
- 한글 slug를 허용한다. 현재 이름과 slug가 다르면 ID로 조회하고 현재 slug의 canonical URL로 정규화한다(§8).
- 주문은 `/checkout/[orderId]`와 완료 경로를 사용한다.
- 상품 목록 sort URL 표현: `popular`, `newest`, `wishlist`, `sales`, `price-asc`, `price-desc` (기본 `popular`). API enum(`POPULAR` 등) 매핑은 API 계층에서 한다.
- 장인 목록 sort URL 표현: `popular`, `most-products`, `recently-joined` (기본 `popular`) → API enum `POPULAR`, `MOST_PRODUCTS`, `RECENTLY_JOINED`.
- 찜·최근 본 상품 탭: `tab=wishlist \| recent` (기본 `wishlist`).
- 목록 페이지네이션은 번호 방식이다. `page`는 search parameter(`?page=3`)로 관리하고, 데이터 계층은 `useQuery` + `page` + `keepPreviousData`로 조회한다(→ [data-layer.md](data-layer.md) §6.7). 무한 스크롤은 쓰지 않는다.

## 4. 인증 라이프사이클

BE 계약([PHASE2-2 인증 정책 계약서](https://github.com/Jangingmall/backend/blob/main/docs/PHASE2-2_%EC%9D%B8%EC%A6%9D_%EC%A0%95%EC%B1%85_%EA%B3%84%EC%95%BD%EC%84%9C.md)) 기준.

| 항목           | 내용                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 인증 방식      | JWT                                                                                                                                  |
| Access Token   | 30분. `Authorization: Bearer {accessToken}` 헤더. **브라우저 메모리 저장** (LocalStorage 금지)                                       |
| Refresh Token  | 1주. **HttpOnly Cookie**. `POST /api/member/token/refresh`로만 사용                                                                  |
| 로그인         | `POST /api/member/login` → access는 응답 body(메모리), refresh는 Set-Cookie                                                          |
| OAuth          | `GET /api/member/oauth2/{kakao\|google}` → 최초 로그인 시 `POST /api/member/oauth2/complete-profile`로 추가 정보 입력 후 `USER` 부여 |
| 부팅·새로고침  | 메모리가 비므로 앱 시작 시 **silent refresh 1회** 시도 → 성공 시 세션 복원, 실패 시 비로그인 시작                                    |
| 요청 중 만료   | 401 → 클라이언트 fetcher가 refresh(single-flight) 후 원요청 1회 재시도 → refresh도 실패 시 로그아웃 처리                             |
| 로그아웃       | `POST /api/member/logout` (서버 refresh 무효화) → 메모리 access 제거 + Query 캐시 클리어                                             |
| `ARTISAN` 전환 | `POST /api/member/artisans/applications` → `ADMIN` 승인 후 role 전환                                                                 |

### 4.1 인증 상태 저장 — `stores/auth.ts` (Zustand)

`stores/`의 첫 사용 사례. persist하지 않는다(메모리 유지가 요구사항).

```ts
type Role = "USER" | "ARTISAN" | "ADMIN";

interface AuthState {
  status: "loading" | "authenticated" | "anonymous";
  accessToken: string | null;
  user: { id: number; roles: Role[]; name: string } | null;
  setSession: (token: string, user: AuthState["user"]) => void;
  clear: () => void;
}
```

- `lib/http/client.ts`가 `useAuthStore.getState().accessToken`을 동기로 읽어 헤더에 주입한다. 401 refresh 성공 → `setSession`, 실패 → `clear`.
- 세부 fetcher 동작은 [data-layer.md](data-layer.md) §4.2.

**user 정보 출처** — BE `member` 모듈 미구현. **경우 B(토큰만)로 가정하고 구현한다.**

- `POST /api/member/login` → `{ accessToken }` → 이어서 `GET /api/member/me`로 user를 채운다.
- 부팅 silent refresh도 `refresh()` → `GET /api/member/me` 2단계.
- `status`는 토큰 + user가 모두 확보돼야 `authenticated`로 전환한다(중간엔 `loading` 유지). 401 자동 refresh 후에는 토큰만 갱신되므로 `GET /api/member/me`를 다시 호출하지 않는다.
- BE가 login/refresh 응답에 `user`를 포함해 주면(경우 A) `GET /api/member/me` 호출을 제거하고 `setSession(token, user)` 한 스텝으로 단순화한다.

### 4.2 부팅 silent refresh — 하이브리드

- 루트 클라이언트 프로바이더가 마운트 시 refresh를 트리거한다. **렌더는 막지 않는다.**
- 공개 페이지는 `status`가 `loading`이어도 즉시 렌더한다. 헤더의 인증 영역만 `loading` 동안 스켈레톤으로 두고, 확정 후 로그인/프로필로 전환한다.
- 보호 라우트는 `(protected)` layout이 `loading` 동안 로딩 UI를 보여주므로 내부 컴포넌트는 어중간한 상태를 보지 않는다(§5).
- refresh 호출은 부팅 1회 + 이후 401 트리거로만.

### 4.3 쿠키와 CORS

- FE·BE는 same-origin이다. Vercel rewrite가 `/api/*`를 백엔드로 전달하므로(§7) 브라우저에서 보면 동일 출처다. 별도 CORS 설정·preflight이 필요 없다.
- refresh 쿠키(HttpOnly): BE는 `Set-Cookie: HttpOnly; Secure; SameSite=Lax; Path=/` (host-only, `Domain` 미설정). refresh는 POST라 `SameSite=Lax`로 충분하다.
- FE fetch: refresh(`POST /api/member/token/refresh`) 호출만 `credentials: "same-origin"`. Bearer 토큰을 쓰는 그 외 요청은 쿠키가 필요 없어 기본값을 쓴다.

## 5. 보호 라우트 — route group + layout 가드

미들웨어(Next.js 16의 `proxy`)는 인증에 쓰지 않는다(§7). access token이 메모리에만 있어 서버·엣지에서 읽을 수 없으므로 접근 제어는 **클라이언트 사이드 가드**로 한다.

```
src/app/
  (protected)/
    layout.tsx          # 로그인 가드
    mypage/...
    checkout/[orderId]/...
  (seller)/
    layout.tsx          # 로그인 + ARTISAN 가드
    seller/...
  products/...          # 그룹 밖 = 공개
```

- route group `(...)`은 URL에 반영되지 않는다. `/mypage/orders`의 실제 경로는 그대로다.
- 보호가 필요한 페이지는 해당 그룹 폴더 안에 둔다. 페이지마다 가드 훅을 호출하지 않는다.

### 5.1 `(protected)/layout.tsx`

```tsx
"use client";
export default function ProtectedLayout({ children }: PropsWithChildren) {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") return <FullPageLoading />;
  return <>{children}</>;
}
```

### 5.2 `(seller)/layout.tsx`

로그인 가드 + role 검사. 권한 부족은 **리다이렉트하지 않고** 403 안내를 렌더한다.

```tsx
const { status, user } = useAuthStore();
if (status === "authenticated" && !user!.roles.includes("ARTISAN")) {
  return <ForbiddenNotice />; // components/common/
}
```

### 5.3 인증·인가 예외 처리

| 상황                               | 처리                                               |
| ---------------------------------- | -------------------------------------------------- |
| 비로그인의 보호 경로 접근          | `/login?returnUrl=...`으로 이동                    |
| 로그인한 비판매자의 `/seller` 접근 | 403 권한 안내, 리다이렉트 없음                     |
| 로그인·회원가입 완료               | 검증된 내부 `returnUrl` 또는 `/mypage`로 이동 (§6) |
| 로그아웃                           | 인증 필요 경로면 `/`, 공개 경로면 현재 페이지 유지 |
| 주문 완료 직접 접근                | 로그인 후 `returnUrl` 복귀, 본인 주문만 노출       |
| 존재하지 않거나 비공개 상품        | `not-found` (404)                                  |
| 판매 중지 상품                     | 상세는 노출, 구매 기능 비활성화                    |
| 존재하지 않는 장인                 | `not-found` (404)                                  |
| 활동 중지 장인                     | 정책 미정 (§9)                                     |

## 6. returnUrl 검증

`/login?returnUrl=...`을 검증 없이 사용하면 open redirect 취약점이 된다. **소비하는 쪽**(`/login` 성공 콜백, OAuth 콜백)에서만 검증한다. 가드가 생성하는 `returnUrl`은 항상 내부 pathname이라 별도 검증이 필요 없다.

`lib/auth/return-url.ts`:

```ts
export function safeReturnUrl(
  raw: string | null,
  fallback = "/mypage",
): string {
  if (!raw) return fallback;
  let value: string;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  if (!value.startsWith("/")) return fallback; // 상대 경로만
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback; // protocol-relative 차단
  if (value.includes("\\")) return fallback;
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(value)) return fallback; // "/https:..." 류
  return value;
}
```

- 화이트리스트 prefix는 두지 않는다. 내부 경로면 어디든 복귀를 허용한다.
- 검증 실패 시 `/mypage`로 폴백한다.

## 7. Proxy (구 Middleware)

Next.js 16부터 Middleware는 **Proxy**로 이름이 바뀌었고 루트(또는 `src/`)의 `proxy.ts`에 둔다. 라우팅 목적으로만 사용한다.

- 담당: trailing slash 정규화, slug canonical redirect, 색인 제어 헤더.
- **`/api/*` → 백엔드 rewrite.** same-origin을 만들기 위한 플랫폼 rewrite(`vercel.json` 또는 `next.config`)다. 코드로 된 BFF가 아니라 투명한 passthrough이므로 "일반 REST proxy/BFF는 만들지 않는다"(§8) 원칙과 무관하다.
- **인증 로직을 넣지 않는다.** access token이 메모리에 있어 proxy가 읽을 수 없다. same-origin이라 proxy(Node 런타임)가 HttpOnly refresh 쿠키를 읽는 것 자체는 가능하지만, 존재 여부만으로 유효성·role을 판단할 수 없으므로 접근 제어는 클라이언트 가드(§5)가 담당한다.
- `fetch`의 `cache`/`next.revalidate`/`next.tags`는 proxy에서 무효다. 느린 데이터 조회를 하지 않는다.
- (후속) 보호 페이지 로딩 깜빡임이 실측상 문제가 되면, refresh 쿠키 존재 여부만 보는 optimistic pre-filter를 `(protected)` 대상으로 추가할 수 있다. BE `Set-Cookie` 쿠키 이름 확정이 필요하고, role 검사는 여전히 클라이언트가 한다.

## 8. SEO와 렌더링 경계

- 전체 상품 목록과 주요 카테고리는 색인을 허용한다.
- 필터·정렬 조합 URL은 색인을 제한하고 대표 목록 또는 카테고리 URL을 canonical로 둔다.
- `?page=2` 이후 페이지는 대표 목록(`?page` 없음)으로 canonical을 두거나 shallow index만 허용한다 (택1, §9).
- 공개 상품·장인 상세의 대표 URL은 최신 slug를 사용한다. 다른 slug로 들어오면 canonical URL로 정규화한다.
- 목록·상세의 loading은 route 수준과 component-level Suspense를 구분한다.
- 공개 데이터의 서버 조회·ISR 재검증 경계는 [isr.md](isr.md).
- 일반 REST API proxy/BFF는 만들지 않는다. `POST /api/revalidate`만 ISR webhook route handler다.

## 9. 미확정 / 후속

| 항목                              | 내용                                                                                                                                                 | 해소 조건                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| login·refresh 응답의 user 포함    | 현재 경우 B(토큰만 + `GET /api/member/me`)로 구현. BE가 응답에 `user { id, roles: Role[], name }`를 포함하면 경우 A로 단순화. roles 배열 형식도 확인 | BE member 모듈 구현       |
| same-origin rewrite 대상          | `vercel.json`/`next.config`의 `/api/*` rewrite 대상 백엔드 origin                                                                                    | 인프라 도메인 확정        |
| `?page=N` SEO                     | shallow index 허용 vs page 1로 canonical                                                                                                             | 결정 필요                 |
| 보호 페이지 optimistic pre-filter | 깜빡임이 실측상 문제면 proxy에 refresh 쿠키 존재 체크 추가                                                                                           | 관찰 후                   |
| 활동 중지 장인 상세 공개          | 현재 FE는 `404`. PM이 개념 도입 → BE 필드 → FE 분기                                                                                                  | PM 확정 (routing.md R-13) |
| 결제·주문 완료 세부 IA            | cart→order 생성 시점, 토스 위젯 `successUrl`/`failUrl` 흐름, `confirm` 실패 처리, `complete` 가드, 이탈 처리                                         | 별도 "결제 플로우 설계"   |
