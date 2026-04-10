import { HttpStatus } from '@nestjs/common';
import { DomainErrorCode } from './domain-error-code';
import { DomainException } from './domain.exception';

export class NotFoundDomainException extends DomainException {
  readonly code = DomainErrorCode.RECURSO_NAO_ENCONTRADO;
  readonly statusCode = HttpStatus.NOT_FOUND;

  constructor(message: string) {
    super(message);
  }
}
