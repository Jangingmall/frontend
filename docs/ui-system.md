# UI 시스템

> **원본**: 노션 「디자인 토큰 통합」 + 「시스템 아키텍처」 2.2
> **기준일**: 2026-09-08
> **상태**: 재구성 초안 (토큰 foundation은 `src/app/globals.css`에 반영됨. 컴포넌트 상세는 별도 브랜치 진행 중)
> **관련 문서**: [architecture.md](architecture.md) · [conventions.md](conventions.md) · [data-layer.md](data-layer.md) · [routing-and-auth.md](routing-and-auth.md)

## 1. 목적과 범위

디자인 토큰 통합 원칙, 공용 컴포넌트의 분류·책임·공용화 경계, 상태 표현 컴포넌트를 정의한다.

**다루지 않는 것**

- 컴포넌트별 props·variant·레이아웃·구현 코드 (별도 구현 설계)
- 실제 토큰 값 (`src/app/globals.css`가 SoT)
- 코드 배치·디렉터리 책임 → [architecture.md](architecture.md)
- 데이터 조회·에러 코드 매핑 체계 → [data-layer.md](data-layer.md)

## 2. 전제

- PD는 Figma 변수 기반 디자인 시스템을 제공한다. PD 컴포넌트 라이브러리는 제공하지 않는다.
- FE는 필요한 shadcn/ui 컴포넌트를 추가하고 PD 디자인에 맞게 수정해 쓴다. 설정: `style: base-nova`, `baseColor: neutral`, `iconLibrary: lucide` (`components.json`).
- Figma Variables REST API 자동 동기화는 쓰지 않는다. Figma 변수와 FE 토큰은 수동으로 매핑·갱신한다.

## 3. 디자인 토큰

### 3.1 토큰 계층

| 계층              | 책임                                                                       |
| ----------------- | -------------------------------------------------------------------------- |
| Figma 디자인 토큰 | PD가 관리하는 디자인 값·기준                                               |
| FE 원시 토큰      | Figma 원시 토큰을 코드 환경 이름으로 매핑한 값                             |
| FE semantic token | 화면·컴포넌트가 사용할 UI 의미. 원시 토큰을 참조                           |
| Tailwind CSS      | FE 토큰을 유틸리티 사용 방식으로 연결 (v4 `@theme`, `src/app/globals.css`) |
| shadcn/ui         | 접근성·기본 동작의 기반. 수정된 프로젝트 버전이 FE 사용 기준               |

```
Figma: primitive-colors/neutral-colors/50
  → FE 원시 토큰: --color-neutral-50
  → FE semantic token: --surface-subtle
  → Tailwind 사용: bg-surface-subtle
```

Figma 변수명과 FE 토큰명은 1:1 문자 일치를 요구하지 않는다. 의미·값·별칭·모드가 같은지를 기준으로 대응한다.

### 3.2 사용 원칙

- semantic token이 존재하면 Base·Shared·화면 구현 모두 semantic token을 우선 사용한다.
- semantic token이 아직 정리되지 않은 경우에만 Figma에서 매핑한 FE 원시 토큰을 임시로 사용한다.
- **화면에서 임의의 색상·간격·크기 값을 직접 쓰지 않는다** (Tailwind arbitrary value `text-[13px]`, `bg-[#fff]` 지양). 예외가 필요하면 semantic token 후보로 검토한다.
- 같은 원시 토큰이 여러 곳에서 같은 UI 의미로 반복되면 semantic token 후보로 검토한다.
- 컴포넌트 전용 토큰은 기본 구조로 도입하지 않는다. PD가 전용 변수를 제공하거나 컴포넌트 내부 독립 규칙이 실제로 필요할 때만, 원시 토큰이 아닌 semantic token을 참조해 도입한다.

### 3.3 `@theme` 등록 규칙 (`src/app/globals.css`)

- **텍스트 스타일**: Figma named text style → `--text-<name>` (+ `--line-height`, `--font-weight` 서브키). 예: `--text-title-l`. letter-spacing은 전부 0%라 건드리지 않는다. 폰트는 전체 Pretendard라 지정하지 않는다.
- **그림자**: Figma "Drop Shadow" → Tailwind `--shadow-*` (box-shadow). 용도명으로 등록 (`--shadow-floating` 재사용, `--shadow-nav` Nav 전용).
- **컨테이너·그리드**: Tailwind 기본 스케일로 커버되는 값은 새로 등록하지 않는다. 없는 값만 등록 (`--container-desktop: 90rem`). 그리드는 현재 desktop만 정의. tablet/mobile 추가 시 같은 브레이크포인트 이름 규칙으로 확장한다.
- 다크 모드는 `@custom-variant dark (&:is(.dark *))`.

### 3.4 변경 반영 흐름

```
PD Figma 변수 변경·게시
  → FE가 변경 변수와 semantic token 매핑 확인
  → FE 토큰 및 수정된 shadcn/ui 컴포넌트 반영
  → 실제 사용 화면에서 확인
```

담당자는 고정하지 않는다. 반영이 필요한 시점에 작업 가능한 사람이 처리한다.

## 4. 스타일 작성 규칙

- 클래스 병합은 `cn()` (`@/lib/utils` — `clsx` + `tailwind-merge`).
- variant가 있는 컴포넌트는 `class-variance-authority`(`cva`)로 정의한다.
- 클래스 정렬은 `prettier-plugin-tailwindcss`가 담당한다 (수동 정렬 금지).
- 반응형: 현재 desktop 우선. tablet/mobile 브레이크포인트는 PD 디자인이 나오면 확장한다.

## 5. 컴포넌트 분류

| 분류              | 정의                                                         | 배치                   |
| ----------------- | ------------------------------------------------------------ | ---------------------- |
| Base Components   | shadcn/ui를 토큰·서비스 디자인에 맞게 수정한 기반 요소       | `components/ui/`       |
| Shared Components | 도메인 비종속이며 반복되는 책임·상태·UX 규칙을 제공하는 요소 | `components/common/`   |
| Domain Components | 상품·장인·장바구니 등 서비스 도메인을 표현하는 요소          | `components/{domain}/` |

- 페이지는 route 수준 조합 단위이므로 분류에 포함하지 않는다 → [architecture.md](architecture.md) §5·6.
- shadcn/ui 기본 디자인을 그대로 쓰지 않는다. 화면·Shared는 수정된 프로젝트 버전을 쓴다.
- 지원 props·variant·size·상태는 PD 디자인과 구현 수요 확인 후 컴포넌트별 구현 설계에서 정한다.

### 5.1 Base Components — 확정 대상

| 대상          | 상태 | 비고                                  |
| ------------- | ---- | ------------------------------------- |
| `Button`      | 확정 | `src/components/ui/button.tsx` 반입됨 |
| `TextField`   | 확정 |                                       |
| `SearchField` | 확정 | `TextField` 확장·조합                 |
| `Skeleton`    | 확정 | §7                                    |
| `BoardRow`    | 보류 | 사용 방식 확인 후 Base 여부 확정      |

### 5.2 Shared Components — 승격 기준

다음을 만족할 때 Shared 후보로 검토한다.

- 서로 다른 화면·기능에서 같은 목적·UX를 제공한다.
- 상태·행동·접근성·반응형 규칙을 한 곳에서 통일할 가치가 있다.
- 지나친 예외 없이 역할을 설명할 수 있다.
- 특정 도메인 데이터 구조에 강하게 의존하지 않는다.

겉모양만 비슷하거나 화면별 예외가 많거나 도메인 데이터에 강결합이면 성급히 승격하지 않는다.

| 대상              | 상태 | 비고                                                                                     |
| ----------------- | ---- | ---------------------------------------------------------------------------------------- |
| `Header`          | 확정 | 인증 영역은 부팅 refresh 동안 스켈레톤 → [routing-and-auth.md](routing-and-auth.md) §4.2 |
| `Footer`          | 확정 |                                                                                          |
| `EmptyState`      | 확정 | §7                                                                                       |
| `ErrorState`      | 확정 | §7                                                                                       |
| `ForbiddenNotice` | 확정 | 403 권한 안내 → [routing-and-auth.md](routing-and-auth.md) §5.2                          |

## 6. 아이콘

- 디자인팀 제공 SVG 자산을 우선 사용한다. `src/assets/icons/`에 두고 `scripts/generate-icons.ts`로 React 컴포넌트를 생성한다.
- 공통 props·접근성·상호작용 규칙이 필요하면 `components/ui/`에서 감싼 컴포넌트를 제공한다.
- 디자인에 없는 아이콘이 실제로 필요해지면 `lucide` 사용 또는 별도 도입을 검토한다.

## 7. 상태 표현 컴포넌트

### 7.1 상태별 책임

| 상태                             | 처리                                           |
| -------------------------------- | ---------------------------------------------- |
| 데이터 로딩 중                   | `Skeleton` (Base)                              |
| 정상 응답이나 표시할 데이터 없음 | `EmptyState` (Shared)                          |
| 예상 가능한 FE·BE 오류           | `ErrorState` (Shared) 또는 입력·폼 인라인 오류 |
| 예기치 않은 렌더링 오류          | Next.js `error.tsx`                            |
| 존재하지 않는 공개 리소스        | Next.js `not-found`                            |
| 권한 부족                        | `ForbiddenNotice` (Shared)                     |

조회 에러를 `error.tsx`로 던질지 `ErrorState`로 인라인 처리할지의 기본값은 [data-layer.md](data-layer.md) §6.2.

### 7.2 Skeleton

- Base Component. placeholder의 공통 스타일·모션·접근성 규칙을 제공한다.
- shadcn/ui `Skeleton`을 토큰에 맞게 수정해 쓴다.
- 화면마다 다른 로딩 레이아웃(상품 카드/상세/장바구니 항목)은 각 화면이 공용 `Skeleton`을 조합해 만든다.

### 7.3 EmptyState

- Shared Component. 정상 조회·처리 결과 표시할 데이터가 없는 상황을 안내한다.
- 로딩·오류·404·권한 부족과 구분한다.
- 노출 조건과 상황별 안내·다음 행동은 페이지·기능 영역이 책임진다.

### 7.4 ErrorBoundary (`error.tsx`)

- 예기치 않은 렌더링 오류는 Next.js App Router `error.tsx`로 처리한다. 해당 route segment와 하위 UI의 렌더링 오류를 격리한다.
- 사용자에게 기술적 오류 상세를 노출하지 않고 fallback UI와 재시도 경로(`reset()`)를 제공한다.
- **REST 요청 실패, 입력 검증 실패, 404, 권한 부족처럼 예상 가능한 상태는 `error.tsx`의 책임이 아니다.**

**배치**

| 파일                   | 역할                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `app/global-error.tsx` | 루트 `layout.tsx` 자체 오류(프로바이더·폰트 로딩 실패)의 최후 fallback. 최소 마크업                          |
| `app/error.tsx`        | 전역 기본 fallback. 대부분의 페이지 렌더 오류를 여기서 처리. `ErrorState` 재사용 + `reset()`                 |
| segment별 `error.tsx`  | 맥락 전용 복구가 필요할 때만 추가 (예: 상품 상세의 "상품을 불러올 수 없어요 + 목록으로"). 없으면 상위로 버블 |

`(protected)`·`(seller)` route group에는 처음에는 `error.tsx`를 두지 않는다. 가드 layout이 로딩·리다이렉트를 처리하고, 페이지 렌더 오류는 `app/error.tsx`로 충분하다. 판매자 AI 제작처럼 복잡한 자체 복구가 필요해지면 그때 해당 폴더에 추가한다.

### 7.5 ErrorState

- Shared Component. 예상 가능한 FE·BE 오류를 일관된 구조로 안내한다.
- 오류 코드 → 사용자 안내 문구 매핑은 UI 컴포넌트만의 책임이 아니라 공통 오류 처리 체계에서 관리한다 → [data-layer.md](data-layer.md) §5.1. `constants/error-messages.ts` 골격은 `ErrorCode.java` 14개 + `status` fallback + `GENERIC`으로 지금 작성하고, 문구 카피 최종화만 서비스 톤·디자인 확정 후로 남긴다.
- 입력 검증처럼 필드 수준 오류는 Input·Form 인라인 오류로 표현한다. 모든 오류를 `ErrorState`로 통일하지 않는다.
- 오류 유형별 표현, 재시도·CTA는 디자인·구현 단계에서 정한다.

## 8. 미확정 / 후속

| 항목                         | 내용                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| tablet/mobile 브레이크포인트 | PD 반응형 디자인 제공 후 `@theme`에 브레이크포인트별 컨테이너·그리드 토큰 추가, mobile-first/desktop-first 방향 결정, 기존 desktop 컴포넌트 반응형 대응 일괄 |
| 접근성 기준                  | PD 자료 없음. `addon-a11y` 자동 검사만 보조. WCAG 목표 레벨·키보드 내비게이션·포커스 관리·aria 패턴·이미지 alt 정책은 MVP 이후 정의                          |
| 오류 문구 카피               | `error-messages.ts` 골격은 지금 작성. 최종 카피는 서비스 톤·디자인 확정 후, `BUSINESS_RULE_VIOLATION`/`CONFLICT`의 BE `message` 활용 케이스 정리             |

컴포넌트별 props·variant·size는 별도 구현 설계(`feat/design-system-*` 브랜치)에서, `error.tsx` 배치는 §7.4, 자동 시각 회귀는 도입하지 않음(§1)으로 각각 정리됨.
