import { DomainException } from './domain.exception';

export class BadRequestDomainException extends DomainException {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}