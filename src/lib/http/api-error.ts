export class ApiError extends Error {
  public readonly code: string | undefined;

  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super("HTTP " + status);
    this.name = "ApiError";
    this.code = readErrorCode(body);
  }
}

function readErrorCode(body: unknown) {
  if (
    typeof body === "object" &&
    body !== null &&
    "errorCode" in body &&
    typeof body.errorCode === "string"
  ) {
    return body.errorCode;
  }
  return undefined;
}
