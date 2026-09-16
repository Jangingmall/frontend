import Link from "next/link";

export default function ProductNotFound() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-title-l">상품을 찾을 수 없습니다</h1>
      <p className="text-body-m text-font-dark-subtle">
        판매가 종료되었거나 공개되지 않은 상품입니다.
      </p>
      <Link
        href="/products"
        className="rounded-xs bg-fill-neutral-impact px-6 py-3 text-body-m text-font-white focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        상품 목록으로
      </Link>
    </section>
  );
}
