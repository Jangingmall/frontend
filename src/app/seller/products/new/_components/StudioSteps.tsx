import Image from "next/image";

export function StudioSteps({ current }: { current: number }) {
  return (
    <nav aria-label="제작 단계">
      <ol>
        {["정보 입력", "생성 중", "편집", "최종 확인"].map((label, index) => (
          <li key={label} aria-current={current === index ? "step" : undefined}>
            {index > 0 && (
              <Image
                src="/seller-figma/chevron.svg"
                width={16}
                height={16}
                alt=""
              />
            )}
            {String(index + 1).padStart(2, "0")} {label}
          </li>
        ))}
      </ol>
    </nav>
  );
}
