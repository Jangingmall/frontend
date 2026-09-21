"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchAddresses,
  fetchMemberProfile,
  fetchSettings,
} from "@/api/member/api";

import { memberKeys } from "./keys";

/** 마이페이지 전용 회원 상세(email·phone·authProvider 포함). `stores/auth`와 별개 조회. */
export function useMemberProfileQuery() {
  return useQuery({
    queryKey: memberKeys.profile(),
    queryFn: fetchMemberProfile,
  });
}

export function useAddressesQuery() {
  return useQuery({
    queryKey: memberKeys.addresses(),
    queryFn: fetchAddresses,
  });
}

/** 설정(`/mypage/settings`) 조회. */
export function useSettingsQuery() {
  return useQuery({
    queryKey: memberKeys.settings(),
    queryFn: fetchSettings,
  });
}
