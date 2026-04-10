import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CavaloController } from '../cavalo.controller';
import { CavaloService } from '../../application/cavalo.service';
import { AllExceptionsFilter } from '../../../shared/filters/all-exceptions.filter';
import { BadRequestDomainException } from '../../../shared/exceptions/bad-request.exception';
import { NotFoundDomainException } from '../../../shared/exceptions/not-found.exception';

describe('CavaloController (Unit/Integration)', () => {
  let app: INestApplication;
  let service: CavaloService;

  const mockCavalo = {
    id: 1,
    nomeHaras: 'Haras Teste',
    dataAquisicao: new Date('2024-01-01'),
    emTratamento: true,
    valorCompra: 10000,
  };

  const cavaloServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIdWithSessoes: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CavaloController],
      providers: [
        {
          provide: CavaloService,
          useValue: cavaloServiceMock,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    service = module.get<CavaloService>(CavaloService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /cavalos', () => {
    it('deve cadastrar um cavalo com sucesso', async () => {
      cavaloServiceMock.create.mockResolvedValue(mockCavalo);

      const payload = {
        nomeHaras: 'Haras Teste',
        dataAquisicao: '2024-01-01',
        emTratamento: true,
        valorCompra: 10000,
      };

      const response = await request(app.getHttpServer())
        .post('/cavalos')
        .send(payload);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toEqual({
        ...mockCavalo,
        dataAquisicao: mockCavalo.dataAquisicao.toISOString(),
      });
    });

    it('Validação 1: deve falhar ao enviar data futura (Business Rule)', async () => {
      const message = 'dataAquisicao não pode ser uma data futura';
      cavaloServiceMock.create.mockRejectedValue(
        new BadRequestDomainException(message),
      );

      const payload = {
        nomeHaras: 'Haras Teste',
        dataAquisicao: '2099-01-01',
        emTratamento: true,
        valorCompra: 10000,
      };

      const response = await request(app.getHttpServer())
        .post('/cavalos')
        .send(payload);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toMatchObject({
        status: 400,
        message: 'Dados inválidos',
        error: 'DADOS_INVALIDOS',
      });
    });

    it('Validação 2: deve falhar ao enviar valorCompra <= 0 (Business Rule)', async () => {
      const message = 'valorCompra deve ser maior que zero';
      cavaloServiceMock.create.mockRejectedValue(
        new BadRequestDomainException(message),
      );

      const payload = {
        nomeHaras: 'Haras Teste',
        dataAquisicao: '2024-01-01',
        emTratamento: true,
        valorCompra: 10000, // Valid DTO, triggers service validation via mock
      };

      const response = await request(app.getHttpServer())
        .post('/cavalos')
        .send(payload);

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body).toMatchObject({
        status: 400,
        message: 'Dados inválidos',
        error: 'DADOS_INVALIDOS',
      });
    });
  });

  describe('GET /cavalos/:id', () => {
    it('Validação 3: deve retornar 404 se o cavalo não existir (Business Rule)', async () => {
      const message = 'Cavalo com id 999 não encontrado';
      cavaloServiceMock.findById.mockRejectedValue(
        new NotFoundDomainException(message),
      );

      const response = await request(app.getHttpServer()).get('/cavalos/999');

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
      expect(response.body).toMatchObject({
        status: 404,
        message: 'Recurso não encontrado',
        error: 'RECURSO_NAO_ENCONTRADO',
      });
    });
  });
});
