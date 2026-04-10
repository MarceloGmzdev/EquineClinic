import { DomainException } from './domain.exception';

export class NotFoundDomainException extends DomainException {
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
  }
}