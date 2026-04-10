import { Test, TestingModule } from '@nestjs/testing';
import { SessaoFisioService } from '../sessao-fisio.service';
import { SESSAO_FISIO_REPOSITORY_PORT } from '../ports/sessao-fisio.repository.port';
import { CAVALO_REPOSITORY_PORT } from '../../../cavalo/application/ports/cavalo.repository.port';
import { BadRequestDomainException } from '../../../shared/exceptions/bad-request.exception';
import { NotFoundDomainException } from '../../../shared/exceptions/not-found.exception';
import { GoneDomainException } from '../../../shared/exceptions/gone.exception';
import { ForbiddenDomainException } from '../../../shared/exceptions/forbidden.exception';

const cavaloAtivo = { id: 1, emTratamento: true, ativo: true };
const cavaloInativo = { ...cavaloAtivo, ativo: false };
const cavaloSemTratamento = { ...cavaloAtivo, emTratamento: false };

const sessaoAtiva = { id: 1, cavaloId: 1, focoLesao: 'tendão flexor', dataSessao: new Date(), progressoBoa: true, duracaoMin: 45, ativo: true };
const sessaoInativa = { ...sessaoAtiva, ativo: false };

describe('SessaoFisioService', () => {
    let service: SessaoFisioService;

    const mockSessaoRepo = {
        save: jest.fn(),
        findById: jest.fn(),
        findAll: jest.fn(),
        update: jest.fn(),
        deactivate: jest.fn(),
        findUltimasSessoesPorLesao: jest.fn(),
    };

    const mockCavaloRepo = {
        findById: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessaoFisioService,
                { provide: SESSAO_FISIO_REPOSITORY_PORT, useValue: mockSessaoRepo },
                { provide: CAVALO_REPOSITORY_PORT, useValue: mockCavaloRepo },
            ],
        }).compile();

        service = module.get<SessaoFisioService>(SessaoFisioService);
        jest.clearAllMocks();
    });

    // -------------------------------------------------------------------------
    // create
    // -------------------------------------------------------------------------
    describe('create', () => {
        const payloadValido = { cavaloId: 1, focoLesao: 'tendão flexor', dataSessao: new Date(), progressoBoa: true, duracaoMin: 45 };

        it('deve cadastrar sessão válida sem alerta', async () => {
            mockCavaloRepo.findById.mockResolvedValue(cavaloAtivo);
            mockSessaoRepo.save.mockImplementation(async (data) => ({ id: 1, ...data, ativo: true }));

            const result = await service.create(payloadValido);
            expect(result.id).toBeDefined();
            expect(result.alerta).toBeNull();
        });

        it('deve falhar se a duração for menor que 30 minutos', async () => {
            await expect(service.create({ ...payloadValido, duracaoMin: 20 })).rejects.toThrow(BadRequestDomainException);
        });

        it('deve falhar se a duração for maior que 90 minutos', async () => {
            await expect(service.create({ ...payloadValido, duracaoMin: 91 })).rejects.toThrow(BadRequestDomainException);
        });

        it('deve falhar se foco lesão não estiver na whitelist', async () => {
            await expect(service.create({ ...payloadValido, focoLesao: 'dor no chifre' })).rejects.toThrow(BadRequestDomainException);
        });

        it('deve falhar se dataSessao for futura', async () => {
            const dataFutura = new Date();
            dataFutura.setDate(dataFutura.getDate() + 1);
            await expect(service.create({ ...payloadValido, dataSessao: dataFutura })).rejects.toThrow(BadRequestDomainException);
        });

        it('deve falhar se o cavalo não existir', async () => {
            mockCavaloRepo.findById.mockResolvedValue(null);
            await expect(service.create(payloadValido)).rejects.toThrow(NotFoundDomainException);
        });

        it('deve falhar se o cavalo estiver inativo', async () => {
            mockCavaloRepo.findById.mockResolvedValue(cavaloInativo);
            await expect(service.create(payloadValido)).rejects.toThrow(GoneDomainException);
        });

        it('deve falhar se o cavalo não estiver em tratamento', async () => {
            mockCavaloRepo.findById.mockResolvedValue(cavaloSemTratamento);
            await expect(service.create(payloadValido)).rejects.toThrow(ForbiddenDomainException);
        });

        it('deve emitir alerta se houver 3 sessões consecutivas sem progresso', async () => {
            mockCavaloRepo.findById.mockResolvedValue(cavaloAtivo);
            mockSessaoRepo.findUltimasSessoesPorLesao.mockResolvedValue([
                { progressoBoa: false }, { progressoBoa: false }, { progressoBoa: false },
            ]);
            mockSessaoRepo.save.mockImplementation(async (data) => ({ id: 1, ...data, ativo: true }));

            const result = await service.create({ ...payloadValido, progressoBoa: false });
            expect(result.alerta).toContain('Alerta: 3 sessões consecutivas sem progressão');
        });

        it('não deve emitir alerta se progressoBoa=true (não consulta histórico)', async () => {
            mockCavaloRepo.findById.mockResolvedValue(cavaloAtivo);
            mockSessaoRepo.save.mockImplementation(async (data) => ({ id: 1, ...data, ativo: true }));

            const result = await service.create(payloadValido);
            expect(result.alerta).toBeNull();
            expect(mockSessaoRepo.findUltimasSessoesPorLesao).not.toHaveBeenCalled();
        });

        it('não deve emitir alerta se houver menos de 3 regressões consecutivas', async () => {
            mockCavaloRepo.findById.mockResolvedValue(cavaloAtivo);
            mockSessaoRepo.findUltimasSessoesPorLesao.mockResolvedValue([
                { progressoBoa: false }, { progressoBoa: false },
            ]);
            mockSessaoRepo.save.mockImplementation(async (data) => ({ id: 1, ...data, ativo: true }));

            const result = await service.create({ ...payloadValido, progressoBoa: false });
            expect(result.alerta).toBeNull();
        });
    });

    // -------------------------------------------------------------------------
    // findById
    // -------------------------------------------------------------------------
    describe('findById', () => {
        it('deve retornar a sessão se existir e estiver ativa', async () => {
            mockSessaoRepo.findById.mockResolvedValue(sessaoAtiva);
            await expect(service.findById(1)).resolves.toEqual(sessaoAtiva);
        });

        it('deve lançar NotFound se a sessão não existir', async () => {
            mockSessaoRepo.findById.mockResolvedValue(null);
            await expect(service.findById(1)).rejects.toThrow(NotFoundDomainException);
        });

        it('deve lançar Gone se a sessão estiver inativa', async () => {
            mockSessaoRepo.findById.mockResolvedValue(sessaoInativa);
            await expect(service.findById(1)).rejects.toThrow(GoneDomainException);
        });
    });

    // -------------------------------------------------------------------------
    // findAll
    // -------------------------------------------------------------------------
    describe('findAll', () => {
        it('deve delegar ao repositório e retornar resultado paginado', async () => {
            const paginado = { data: [sessaoAtiva], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } };
            mockSessaoRepo.findAll.mockResolvedValue(paginado);
            const result = await service.findAll({}, { page: 1, limit: 10 });
            expect(result).toEqual(paginado);
        });
    });

    // -------------------------------------------------------------------------
    // update
    // -------------------------------------------------------------------------
    describe('update', () => {
        it('deve atualizar sessão com sucesso', async () => {
            mockSessaoRepo.findById.mockResolvedValue(sessaoAtiva);
            mockSessaoRepo.update.mockResolvedValue({ ...sessaoAtiva, duracaoMin: 60 });
            await expect(service.update(1, { duracaoMin: 60 })).resolves.toMatchObject({ duracaoMin: 60 });
        });

        it('deve lançar NotFound se a sessão não existir', async () => {
            mockSessaoRepo.findById.mockResolvedValue(null);
            await expect(service.update(1, {})).rejects.toThrow(NotFoundDomainException);
        });

        it('deve lançar Gone se a sessão estiver inativa', async () => {
            mockSessaoRepo.findById.mockResolvedValue(sessaoInativa);
            await expect(service.update(1, {})).rejects.toThrow(GoneDomainException);
        });

        it('deve falhar se nova duração for inválida', async () => {
            mockSessaoRepo.findById.mockResolvedValue(sessaoAtiva);
            await expect(service.update(1, { duracaoMin: 10 })).rejects.toThrow(BadRequestDomainException);
        });

        it('deve falhar se novo focoLesao não estiver na whitelist', async () => {
            mockSessaoRepo.findById.mockResolvedValue(sessaoAtiva);
            await expect(service.update(1, { focoLesao: 'coceira' })).rejects.toThrow(BadRequestDomainException);
        });

        it('deve falhar se novo cavaloId referenciar cavalo inexistente', async () => {
            mockSessaoRepo.findById.mockResolvedValue(sessaoAtiva);
            mockCavaloRepo.findById.mockResolvedValue(null);
            await expect(service.update(1, { cavaloId: 99 })).rejects.toThrow(NotFoundDomainException);
        });

        it('deve falhar se novo cavaloId referenciar cavalo sem tratamento', async () => {
            mockSessaoRepo.findById.mockResolvedValue(sessaoAtiva);
            mockCavaloRepo.findById.mockResolvedValue(cavaloSemTratamento);
            await expect(service.update(1, { cavaloId: 2 })).rejects.toThrow(ForbiddenDomainException);
        });
    });

    // -------------------------------------------------------------------------
    // deactivate
    // -------------------------------------------------------------------------
    describe('deactivate', () => {
        it('deve desativar uma sessão ativa', async () => {
            mockSessaoRepo.findById.mockResolvedValue(sessaoAtiva);
            mockSessaoRepo.deactivate.mockResolvedValue({ ...sessaoAtiva, ativo: false });
            const result = await service.deactivate(1);
            expect(result.ativo).toBe(false);
            expect(mockSessaoRepo.deactivate).toHaveBeenCalledWith(1);
        });

        it('deve lançar NotFound se a sessão não existir', async () => {
            mockSessaoRepo.findById.mockResolvedValue(null);
            await expect(service.deactivate(1)).rejects.toThrow(NotFoundDomainException);
        });

        it('deve lançar Gone se a sessão já estiver inativa', async () => {
            mockSessaoRepo.findById.mockResolvedValue(sessaoInativa);
            await expect(service.deactivate(1)).rejects.toThrow(GoneDomainException);
        });
    });
});

