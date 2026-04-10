import { HttpStatus } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';
import { DomainException } from './domain.exception';

export interface ErrorDetail {
  field?: string;
  code: string;
  description: string;
}

export interface ErrorResponse {
  status: number;
  message: string;
  error: string;
  detail: ErrorDetail[];
}

export abstract class ExceptionMapper {
  protected mapException(exception: unknown): ErrorResponse {
    if (exception instanceof DomainException) {
      return this.handleDomainException(exception);
    }

    if (exception instanceof EntityNotFoundError) {
      return this.handleEntityNotFound(exception);
    }

    if (exception instanceof Error) {
      return this.handleUnknown(exception);
    }

    return this.handleUnknown(new Error('Erro desconhecido'));
  }

  protected handleDomainException(exception: DomainException): ErrorResponse {
    return {
      status: exception.statusCode,
      message: this.getMessageByStatus(exception.statusCode),
      error: exception.code,
      detail: [
        {
          field: exception.field,
          code: exception.code,
          description: exception.message,
        },
      ],
    };
  }

  protected handleEntityNotFound(
    exception: EntityNotFoundError,
  ): ErrorResponse {
    return {
      status: HttpStatus.NOT_FOUND,
      message: 'Recurso não encontrado',
      error: 'ENTITY_NOT_FOUND',
      detail: [{ code: 'ENTITY_NOT_FOUND', description: exception.message }],
    };
  }

  protected handleUnknown(exception: Error): ErrorResponse {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR',
      detail: [
        { code: 'INTERNAL_SERVER_ERROR', description: exception.message },
      ],
    };
  }

  protected getMessageByStatus(status: number): string {
    const messages: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Dados inválidos',
      [HttpStatus.UNAUTHORIZED]: 'Não autorizado',
      [HttpStatus.FORBIDDEN]: 'Acesso negado',
      [HttpStatus.NOT_FOUND]: 'Recurso não encontrado',
      [HttpStatus.GONE]: 'Recurso indisponível',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erro interno do servidor',
    };
    return messages[status] ?? 'Erro interno do servidor';
  }

  protected getErrorByStatus(status: number): string {
    const errors: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.GONE]: 'RESOURCE_UNAVAILABLE',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };
    return errors[status] ?? 'INTERNAL_SERVER_ERROR';
  }
}
