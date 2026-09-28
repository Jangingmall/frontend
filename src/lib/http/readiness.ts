let prepare = async () => {};
export function setRequestPreparation(callback: () => Promise<void>) {
  prepare = callback;
}
export function prepareRequest() {
  return prepare();
}
