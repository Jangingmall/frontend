export class ApiError extends Error {
  constructor(public readonly status: number, public readonly body: unknown) {
    super("HTTP " + status);
    this.name = "ApiError";
  }
}
