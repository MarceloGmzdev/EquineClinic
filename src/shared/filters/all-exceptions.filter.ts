/*
 * AllExceptionsFilter — filtro global de exceções.
 *
 * Design:
 *  - DomainException: cada subclasse carrega seu próprio statusCode HTTP.
 *    O filter lê exception.statusCode sem precisar conhecer nenhuma subclasse
 *    concreta (Open/Closed Principle).
 *  - EntityNotFoundError (TypeORM): mapeado para 404 para evitar que race
 *    conditions em findOneOrFail retornem 500 ao cliente.
 *  - HttpException (NestJS): repassa status e message diretamente.
 *  - Qualquer outro erro: retorna 500 com mensagem genérica.
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
import { EntityNotFoundError } from 'typeorm';
import { DomainException } from '../exceptions/domain.exception';

interface ErrorResponse {
  statusCode: number;
  message: string;
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.resolveException(exception, request.url);

    this.logger.error(
      `${request.method} ${request.url} → ${errorResponse.statusCode}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private resolveException(exception: unknown, path: string): ErrorResponse {
    if (exception instanceof DomainException) {
      return this.handleDomainException(exception, path);
    }

    if (exception instanceof EntityNotFoundError) {
      return this.handleEntityNotFound(path);
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, path);
    }

    return this.handleUnknown(path);
  }

  /**
   * Lê o statusCode diretamente da instância — nenhuma exceção concreta
   * é importada neste arquivo (OCP: adicionar nova exceção = zero edições aqui).
   */
  private handleDomainException(exception: DomainException, path: string): ErrorResponse {
    return {
      statusCode: exception.statusCode,
      message: exception.message,
      path,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * TypeORM lança EntityNotFoundError quando findOneOrFail não encontra resultado.
   * Deve ser tratado como 404, não 500.
   */
  private handleEntityNotFound(path: string): ErrorResponse {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Recurso não encontrado',
      path,
      timestamp: new Date().toISOString(),
    };
  }

  private handleHttpException(exception: HttpException, path: string): ErrorResponse {
    const status = exception.getStatus();
    const exResponse = exception.getResponse();

    // Interface interna que representa o shape do ValidationPipe do NestJS
    interface NestValidationResponse {
      message: string | string[];
      statusCode: number;
      error?: string;
    }

    const raw =
      typeof exResponse === 'string'
        ? exResponse
        : (exResponse as NestValidationResponse).message ?? exception.message;

    return {
      statusCode: status,
      message: Array.isArray(raw) ? raw.join('; ') : raw,
      path,
      timestamp: new Date().toISOString(),
    };
  }

  private handleUnknown(path: string): ErrorResponse {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno do servidor',
      path,
      timestamp: new Date().toISOString(),
    };
  }
}