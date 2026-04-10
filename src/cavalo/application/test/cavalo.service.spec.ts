import { Test, TestingModule } from '@nestjs/testing';
import { CavaloService } from '../cavalo.service';
import { CAVALO_REPOSITORY_PORT } from '../ports/cavalo.repository.port';
import { BadRequestDomainException } from '../../../shared/exceptions/bad-request.exception';
import { NotFoundDomainException } from '../../../shared/exceptions/not-found.exception';
import { GoneDomainException } from '../../../shared/exceptions/gone.exception';

const cavaloAtivo = { id: 1, nomeHaras: 'Haras A', dataAquisicao: new Date(), emTratamento: true, valorCompra: 1000, ativo: true };
const cavaloInativo = { ...cavaloAtivo, ativo: false };

describe('CavaloService', () => {
    let service: CavaloService;

    const mockRepo = {
        save: jest.fn(),
        findById: jest.fn(),
        findByIdWithSessoes: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
        deactivate: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CavaloService,
                { provide: CAVALO_REPOSITORY_PORT, useValue: mockRepo },
            ],
        }).compile();

        service = module.get<CavaloService>(CavaloService);
        jest.clearAllMocks();
    });

    // -------------------------------------------------------------------------
    // create
    // -------------------------------------------------------------------------
    describe('create', () => {
        it('deve criar um cavalo com sucesso', async () => {
            const data = { nomeHaras: 'Haras A', dataAquisicao: new Date(), emTratamento: true, valorCompra: 1000 };
            mockRepo.save.mockResolvedValue({ id: 1, ...data, ativo: true });

            const result = await service.create(data);
            expect(result).toBeDefined();
            expect(mockRepo.save).toHaveBeenCalledWith(data);
        });

        it('deve falhar se dataAquisicao for futura', async () => {
            const dataFutura = new Date();
            dataFutura.setDate(dataFutura.getDate() + 1);
            await expect(service.create({ nomeHaras: 'A', dataAquisicao: dataFutura, emTratamento: true, valorCompra: 1000 }))
                .rejects.toThrow(BadRequestDomainException);
        });

        it('deve falhar se valorCompra for zero', async () => {
            await expect(service.create({ nomeHaras: 'A', dataAquisicao: new Date(), emTratamento: true, valorCompra: 0 }))
                .rejects.toThrow(BadRequestDomainException);
        });

        it('deve falhar se valorCompra for negativo', async () => {
            await expect(service.create({ nomeHaras: 'A', dataAquisicao: new Date(), emTratamento: true, valorCompra: -50 }))
                .rejects.toThrow(BadRequestDomainException);
        });
    });

    // -------------------------------------------------------------------------
    // findById
    // -------------------------------------------------------------------------
    describe('findById', () => {
        it('deve retornar o cavalo se existir e estiver ativo', async () => {
            mockRepo.findById.mockResolvedValue(cavaloAtivo);
            const result = await service.findById(1);
            expect(result).toEqual(cavaloAtivo);
        });

        it('deve lançar NotFound se o cavalo não existir', async () => {
            mockRepo.findById.mockResolvedValue(null);
            await expect(service.findById(1)).rejects.toThrow(NotFoundDomainException);
        });

        it('deve lançar Gone se o cavalo estiver inativo', async () => {
            mockRepo.findById.mockResolvedValue(cavaloInativo);
            await expect(service.findById(1)).rejects.toThrow(GoneDomainException);
        });
    });

    // -------------------------------------------------------------------------
    // findByIdWithSessoes
    // -------------------------------------------------------------------------
    describe('findByIdWithSessoes', () => {
        it('deve retornar o cavalo com sessões', async () => {
            const com = { ...cavaloAtivo, sessoes: [] };
            mockRepo.findByIdWithSessoes.mockResolvedValue(com);
            await expect(service.findByIdWithSessoes(1)).resolves.toEqual(com);
        });

        it('deve lançar NotFound se o cavalo não existir', async () => {
            mockRepo.findByIdWithSessoes.mockResolvedValue(null);
            await expect(service.findByIdWithSessoes(1)).rejects.toThrow(NotFoundDomainException);
        });

        it('deve lançar Gone se o cavalo estiver inativo', async () => {
            mockRepo.findByIdWithSessoes.mockResolvedValue({ ...cavaloInativo, sessoes: [] });
            await expect(service.findByIdWithSessoes(1)).rejects.toThrow(GoneDomainException);
        });
    });

    // -------------------------------------------------------------------------
    // findAll
    // -------------------------------------------------------------------------
    describe('findAll', () => {
        it('deve delegar ao repositório e retornar resultado paginado', async () => {
            const paginado = { data: [cavaloAtivo], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } };
            mockRepo.findAll.mockResolvedValue(paginado);
            const result = await service.findAll({}, { page: 1, limit: 10 });
            expect(result).toEqual(paginado);
            expect(mockRepo.findAll).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
        });
    });

    // -------------------------------------------------------------------------
    // update
    // -------------------------------------------------------------------------
    describe('update', () => {
        it('deve atualizar um cavalo com sucesso', async () => {
            mockRepo.findById.mockResolvedValue(cavaloAtivo);
            mockRepo.update.mockResolvedValue({ ...cavaloAtivo, valorCompra: 2000 });
            const result = await service.update(1, { valorCompra: 2000 });
            expect(result.valorCompra).toBe(2000);
        });

        it('deve lançar NotFound se o cavalo não existir', async () => {
            mockRepo.findById.mockResolvedValue(null);
            await expect(service.update(1, {})).rejects.toThrow(NotFoundDomainException);
        });

        it('deve lançar Gone se o cavalo estiver inativo', async () => {
            mockRepo.findById.mockResolvedValue(cavaloInativo);
            await expect(service.update(1, {})).rejects.toThrow(GoneDomainException);
        });

        it('deve falhar se dataAquisicao for futura', async () => {
            mockRepo.findById.mockResolvedValue(cavaloAtivo);
            const dataFutura = new Date();
            dataFutura.setDate(dataFutura.getDate() + 1);
            await expect(service.update(1, { dataAquisicao: dataFutura }))
                .rejects.toThrow(BadRequestDomainException);
        });

        it('deve falhar se valorCompra for zero', async () => {
            mockRepo.findById.mockResolvedValue(cavaloAtivo);
            await expect(service.update(1, { valorCompra: 0 })).rejects.toThrow(BadRequestDomainException);
        });
    });

    // -------------------------------------------------------------------------
    // deactivate
    // -------------------------------------------------------------------------
    describe('deactivate', () => {
        it('deve desativar um cavalo ativo', async () => {
            mockRepo.findById.mockResolvedValue(cavaloAtivo);
            mockRepo.deactivate.mockResolvedValue({ ...cavaloAtivo, ativo: false });
            const result = await service.deactivate(1);
            expect(result.ativo).toBe(false);
            expect(mockRepo.deactivate).toHaveBeenCalledWith(1);
        });

        it('deve lançar NotFound se o cavalo não existir', async () => {
            mockRepo.findById.mockResolvedValue(null);
            await expect(service.deactivate(1)).rejects.toThrow(NotFoundDomainException);
        });

        it('deve lançar Gone se o cavalo já estiver inativo', async () => {
            mockRepo.findById.mockResolvedValue(cavaloInativo);
            await expect(service.deactivate(1)).rejects.toThrow(GoneDomainException);
        });
    });
});

