import { HttpStatus } from '@nestjs/common';
import { DomainErrorCode } from './domain-error-code';
import { DomainException } from './domain.exception';

export class ForbiddenDomainException extends DomainException {
  readonly code = DomainErrorCode.ACESSO_NEGADO;
  readonly statusCode = HttpStatus.FORBIDDEN;

  constructor(message: string) {
    super(message);
  }
}
