"use client";

import { useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { AddressCard } from "@/components/member/AddressCard";
import { AddressFormModal } from "@/components/member/AddressFormModal";
import { Button } from "@/components/ui/button";
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
 * "배송지" 탭. 목록 조회는 `useAddressesQuery`, 추가/수정은 공용 `AddressFormModal`
 * (`components/member/`)을 재사용한다 — 이 모달은 `queries/`에 의존하지 않으므로 mutation
 * 훅 연결은 이 화면 조합 코드가 책임진다(architecture.md §6).
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
      <div className="space-y-4 py-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
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

  async function handleSetDefault(address: Address) {
    await updateMutation.mutateAsync({
      addressId: address.id,
      input: { isDefault: true },
    });
  }

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-title-s text-font-dark">배송지</h2>
        <Button
          type="button"
          variant="outline"
          size="s"
          onClick={() => {
            setModalError(null);
            setModalState({ mode: "add" });
          }}
        >
          추가하기
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState title="등록된 배송지가 없어요" />
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={(target) => {
                setModalError(null);
                setModalState({ mode: "edit", address: target });
              }}
              onDelete={(target) => void handleDelete(target)}
              onSetDefault={(target) => void handleSetDefault(target)}
            />
          ))}
        </div>
      )}

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
