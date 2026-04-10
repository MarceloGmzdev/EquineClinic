import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';
import { AllExceptionsFilter } from '../all-exceptions.filter';
import { BadRequestDomainException } from '../../exceptions/bad-request.exception';
import { NotFoundDomainException } from '../../exceptions/not-found.exception';
import { ForbiddenDomainException } from '../../exceptions/forbidden.exception';
import { GoneDomainException } from '../../exceptions/gone.exception';

/**
 * Fábrica de mocks do ArgumentsHost para evitar repetição.
 */
function createMockHost(url = '/test') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const getResponse = jest.fn().mockReturnValue({ status });
  const getRequest = jest.fn().mockReturnValue({ method: 'GET', url });
  const switchToHttp = jest.fn().mockReturnValue({ getResponse, getRequest });
  return { switchToHttp } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.spyOn((filter as any).logger, 'error').mockImplementation(() => {});
  });

  // -------------------------------------------------------------------------
  // DomainExceptions — cada subclasse mapeia para seu statusCode e code
  // -------------------------------------------------------------------------
  describe('DomainException', () => {
    it.each([
      [new BadRequestDomainException('campo inválido'), HttpStatus.BAD_REQUEST, 'DADOS_INVALIDOS'],
      [new NotFoundDomainException('não encontrado'), HttpStatus.NOT_FOUND, 'RECURSO_NAO_ENCONTRADO'],
      [new ForbiddenDomainException('sem permissão'), HttpStatus.FORBIDDEN, 'ACESSO_NEGADO'],
      [new GoneDomainException('recurso deletado'), HttpStatus.GONE, 'RECURSO_INATIVO'],
    ])('deve mapear %s para status %i e código %s', (exception, expectedStatus, expectedCode) => {
      const host = createMockHost();
      filter.catch(exception, host);

      const response = host.switchToHttp().getResponse<any>();
      const statusMock = response.status as jest.Mock;
      expect(statusMock).toHaveBeenCalledWith(expectedStatus);

      const jsonMock = statusMock.mock.results[0].value.json as jest.Mock;
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expectedStatus,
          error: expectedCode,
          detail: [
            {
              code: expectedCode,
              description: exception.message,
            },
          ],
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // EntityNotFoundError do TypeORM → 404
  // -------------------------------------------------------------------------
  describe('EntityNotFoundError', () => {
    it('deve retornar 404 quando TypeORM lança EntityNotFoundError', () => {
      const host = createMockHost('/v1/cavalos/99');
      const err = new EntityNotFoundError('CavaloOrmEntity', { id: 99 });
      filter.catch(err, host);

      const statusMock = host.switchToHttp().getResponse<any>()
        .status as jest.Mock;
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);

      const jsonMock = statusMock.mock.results[0].value.json as jest.Mock;
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 404,
          error: 'ENTITY_NOT_FOUND',
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // HttpException (NestJS / ValidationPipe)
  // -------------------------------------------------------------------------
  describe('HttpException', () => {
    it('deve repassar status e message de HttpException genérica', () => {
      const host = createMockHost();
      filter.catch(new HttpException('proibido', 403), host);

      const statusMock = host.switchToHttp().getResponse<any>()
        .status as jest.Mock;
      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('deve concatenar array de mensagens do ValidationPipe com ponto-e-vírgula', () => {
      const host = createMockHost();
      const rawResponse = {
        statusCode: 400,
        message: ['campo1 inválido', 'campo2 obrigatório'],
        error: 'Bad Request',
      };
      filter.catch(new HttpException(rawResponse, 400), host);

      const jsonMock = (
        host.switchToHttp().getResponse<any>().status as jest.Mock
      ).mock.results[0].value.json as jest.Mock;
      
      const body = jsonMock.mock.calls[0][0];
      expect(body.detail[0].description).toBe('campo1 inválido; campo2 obrigatório');
      expect(body.error).toBe('BAD_REQUEST');
    });
  });

  // -------------------------------------------------------------------------
  // Erro desconhecido → 500
  // -------------------------------------------------------------------------
  describe('erros desconhecidos', () => {
    it('deve retornar 500 para erros não mapeados', () => {
      const host = createMockHost();
      filter.catch(new Error('falha catastrófica'), host);

      const statusMock = host.switchToHttp().getResponse<any>()
        .status as jest.Mock;
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      
      const jsonMock = statusMock.mock.results[0].value.json as jest.Mock;
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 500,
          error: 'INTERNAL_SERVER_ERROR',
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Estrutura da resposta — remoção de path e timestamp
  // -------------------------------------------------------------------------
  describe('estrutura da resposta', () => {
    it('não deve mais incluir path e timestamp na resposta', () => {
      const host = createMockHost('/v1/test');
      filter.catch(new BadRequestDomainException('erro'), host);

      const jsonMock = (
        host.switchToHttp().getResponse<any>().status as jest.Mock
      ).mock.results[0].value.json as jest.Mock;
      const body = jsonMock.mock.calls[0][0];
      
      expect(body).not.toHaveProperty('path');
      expect(body).not.toHaveProperty('timestamp');
      expect(body).toHaveProperty('status', 400);
      expect(body).toHaveProperty('message', 'Dados inválidos');
      expect(body).toHaveProperty('error', 'DADOS_INVALIDOS');
      expect(body).toHaveProperty('detail');
    });
  });
});
