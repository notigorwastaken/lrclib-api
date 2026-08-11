import { RequestError } from "./RequestError";
import type { RequestErrorOptions } from "./RequestError";

/** Raised when LRCLIB cannot find the requested track. */
export class NotFoundError extends RequestError {
  constructor(
    message = "Track was not found",
    options: Omit<RequestErrorOptions, "status"> = {},
  ) {
    super(message, { ...options, status: 404 });
    this.name = "NotFoundError";
  }
}

/** Raised when LRCLIB returns no usable result. */
export class NoResultError extends Error {
  constructor(message = "No result was found") {
    super(message);
    this.name = "NoResultError";
  }
}
