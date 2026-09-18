import { MypageProfileCard } from "./MypageProfileCard";
import { MypageSidebar } from "./MypageSidebar";

/** 일반 마이페이지 셸의 좌측 컬럼 — 프로필 카드 + 8항목 사이드바(Figma MY-6). */
function MypageSidebarSection() {
  return (
    <div className="flex flex-col gap-8">
      <MypageProfileCard />
      <MypageSidebar />
    </div>
  );
}

export { MypageSidebarSection };
