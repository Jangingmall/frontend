# 코드 컨벤션

> **원본**: 노션 「Git & Code Convention」 4장
> **기준일**: 2026-09-08
> **상태**: 재구성 초안
> **관련 문서**: [architecture.md](architecture.md) · [git-convention.md](git-convention.md) · [testing.md](testing.md) · [ui-system.md](ui-system.md)

## 1. 목적과 범위

Next.js와 TypeScript 코드를 작성하는 규칙을 정의한다. 형식 정리는 Prettier, 규칙 검사는 ESLint가 담당하며, 이 문서는 도구가 강제하지 않는 판단 기준을 다룬다.

- 코드 배치·디렉터리 책임 → [architecture.md](architecture.md)
- 브랜치·커밋·PR 규칙 → [git-convention.md](git-convention.md)
- 테스트 파일 네이밍·규칙 → [testing.md](testing.md)
- 클래스 작성·`cn()`/`cva` 패턴 등 스타일 → [ui-system.md](ui-system.md)

## 2. 네이밍 규칙

| 대상                | 규칙                                            | 예시                     |
| ------------------- | ----------------------------------------------- | ------------------------ |
| 변수·함수           | camelCase, 함수는 동사로 시작                   | `getUser`, `handleClick` |
| Boolean 변수        | `is`, `has`, `can` 등으로 시작                  | `isLoading`, `hasError`  |
| 이벤트 핸들러       | `handle` prefix                                 | `handleSubmit`           |
| 이벤트 핸들러 Props | `on` prefix                                     | `onSubmit`               |
| 컴포넌트            | PascalCase, 파일명과 컴포넌트명 일치            | `UserCard.tsx`           |
| shadcn/ui 생성 파일 | `components/ui`에서 소문자 또는 kebab-case 허용 | `button.tsx`             |
| 상수                | UPPER_SNAKE_CASE                                | `MAX_RETRY_COUNT`        |
| 타입·인터페이스     | PascalCase                                      | `UserProfile`            |
| 제네릭 타입         | 단일 대문자                                     | `T`, `K`, `V`            |
| 커스텀 훅           | `use` prefix                                    | `useAuth`                |

- 의미를 파악하기 어려운 약어는 사용하지 않는다. `btn` → `button`, `usr` → `user`.
- TypeScript `enum` 사용은 지양하고 `as const` 객체와 유니온 타입을 우선한다.

## 3. 파일·폴더 규칙

| 대상                | 규칙                                           | 예시                                                             |
| ------------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| 폴더                | 소문자 기본, 여러 단어는 kebab-case            | `user-profile/`, `api/revalidate/`                               |
| Next.js 컨벤션 파일 | Next.js 기본 파일명 사용                       | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts` |
| 팀 작성 컴포넌트    | PascalCase, 파일명과 컴포넌트명 일치           | `UserCard.tsx`                                                   |
| shadcn/ui 생성 파일 | `src/components/ui`에서 소문자 또는 kebab-case | `button.tsx`                                                     |
| 보조 모듈           | 소문자 기본, 여러 단어는 kebab-case            | `query-provider.tsx`, `api-error.ts`                             |
| 설정 파일           | 각 도구의 공식 파일명 사용                     | `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`        |

- 설정 파일과 Next.js 컨벤션 파일은 도구·프레임워크가 요구하는 경우 default export를 허용한다. 이는 §5의 named export 원칙에 대한 예외다.
- 테스트·Storybook 파일 네이밍은 [testing.md](testing.md)에서 정의한다.

## 4. Type과 Interface 사용 기준

**`type`을 사용하는 경우**

- 유니온·인터섹션·튜플 등 복합 타입
- `Partial<T>`, `Pick<T, K>` 등 유틸리티 타입 조합
- 함수 타입

**`interface`를 사용하는 경우**

- 컴포넌트 Props
- 클래스의 `implements`
- 외부 라이브러리 타입 확장과 선언 병합

## 5. 컴포넌트 규칙

- 함수형 컴포넌트만 사용한다.
- 컴포넌트당 하나의 파일을 사용한다.
- Props 타입은 `interface`로 정의하고 구조 분해 할당으로 사용한다.
- 기본적으로 named export를 사용한다. `page.tsx`, `layout.tsx` 등 Next.js 컨벤션 파일만 default export를 허용한다.
- 로직이 복잡하거나 재사용이 필요하면 커스텀 훅으로 분리한다.

## 6. Server Component와 Client Component

- 기본적으로 Server Component를 사용한다.
- 클라이언트 상태, 이벤트 핸들러, 브라우저 API가 필요한 경우에만 파일 상단에 `'use client'`를 선언한다.
- Client Component의 범위는 필요한 UI 경계까지 최소화한다.
- 서버에서 처리할 수 있는 데이터 요청·변환 로직을 불필요하게 클라이언트로 이동하지 않는다.

## 7. 주석 규칙

- 코드만으로 의도를 이해하기 어려운 경우에만 작성한다.
- 주석은 한국어로 작성한다.
- 후속 작업은 `TODO`, 알려진 문제는 `FIXME` 태그를 사용한다.
- 코드가 무엇을 하는지보다 왜 그렇게 구현했는지 설명한다.
