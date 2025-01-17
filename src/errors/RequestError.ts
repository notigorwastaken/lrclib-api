export class RequestError extends Error {
  constructor(error?: string) {
    super("Request error " + error);
  }
}
