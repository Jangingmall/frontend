"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAddresses, fetchMemberProfile } from "@/api/member/api";

import { memberKeys } from "./keys";

/** 마이페이지 전용 회원 상세(email·phone·authProvider 포함). `stores/auth`와 별개 조회. */
export function useMemberProfileQuery() {
  return useQuery({
    queryKey: memberKeys.profile(),
    queryFn: fetchMemberProfile,
  });
}

export function useAddressesQuery(memberId?: number) {
  return useQuery({
    queryKey: memberKeys.addresses(memberId),
    queryFn: fetchAddresses,
  });
}
