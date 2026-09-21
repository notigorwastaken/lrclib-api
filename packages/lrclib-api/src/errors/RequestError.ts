export type RequestErrorOptions = {
  status?: number;
  statusText?: string;
  url?: string;
  cause?: unknown;
};

/** An HTTP, network, timeout, or response-decoding failure. */
export class RequestError extends Error {
  public readonly status?: number;
  public readonly statusText?: string;
  public readonly url?: string;

  constructor(
    message = "The LRCLIB request failed",
    options: RequestErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "RequestError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.url = options.url;
  }
}

/** Raised when an operation requires a publish token that is missing or empty. */
export class KeyError extends Error {
  constructor(message = "A publish token has not been configured") {
    super(message);
    this.name = "KeyError";
  }
}
