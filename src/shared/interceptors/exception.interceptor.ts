import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, catchError } from 'rxjs';
import { EntityNotFoundError } from 'typeorm';
import { DomainException } from '../exceptions/domain.exception';
import { ErrorResponse } from '../exceptions/exception-response';

@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ExceptionInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ErrorResponse> {
    return next.handle().pipe(
      catchError((exception: Error) => {
        const response = this.mapException(exception);
        this.logError(context, response.status);
        throw new HttpException(response, response.status);
      }),
    );
  }

  private mapException(exception: Error): ErrorResponse {
    if (exception instanceof DomainException) {
      return this.handleDomainException(exception);
    }

    if (exception instanceof EntityNotFoundError) {
      return this.handleEntityNotFound(exception);
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    return this.handleUnknown(exception);
  }

  private handleDomainException(exception: DomainException): ErrorResponse {
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

  private handleEntityNotFound(exception: EntityNotFoundError): ErrorResponse {
    return {
      status: HttpStatus.NOT_FOUND,
      message: 'Recurso não encontrado',
      error: 'ENTITY_NOT_FOUND',
      detail: [{ code: 'ENTITY_NOT_FOUND', description: exception.message }],
    };
  }

  private handleHttpException(exception: HttpException): ErrorResponse {
    const status = exception.getStatus();
    const exResponse = exception.getResponse();

    const message =
      typeof exResponse === 'string'
        ? exResponse
        : ((exResponse as { message?: string | string[] }).message ??
          exception.message);

    return {
      status,
      message: this.getMessageByStatus(status),
      error: this.getErrorByStatus(status),
      detail: [
        {
          code: this.getErrorByStatus(status),
          description: Array.isArray(message) ? message.join('; ') : message,
        },
      ],
    };
  }

  private handleUnknown(exception: Error): ErrorResponse {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR',
      detail: [
        { code: 'INTERNAL_SERVER_ERROR', description: exception.message },
      ],
    };
  }

  private getMessageByStatus(status: number): string {
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

  private getErrorByStatus(status: number): string {
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

  private logError(context: ExecutionContext, status: number): void {
    const request = context.switchToHttp().getRequest();
    this.logger.error(`${request.method} ${request.url} → ${status}`);
  }
}
