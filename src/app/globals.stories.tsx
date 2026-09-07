import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties, ReactNode } from "react";

/**
 * globals.css에 등록한 design foundation 토큰(primitive/semantic/component 색상, radius,
 * border, spacing, drop-shadow, typography, grid)을 한눈에 확인하기 위한 스토리다.
 * 실제 화면 컴포넌트가 아니라 토큰 자체를 보여주는 용도라 `component`는 지정하지 않는다.
 */
const meta = {
  title: "Foundation/Design Tokens",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 font-mono text-xs text-neutral-500">{label}</h3>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

/** 값을 var()로만 참조 가능한 토큰(primitive, component)용 — @theme에 등록하지 않아서
 * Tailwind 유틸리티 클래스가 없다. */
function VarSwatch({ label, varName }: { label: string; varName: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className="h-12 w-20 rounded-md border border-black/10"
        style={{ background: `var(${varName})` } as CSSProperties}
      />
      <span className="font-mono text-[10px] text-neutral-500">{label}</span>
    </div>
  );
}

/** @theme inline으로 노출해 실제 Tailwind 유틸리티 클래스가 생긴 토큰(semantic)용. */
function ClassSwatch({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className={`h-12 w-20 rounded-md border border-black/10 ${className}`}
      />
      <span className="font-mono text-[10px] text-neutral-500">{label}</span>
    </div>
  );
}

const coolGrey = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];
const jadeBlue = coolGrey;
const yellow = ["100", "200", "300", "400", "500"];
const red = ["300", "400", "500", "600", "700"];

export const Colors: Story = {
  render: () => (
    <div>
      <Section title="Primitive — 순수 값, @theme 미등록(var()로만 참조)">
        <Row label="white / black">
          <VarSwatch label="white" varName="--white" />
          <VarSwatch label="black" varName="--black" />
        </Row>
        <Row label="cool-grey-50~900">
          {coolGrey.map((step) => (
            <VarSwatch
              key={step}
              label={`cool-grey-${step}`}
              varName={`--cool-grey-${step}`}
            />
          ))}
        </Row>
        <Row label="jade-blue-50~900">
          {jadeBlue.map((step) => (
            <VarSwatch
              key={step}
              label={`jade-blue-${step}`}
              varName={`--jade-blue-${step}`}
            />
          ))}
        </Row>
        <Row label="yellow-100~500 (50 없음 — Figma Variables에 정의되지 않음)">
          {yellow.map((step) => (
            <VarSwatch
              key={step}
              label={`yellow-${step}`}
              varName={`--yellow-${step}`}
            />
          ))}
        </Row>
        <Row label="red-300~700">
          {red.map((step) => (
            <VarSwatch
              key={step}
              label={`red-${step}`}
              varName={`--red-${step}`}
            />
          ))}
        </Row>
      </Section>

      <Section title="Semantic — @theme inline으로 노출, bg-* 유틸리티로 사용 가능">
        <Row label="bg">
          <ClassSwatch label="bg-default" className="bg-bg-default" />
          <ClassSwatch label="bg-subtle" className="bg-bg-subtle" />
          <ClassSwatch label="bg-skeleton" className="bg-bg-skeleton" />
          <ClassSwatch label="bg-deam" className="bg-bg-deam" />
        </Row>
        <Row label="fill">
          <ClassSwatch label="fill-jade" className="bg-fill-jade" />
          <ClassSwatch
            label="fill-jade-impact"
            className="bg-fill-jade-impact"
          />
          <ClassSwatch label="fill-jade-weak" className="bg-fill-jade-weak" />
          <ClassSwatch label="fill-neutral" className="bg-fill-neutral" />
          <ClassSwatch
            label="fill-neutral-impact"
            className="bg-fill-neutral-impact"
          />
          <ClassSwatch
            label="fill-neutral-weak"
            className="bg-fill-neutral-weak"
          />
        </Row>
        <Row label="border (배경색으로 시각화)">
          <ClassSwatch
            label="border-neutral-solid"
            className="bg-border-neutral-solid"
          />
          <ClassSwatch
            label="border-neutral-weak"
            className="bg-border-neutral-weak"
          />
          <ClassSwatch
            label="border-neutral-subtle"
            className="bg-border-neutral-subtle"
          />
          <ClassSwatch
            label="border-jade-fill"
            className="bg-border-jade-fill"
          />
          <ClassSwatch
            label="border-jade-weak"
            className="bg-border-jade-weak"
          />
          <ClassSwatch label="border-white" className="bg-border-white" />
        </Row>
        <Row label="font (배경색으로 시각화)">
          <ClassSwatch label="font-dark" className="bg-font-dark" />
          <ClassSwatch
            label="font-dark-secondary"
            className="bg-font-dark-secondary"
          />
          <ClassSwatch
            label="font-dark-subtle"
            className="bg-font-dark-subtle"
          />
          <ClassSwatch label="font-dark-weak" className="bg-font-dark-weak" />
          <ClassSwatch label="font-white" className="bg-font-white" />
          <ClassSwatch label="font-label" className="bg-font-label" />
        </Row>
        <Row label="yellow / red">
          <ClassSwatch label="yellow-border" className="bg-yellow-border" />
          <ClassSwatch label="yellow-font" className="bg-yellow-font" />
          <ClassSwatch label="yellow-fill" className="bg-yellow-fill" />
          <ClassSwatch label="red-border" className="bg-red-border" />
          <ClassSwatch label="red-fill" className="bg-red-fill" />
          <ClassSwatch label="red-font" className="bg-red-font" />
        </Row>
        <Row label="states">
          <ClassSwatch label="states-hover" className="bg-states-hover" />
          <ClassSwatch label="states-hover-25" className="bg-states-hover-25" />
          <ClassSwatch
            label="states-hover-black"
            className="bg-states-hover-black"
          />
          <ClassSwatch label="states-sold-out" className="bg-states-sold-out" />
        </Row>
      </Section>

      <Section title="Component — 컴포넌트 전용, @theme 미등록(var()로만 참조)">
        <Row label="nav">
          <VarSwatch label="nav-bg" varName="--nav-bg" />
          <VarSwatch label="nav-menu-fill" varName="--nav-menu-fill" />
          <VarSwatch label="nav-jade" varName="--nav-jade" />
        </Row>
        <Row label="icon">
          <VarSwatch label="icon-black" varName="--icon-black" />
          <VarSwatch label="icon-black-weak" varName="--icon-black-weak" />
          <VarSwatch label="icon-white-fill" varName="--icon-white-fill" />
          <VarSwatch label="icon-red-fill" varName="--icon-red-fill" />
          <VarSwatch label="icon-yellow-fill" varName="--icon-yellow-fill" />
        </Row>
        <Row label="button">
          <VarSwatch label="button-black" varName="--button-black" />
          <VarSwatch label="button-jade" varName="--button-jade" />
          <VarSwatch label="button-jade-weak" varName="--button-jade-weak" />
          <VarSwatch
            label="button-border-black"
            varName="--button-border-black"
          />
          <VarSwatch
            label="button-border-jade"
            varName="--button-border-jade"
          />
        </Row>
        <Row label="progress-bar / badge">
          <VarSwatch
            label="progress-bar-green"
            varName="--progress-bar-green"
          />
          <VarSwatch label="progress-bar-red" varName="--progress-bar-red" />
          <VarSwatch
            label="progress-bar-yellow"
            varName="--progress-bar-yellow"
          />
          <VarSwatch label="badge-jade" varName="--badge-jade" />
          <VarSwatch label="badge-red" varName="--badge-red" />
          <VarSwatch label="badge-yellow" varName="--badge-yellow" />
        </Row>
        <Row label="textfield (Figma명은 text-field — Tailwind --text-* 네임스페이스와 겹쳐 변수명만 붙여 씀)">
          <VarSwatch
            label="textfield-underline"
            varName="--textfield-underline"
          />
          <VarSwatch label="textfield-border" varName="--textfield-border" />
          <VarSwatch
            label="textfield-font-weak"
            varName="--textfield-font-weak"
          />
          <VarSwatch
            label="textfield-border-selected"
            varName="--textfield-border-selected"
          />
        </Row>
      </Section>
    </div>
  ),
};

// Tailwind는 소스 파일 텍스트를 정적으로 스캔해서 실제 쓰인 클래스만 생성한다.
// `text-${name}`처럼 런타임에 문자열을 이어붙이면 "text-display-l" 같은 완성된 문자열이
// 소스 어디에도 리터럴로 존재하지 않아 스캐너가 못 찾고, 결과적으로 그 유틸리티가
// 아예 생성되지 않는다(전부 같은 기본 스타일로 보이는 원인). 그래서 클래스명을 배열에
// 완성된 문자열로 그대로 적어둔다.
const textStyleClassNames = [
  "text-display-l",
  "text-display-m",
  "text-display-s",
  "text-title-xl",
  "text-title-l",
  "text-title-m",
  "text-title-s",
  "text-body-l",
  "text-body-m",
  "text-body-s-b",
  "text-body-s",
  "text-caption-b",
  "text-caption",
];

export const Typography: Story = {
  render: () => (
    <Section title="Typography — text-<이름> 하나에 size/line-height/font-weight가 함께 등록됨">
      <div className="flex flex-col gap-4">
        {textStyleClassNames.map((className) => (
          <div key={className} className="flex items-baseline gap-4">
            <span className="w-24 shrink-0 font-mono text-xs text-neutral-500">
              {className}
            </span>
            <span className={className}>다람쥐 헌 쳇바퀴에 타고파 0123</span>
          </div>
        ))}
      </div>
    </Section>
  ),
};

const spacingScale: { name: string; px: number; className: string }[] = [
  { name: "sm", px: 4, className: "w-1" },
  { name: "md", px: 8, className: "w-2" },
  { name: "base", px: 12, className: "w-3" },
  { name: "lg", px: 16, className: "w-4" },
  { name: "xl", px: 24, className: "w-6" },
  { name: "2xl", px: 32, className: "w-8" },
  { name: "3xl", px: 48, className: "w-12" },
  { name: "4xl", px: 64, className: "w-16" },
];

export const Spacing: Story = {
  render: () => (
    <Section title="Spacing — 이름 붙은 토큰을 새로 등록하지 않고 숫자 유틸리티를 그대로 씀">
      <div className="flex flex-col gap-2">
        {spacingScale.map(({ name, px, className }) => (
          <div key={name} className="flex items-center gap-3">
            <span className="w-32 shrink-0 font-mono text-xs text-neutral-500">
              {name} ({px}px) → {className}
            </span>
            <div className={`h-4 ${className} bg-fill-jade`} />
          </div>
        ))}
      </div>
    </Section>
  ),
};

export const RadiusAndShadow: Story = {
  render: () => (
    <div>
      <Section title="Radius — Tailwind 기본값과 일치해 별도 등록 없음">
        <Row label="radius">
          <div className="flex flex-col items-center gap-1">
            <div className="size-16 rounded-xs bg-fill-neutral" />
            <span className="font-mono text-[10px] text-neutral-500">
              rounded-xs (2px)
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="size-16 rounded-sm bg-fill-neutral" />
            <span className="font-mono text-[10px] text-neutral-500">
              rounded-sm (4px)
            </span>
          </div>
        </Row>
      </Section>
      <Section title="Drop Shadow — Figma Drop Shadow는 filter가 아니라 box-shadow로 매핑">
        <Row label="shadow">
          <div className="flex flex-col items-center gap-1">
            <div className="size-16 rounded-md bg-white shadow-floating" />
            <span className="font-mono text-[10px] text-neutral-500">
              shadow-floating
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="size-16 rounded-md bg-white shadow-nav" />
            <span className="font-mono text-[10px] text-neutral-500">
              shadow-nav
            </span>
          </div>
        </Row>
      </Section>
    </div>
  ),
};
