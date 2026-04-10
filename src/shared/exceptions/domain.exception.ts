import { HttpStatus } from '@nestjs/common';
import { DomainErrorCode } from './domain-error-code';

export abstract class DomainException extends Error {
  abstract readonly code: DomainErrorCode;
  abstract readonly statusCode: HttpStatus;
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = this.constructor.name;
    this.field = field;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
