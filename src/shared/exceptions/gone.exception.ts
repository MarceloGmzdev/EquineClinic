import { HttpStatus } from '@nestjs/common';
import { DomainErrorCode } from './domain-error-code';
import { DomainException } from './domain.exception';

export class GoneDomainException extends DomainException {
  readonly code = DomainErrorCode.RECURSO_INATIVO;
  readonly statusCode = HttpStatus.GONE;

  constructor(message: string) {
    super(message);
  }
}
