import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SessaoFisioController } from '../sessao-fisio.controller';
import { SessaoFisioService } from '../../application/sessao-fisio.service';
import { AllExceptionsFilter } from '../../../shared/filters/all-exceptions.filter';
import { BadRequestDomainException } from '../../../shared/exceptions/bad-request.exception';
import { ForbiddenDomainException } from '../../../shared/exceptions/forbidden.exception';

describe('SessaoFisioController (Unit/Integration)', () => {
  let app: INestApplication;
  let service: SessaoFisioService;

  const mockSessao = {
    id: 1,
    cavaloId: 1,
    focoLesao: 'tendão flexor',
    dataSessao: new Date('2024-06-20'),
    progressoBoa: false,
    duracaoMin: 45,
  };

  const sessaoFisioServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessaoFisioController],
      providers: [
        {
          provide: SessaoFisioService,
          useValue: sessaoFisioServiceMock,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    service = module.get<SessaoFisioService>(SessaoFisioService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /sessoes-fisio', () => {
    it('deve cadastrar uma sessão com sucesso', async () => {
      sessaoFisioServiceMock.create.mockResolvedValue(mockSessao);

      const payload = {
        cavaloId: 1,
        focoLesao: 'tendão flexor',
        dataSessao: '2024-06-20',
        progressoBoa: false,
        duracaoMin: 45,
      };

      const response = await request(app.getHttpServer())
        .post('/sessoes-fisio')
        .send(payload);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toEqual({
        ...mockSessao,
        dataSessao: mockSessao.dataSessao.toISOString(),
      });
    });

    it('Validação 4: deve falhar ao enviar duracaoMin fora do intervalo (Business Rule)', async () => {
      const message = 'duracaoMin deve estar entre 30 e 90 minutos';
      sessaoFisioServiceMock.create.mockRejectedValue(
        new BadRequestDomainException(message),
      );

      const payload = {
        cavaloId: 1,
        focoLesao: 'tendão flexor',
        dataSessao: '2024-06-20',
        progressoBoa: false,
        duracaoMin: 45, // Valid DTO, triggers service validation via mock
      };

      const response = await request(app.getHttpServer())
        .post('/sessoes-fisio')
        .send(payload);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toMatchObject({
        status: 400,
        message: 'Dados inválidos',
        error: 'DADOS_INVALIDOS',
      });
    });

    it('Validação 5: deve falhar ao enviar focoLesao inválido (Whitelist)', async () => {
      const message =
        'focoLesao deve conter ao menos um dos termos: ligamento, tendão, fratura...';
      sessaoFisioServiceMock.create.mockRejectedValue(
        new BadRequestDomainException(message),
      );

      const payload = {
        cavaloId: 1,
        focoLesao: 'dor na pata',
        dataSessao: '2024-06-20',
        progressoBoa: false,
        duracaoMin: 45,
      };

      const response = await request(app.getHttpServer())
        .post('/sessoes-fisio')
        .send(payload);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toMatchObject({
        status: 400,
        message: 'Dados inválidos',
        error: 'DADOS_INVALIDOS',
      });
    });

    it('Validação 6: deve falhar se o cavalo não estiver em tratamento (Forbidden)', async () => {
      const message = 'Cavalo com id 1 não está em tratamento ativo';
      sessaoFisioServiceMock.create.mockRejectedValue(
        new ForbiddenDomainException(message),
      );

      const payload = {
        cavaloId: 1,
        focoLesao: 'tendão flexor',
        dataSessao: '2024-06-20',
        progressoBoa: false,
        duracaoMin: 45,
      };

      const response = await request(app.getHttpServer())
        .post('/sessoes-fisio')
        .send(payload);

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      expect(response.body).toMatchObject({
        status: 403,
        message: 'Acesso negado',
        error: 'ACESSO_NEGADO',
      });
    });

    it('Regra 7: deve permitir progressoBoa igual a false e retornar alerta se a regressão for consecutiva (Mock)', async () => {
      // Configuramos o mock para retornar a sessão mockada com um alerta
      const alertaFake =
        'Alerta: 3 sessões consecutivas sem progressão para a lesão "tendão flexor". Revisão do protocolo de tratamento recomendada.';
      sessaoFisioServiceMock.create.mockResolvedValue({
        ...mockSessao,
        progressoBoa: false,
        alerta: alertaFake,
      });

      const payload = {
        cavaloId: 1,
        focoLesao: 'tendão flexor',
        dataSessao: '2024-06-20',
        progressoBoa: false,
        duracaoMin: 45,
      };

      const response = await request(app.getHttpServer())
        .post('/sessoes-fisio')
        .send(payload);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject({
        ...mockSessao,
        progressoBoa: false,
        dataSessao: mockSessao.dataSessao.toISOString(),
        alerta: alertaFake,
      });
    });
  });
});
