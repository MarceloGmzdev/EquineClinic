/*
A ideia é que o filtro não conhece nenhuma exceção concreta. Ele apenas verifica instanceof DomainException e lê o statusCode que
cada subclasse já carrega. Para adicionar uma nova exceção, você cria a subclasse e o filtro não precisa ser tocado utilizando Polimofirsmo via
*/

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';
import { BadRequestDomainException } from '../exceptions/bad-request.exception';
import { NotFoundDomainException } from '../exceptions/not-found.exception';
import { ForbiddenDomainException } from '../exceptions/forbidden.exception';

interface ErrorResponse {
  statusCode: number;
  message: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /** 
   * Mapa de exceção de domínio → status HTTP. 
   * Mantém o núcleo (Domain) independente do protocolo de transporte (HTTP).
   */
  private static readonly DOMAIN_STATUS_MAP = new Map<
    new (...args: any[]) => DomainException,
    number
  >([
    [BadRequestDomainException, HttpStatus.BAD_REQUEST],
    [NotFoundDomainException,   HttpStatus.NOT_FOUND],
    [ForbiddenDomainException,  HttpStatus.FORBIDDEN],
  ]);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.resolveException(exception);

    this.logger.error(
      `${request.method} ${request.url} → ${errorResponse.statusCode}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private resolveException(exception: unknown): ErrorResponse {
    if (exception instanceof DomainException) {
      return this.handleDomainException(exception);
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    return this.handleUnknown();
  }

  private handleDomainException(exception: DomainException): ErrorResponse {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    for (const [ExceptionClass, code] of AllExceptionsFilter.DOMAIN_STATUS_MAP) {
      if (exception instanceof ExceptionClass) {
        statusCode = code;
        break;
      }
    }

    return {
      statusCode,
      message: exception.message,
      timestamp: new Date().toISOString(),
    };
  }

  private handleHttpException(exception: HttpException): ErrorResponse {
    const status = exception.getStatus();
    const exResponse = exception.getResponse();
    
    // Captura mensagens de erro do ValidationPipe (podem ser array de strings)
    const message = typeof exResponse === 'string'
      ? exResponse
      : (exResponse as any).message ?? exception.message;

    return {
      statusCode: status,
      message: Array.isArray(message) ? message.join('; ') : message,
      timestamp: new Date().toISOString(),
    };
  }

  private handleUnknown(): ErrorResponse {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
    };
  }
}