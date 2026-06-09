export class HttpException extends Error {
  public status: number;
  public errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, HttpException.prototype);
  }
}
