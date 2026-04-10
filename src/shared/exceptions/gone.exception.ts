import { DomainException } from './domain.exception';

export class GoneDomainException extends DomainException {
  readonly statusCode = 410;

  constructor(message: string) {
    super(message);
  }
}
