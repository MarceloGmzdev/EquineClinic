import { HttpStatus } from '@nestjs/common';
import { DomainErrorCode } from './domain-error-code';
import { DomainException } from './domain.exception';

export class BadRequestDomainException extends DomainException {
  readonly code = DomainErrorCode.DADOS_INVALIDOS;
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(message: string) {
    super(message);
  }
}
