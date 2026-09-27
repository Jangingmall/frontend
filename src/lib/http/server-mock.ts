type Resolver = (request: Request) => Promise<Response | undefined>;
const state = globalThis as typeof globalThis & {
  __midamServerMock?: Resolver;
};
/** Instrumentation registers the SSR MSW resolver without patching Next's HTTP proxy. */
export function setServerMockResolver(resolve: Resolver) {
  state.__midamServerMock = resolve;
}
export function resolveServerMock(request: Request) {
  return state.__midamServerMock?.(request);
}
