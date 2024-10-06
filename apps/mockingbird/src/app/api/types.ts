import { STATUS_CODES } from 'http';

export class ResponseError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = STATUS_CODES[status] || 'Error';
    this.status = status;
  }
}
