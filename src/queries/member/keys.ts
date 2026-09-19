export const memberKeys = {
  all: ["member"] as const,
  profile: () => [...memberKeys.all, "profile"] as const,
  addresses: () => [...memberKeys.all, "addresses"] as const,
};
