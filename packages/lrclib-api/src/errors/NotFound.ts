export class NotFoundError extends Error {
  constructor() {
    super("Track was not found");
  }
}
export class NoResultError extends Error {
  constructor() {
    super("No result was found");
  }
}
