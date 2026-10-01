import { redirect } from "next/navigation";

/**
 * 마이페이지 진입(`/mypage`). 시안(Figma MY-1)은 진입하면 「주문 및 배송」 탭이 기본으로
 * 선택된 화면이라, 별도 대시보드 없이 주문 목록(`/mypage/orders`)으로 보낸다. 헤더·모바일
 * 메뉴·로그인 후 복귀·회원정보 수정의 뒤로가기가 모두 이 경로로 들어오므로 한 곳에서
 * 처리한다.
 */
export default function MypagePage() {
  redirect("/mypage/orders");
}
