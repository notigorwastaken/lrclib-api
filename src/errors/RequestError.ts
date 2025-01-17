export class RequestError extends Error {
  constructor(error?: string) {
    super("Request error " + error);
  }
}

export class KeyError extends Error {
  constructor(error?: string) {
    super("The key has not been configured.");
  }
}
