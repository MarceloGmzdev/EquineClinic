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
  // DomainExceptions — cada subclasse mapeia para seu statusCode
  // -------------------------------------------------------------------------
  describe('DomainException', () => {
    it.each([
      [new BadRequestDomainException('campo inválido'), HttpStatus.BAD_REQUEST],
      [new NotFoundDomainException('não encontrado'), HttpStatus.NOT_FOUND],
      [new ForbiddenDomainException('sem permissão'), HttpStatus.FORBIDDEN],
      [new GoneDomainException('recurso deletado'), HttpStatus.GONE],
    ])('deve mapear %s para status %i', (exception, expectedStatus) => {
      const host = createMockHost();
      filter.catch(exception, host);

      const response = host.switchToHttp().getResponse<any>();
      const statusMock = response.status as jest.Mock;
      expect(statusMock).toHaveBeenCalledWith(expectedStatus);

      const jsonMock = statusMock.mock.results[0].value.json as jest.Mock;
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: expectedStatus,
          message: exception.message,
          path: '/test',
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
        expect.objectContaining({ statusCode: 404, path: '/v1/cavalos/99' }),
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
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'campo1 inválido; campo2 obrigatório',
        }),
      );
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
    });

    it('deve retornar 500 para exceções não-Error', () => {
      const host = createMockHost();
      filter.catch('string exception', host);

      const statusMock = host.switchToHttp().getResponse<any>()
        .status as jest.Mock;
      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  // -------------------------------------------------------------------------
  // Response sempre inclui 'path' e 'timestamp'
  // -------------------------------------------------------------------------
  describe('estrutura da resposta', () => {
    it('deve sempre incluir path e timestamp na resposta', () => {
      const host = createMockHost('/v1/test');
      filter.catch(new BadRequestDomainException('erro'), host);

      const jsonMock = (
        host.switchToHttp().getResponse<any>().status as jest.Mock
      ).mock.results[0].value.json as jest.Mock;
      const body = jsonMock.mock.calls[0][0];
      expect(body).toHaveProperty('path', '/v1/test');
      expect(body).toHaveProperty('timestamp');
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    });
  });
});
