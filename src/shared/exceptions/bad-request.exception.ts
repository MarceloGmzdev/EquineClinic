import { DomainException } from './domain.exception';

export class BadRequestDomainException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}