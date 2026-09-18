"use client";

import { useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { AddressCard } from "@/components/member/AddressCard";
import { AddressFormModal } from "@/components/member/AddressFormModal";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { RadioGroup } from "@/components/ui/radio-button";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveErrorMessage } from "@/constants/error-messages";
import { ApiError } from "@/lib/http/api-error";
import {
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useUpdateAddressMutation,
} from "@/queries/member/mutations";
import { useAddressesQuery } from "@/queries/member/queries";
import type { Address, AddressInput } from "@/types/member";

/**
 * "배송지" 탭(Figma ID-3). 카드를 가로로 나열하고 끝에 "주소지 추가하기" 점선 카드를
 * 붙인다 — Figma가 세로 리스트가 아니라 가로 스크롤 카드 행으로 그렸다(2026-09-17
 * `get_design_context` 대조). 목록 조회는 `useAddressesQuery`, 추가/수정은 공용
 * `AddressFormModal`(`components/member/`)을 재사용한다 — 이 모달은 `queries/`에 의존하지
 * 않으므로 mutation 훅 연결은 이 화면 조합 코드가 책임진다(architecture.md §6).
 */
function AddressesTab() {
  const [modalState, setModalState] = useState<
    { mode: "add" } | { mode: "edit"; address: Address } | null
  >(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const addressesQuery = useAddressesQuery();
  const createMutation = useCreateAddressMutation();
  const updateMutation = useUpdateAddressMutation();
  const deleteMutation = useDeleteAddressMutation();

  if (addressesQuery.isPending) {
    return (
      <div className="flex gap-4 pb-6">
        <Skeleton className="h-80 w-64" />
        <Skeleton className="h-80 w-64" />
      </div>
    );
  }

  if (addressesQuery.isError) {
    const error = addressesQuery.error;
    return (
      <ErrorState
        code={error instanceof ApiError ? error.code : undefined}
        status={error instanceof ApiError ? error.status : undefined}
        onRetry={() => void addressesQuery.refetch()}
      />
    );
  }

  const addresses = addressesQuery.data;
  const defaultAddress = addresses.find((address) => address.isDefault);

  async function handleSubmit(input: AddressInput) {
    setModalError(null);
    try {
      if (modalState?.mode === "edit") {
        await updateMutation.mutateAsync({
          addressId: modalState.address.id,
          input,
        });
      } else {
        await createMutation.mutateAsync(input);
      }
      setModalState(null);
    } catch (error) {
      setModalError(
        error instanceof ApiError
          ? resolveErrorMessage(error.code, error.status)
          : resolveErrorMessage(),
      );
    }
  }

  async function handleDelete(address: Address) {
    await deleteMutation.mutateAsync(address.id);
  }

  async function handleSetDefault(addressId: number) {
    if (addressId === defaultAddress?.id) return;
    await updateMutation.mutateAsync({
      addressId,
      input: { isDefault: true },
    });
  }

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-title-m text-font-dark">배송지</h2>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => {
            setModalError(null);
            setModalState({ mode: "add" });
          }}
        >
          추가하기
        </Button>
      </div>

      <RadioGroup
        value={defaultAddress?.id}
        onValueChange={(value) => void handleSetDefault(value as number)}
        className="flex flex-row gap-4 overflow-x-auto pb-1"
      >
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            onEdit={(target) => {
              setModalError(null);
              setModalState({ mode: "edit", address: target });
            }}
            onDelete={(target) => void handleDelete(target)}
          />
        ))}

        <button
          type="button"
          onClick={() => {
            setModalError(null);
            setModalState({ mode: "add" });
          }}
          className="flex w-64 shrink-0 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border-jade-fill bg-bg-default p-3"
        >
          <PlusIcon className="size-8" />
          <span className="text-body-s-b text-font-dark">주소지 추가하기</span>
        </button>
      </RadioGroup>

      {modalState != null && (
        <AddressFormModal
          open
          mode={modalState.mode}
          initialValue={
            modalState.mode === "edit" ? modalState.address : undefined
          }
          submitting={submitting}
          submitError={modalError}
          onOpenChange={(open) => {
            if (!open) setModalState(null);
          }}
          onSubmit={(input) => void handleSubmit(input)}
        />
      )}
    </div>
  );
}

export { AddressesTab };
