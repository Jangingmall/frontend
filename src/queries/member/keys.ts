export const memberKeys = {
  all: ["member"] as const,
  settings: () => [...memberKeys.all, "settings"] as const,
  profile: () => [...memberKeys.all, "profile"] as const,
  addresses: (memberId?: number) =>
    memberId === undefined
      ? ([...memberKeys.all, "addresses"] as const)
      : ([...memberKeys.all, "addresses", memberId] as const),
};
