import { SettingsSection } from "./_components/SettingsSection";

/** "설정"(`/mypage/settings`, Figma MY-7). 사이드바·프로필 카드·제목은 상위
 * `(default)/layout.tsx`(`MypageShell`)가 공용으로 렌더링한다. */
export default function MypageSettingsPage() {
  return <SettingsSection />;
}
