import { Inject } from '@nestjs/common';
import type { SessaoFisioRepositoryPort } from './ports/sessao-fisio.repository.port';
import { SESSAO_FISIO_REPOSITORY_PORT } from './ports/sessao-fisio.repository.port';
import { CAVALO_REPOSITORY_PORT } from '../../cavalo/application/ports/cavalo.repository.port';
import type { CavaloRepositoryPort } from '../../cavalo/application/ports/cavalo.repository.port';

import type { Cavalo } from '../../cavalo/domain/cavalo.types';
import type {
  SessaoFisio,
  SessaoFisioComAlerta,
  CreateSessaoFisioData,
  UpdateSessaoFisioData,
} from '../domain/sessao-fisio.types';
import type { SessaoFisioFilterParams } from '../../shared/types/sessao-fisio-filter.types';
import type { PaginatedResult, PaginationParams } from '../../shared/types/pagination.types';

import { BadRequestDomainException } from '../../shared/exceptions/bad-request.exception';
import { NotFoundDomainException } from '../../shared/exceptions/not-found.exception';
import { ForbiddenDomainException } from '../../shared/exceptions/forbidden.exception';
import { GoneDomainException } from '../../shared/exceptions/gone.exception';
import { assertDataNaoFutura } from '../../shared/domain/date-validation';

const WHITELIST_ANATOMICA = [
  'ligamento',
  'tendão',
  'fratura',
  'músculo',
  'articulação',
  'metacarpo',
  'menisco',
];

/** Número de sessões consecutivas sem progresso que dispara alerta clínico */
const LIMITE_REGRESSOES_CONSECUTIVAS = 3;

export class SessaoFisioService {
  constructor(
    @Inject(SESSAO_FISIO_REPOSITORY_PORT)
    private readonly sessaoFisioRepository: SessaoFisioRepositoryPort,
    @Inject(CAVALO_REPOSITORY_PORT)
    private readonly cavaloRepository: CavaloRepositoryPort,
  ) {}

  /**
   * Cadastra uma nova sessão de fisioterapia.
   * Retorna a sessão criada junto com um alerta clínico opcional,
   * caso o animal apresente regressão consecutiva para a mesma lesão.
   */
  async create(data: CreateSessaoFisioData): Promise<SessaoFisioComAlerta> {
    assertDataNaoFutura(data.dataSessao, 'dataSessao');
    this.validateDuracaoMin(data.duracaoMin);
    this.validateFocoLesao(data.focoLesao);

    const cavalo = await this.findCavaloOrThrow(data.cavaloId);
    this.validateCavaloEmTratamento(cavalo);

    const sessao = await this.sessaoFisioRepository.save(data);

    const alerta = await this.calcularAlertaRegressao(
      data.progressoBoa,
      data.cavaloId,
      data.focoLesao,
    );

    return { ...sessao, alerta };
  }

  async findById(id: number): Promise<SessaoFisio> {
    const sessao = await this.sessaoFisioRepository.findById(id);
    this.assertSessaoExists(sessao, id);
    return sessao;
  }

  async findAll(
    filters: SessaoFisioFilterParams,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<SessaoFisio>> {
    return this.sessaoFisioRepository.findAll(filters, pagination);
  }

  async update(id: number, data: UpdateSessaoFisioData): Promise<SessaoFisio> {
    const sessao = await this.sessaoFisioRepository.findById(id);
    
    if (!sessao) {
      throw new NotFoundDomainException(`Sessão de fisioterapia com id ${id} não encontrada`);
    }

    if (!sessao.ativo && data.ativo !== true) {
      throw new GoneDomainException(`Sessão de fisioterapia com id ${id} não está mais disponível (inativa)`);
    }

    if (data.dataSessao !== undefined) {
      assertDataNaoFutura(data.dataSessao, 'dataSessao');
    }

    if (data.duracaoMin !== undefined) {
      this.validateDuracaoMin(data.duracaoMin);
    }

    if (data.focoLesao !== undefined) {
      this.validateFocoLesao(data.focoLesao);
    }

    if (data.cavaloId !== undefined) {
      const cavalo = await this.findCavaloOrThrow(data.cavaloId);
      this.validateCavaloEmTratamento(cavalo);
    }

    return this.sessaoFisioRepository.update(id, data);
  }

  async deactivate(id: number): Promise<SessaoFisio> {
    const sessao = await this.sessaoFisioRepository.findById(id);
    this.assertSessaoExists(sessao, id);
    return this.sessaoFisioRepository.deactivate(id);
  }

  // ---------------------------------------------------------------------------
  // Validações privadas — cada método valida uma única regra
  // ---------------------------------------------------------------------------

  /**
   * Busca o cavalo via repositório (interface).
   * Desacoplado de CavaloService — depende apenas do contrato CavaloRepositoryPort.
   */
  private async findCavaloOrThrow(cavaloId: number): Promise<Cavalo> {
    const cavalo = await this.cavaloRepository.findById(cavaloId);
    if (!cavalo) {
      throw new NotFoundDomainException(`Cavalo com id ${cavaloId} não encontrado`);
    }
    if (!cavalo.ativo) {
      throw new GoneDomainException(`Cavalo com id ${cavaloId} não está mais disponível (inativo)`);
    }
    return cavalo;
  }

  private validateDuracaoMin(duracaoMin: number): void {
    if (duracaoMin < 30 || duracaoMin > 90) {
      throw new BadRequestDomainException('duracaoMin deve estar entre 30 e 90 minutos');
    }
  }

  private isTermoAnatomicoPresenteNaLesao(focoLesao: string): boolean {
    const focoNormalizado = focoLesao.toLowerCase();
    return WHITELIST_ANATOMICA.some((termo) => focoNormalizado.includes(termo));
  }

  private validateFocoLesao(focoLesao: string): void {
    if (!this.isTermoAnatomicoPresenteNaLesao(focoLesao)) {
      throw new BadRequestDomainException(
        `focoLesao deve conter ao menos um dos termos: ${WHITELIST_ANATOMICA.join(', ')}`,
      );
    }
  }

  private validateCavaloEmTratamento(cavalo: Cavalo): void {
    if (!cavalo.emTratamento) {
      throw new ForbiddenDomainException(
        `Cavalo com id ${cavalo.id} não está em tratamento ativo`,
      );
    }
  }

  /**
   * Avalia o histórico recente de sessões para uma lesão e emite um alerta
   * clínico caso o animal apresente regressão consecutiva.
   *
   * Não bloqueia o registro — respeita a realidade clínica onde oscilações
   * de progresso são naturais e esperadas em fisioterapia equina.
   *
   * @returns mensagem de alerta ou null se não houver regressão consecutiva
   */
  private async calcularAlertaRegressao(
    progressoBoa: boolean,
    cavaloId: number,
    focoLesao: string,
  ): Promise<string | null> {
    if (progressoBoa) return null;

    const ultimasSessoes = await this.sessaoFisioRepository.findUltimasSessoesPorLesao(
      cavaloId,
      focoLesao,
      LIMITE_REGRESSOES_CONSECUTIVAS,
    );

    const atingiuLimiteDeRegressoes =
      ultimasSessoes.length === LIMITE_REGRESSOES_CONSECUTIVAS &&
      ultimasSessoes.every((s) => !s.progressoBoa);

    if (atingiuLimiteDeRegressoes) {
      return (
        `Alerta: ${LIMITE_REGRESSOES_CONSECUTIVAS} sessões consecutivas sem progressão ` +
        `para a lesão "${focoLesao}". Revisão do protocolo de tratamento recomendada.`
      );
    }

    return null;
  }

  private assertSessaoExists(
    sessao: SessaoFisio | null,
    id: number,
  ): asserts sessao is SessaoFisio {
    if (!sessao) {
      throw new NotFoundDomainException(`Sessão de fisioterapia com id ${id} não encontrada`);
    }
    if (!sessao.ativo) {
      throw new GoneDomainException(`Sessão de fisioterapia com id ${id} não está mais disponível (inativa)`);
    }
  }
}