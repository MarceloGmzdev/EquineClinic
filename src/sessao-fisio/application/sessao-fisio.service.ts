import { Inject } from '@nestjs/common';
import type { SessaoFisioRepositoryPort } from './ports/sessao-fisio.repository.port';
import { SESSAO_FISIO_REPOSITORY_PORT } from './ports/sessao-fisio.repository.port';
import { CavaloService } from '../../cavalo/application/cavalo.service';

import type { Cavalo } from '../../cavalo/domain/cavalo.types';
import type { SessaoFisio, CreateSessaoFisioData, UpdateSessaoFisioData } from '../domain/sessao-fisio.types';
import type { SessaoFisioFilterParams } from '../../shared/types/sessao-fisio-filter.types';
import type { PaginatedResult, PaginationParams } from '../../shared/types/pagination.types';

import { BadRequestDomainException } from '../../shared/exceptions/bad-request.exception';
import { NotFoundDomainException } from '../../shared/exceptions/not-found.exception';
import { ForbiddenDomainException } from '../../shared/exceptions/forbidden.exception';
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

export class SessaoFisioService {
  constructor(
    @Inject(SESSAO_FISIO_REPOSITORY_PORT)
    private readonly sessaoFisioRepository: SessaoFisioRepositoryPort,
    private readonly cavaloService: CavaloService,
  ) { }

  async create(data: CreateSessaoFisioData): Promise<SessaoFisio> {
    assertDataNaoFutura(data.dataSessao, 'dataSessao');
    this.validateDuracaoMin(data.duracaoMin);
    this.validateFocoLesao(data.focoLesao);

    const cavalo = await this.findCavaloOrThrow(data.cavaloId);
    this.validateCavaloEmTratamento(cavalo);
    await this.validateProgressoBoa(data.progressoBoa, data.cavaloId, data.focoLesao);

    return this.sessaoFisioRepository.save(data);
  }

  async findById(id: number): Promise<SessaoFisio> {
    const sessao = await this.sessaoFisioRepository.findById(id);
    this.assertSessaoExists(sessao, id);
    return sessao!;
  }

  async findAll(
    filters: SessaoFisioFilterParams,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<SessaoFisio>> {
    return this.sessaoFisioRepository.findAll(filters, pagination);
  }

  async update(id: number, data: UpdateSessaoFisioData): Promise<SessaoFisio> {
    const sessao = await this.sessaoFisioRepository.findById(id);
    this.assertSessaoExists(sessao, id);

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

  async delete(id: number): Promise<SessaoFisio> {
    const sessao = await this.sessaoFisioRepository.findById(id);
    this.assertSessaoExists(sessao, id);
    return this.sessaoFisioRepository.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Validações privadas — cada método valida uma única regra
  // ---------------------------------------------------------------------------

  private async findCavaloOrThrow(cavaloId: number): Promise<Cavalo> {
    return this.cavaloService.findById(cavaloId);
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

  private async validateProgressoBoa(
    progressoBoa: boolean,
    cavaloId: number,
    focoLesao: string,
  ): Promise<void> {
    if (!progressoBoa) return;

    const sessoesAnteriores = await this.sessaoFisioRepository.findByCavaloIdAndFocoLesao(
      cavaloId,
      focoLesao,
    );

    if (sessoesAnteriores.length === 0) {
      throw new BadRequestDomainException(
        'progressoBoa só pode ser true se já existir ao menos uma sessão anterior para o mesmo cavalo e foco de lesão',
      );
    }
  }

  private assertSessaoExists(sessao: SessaoFisio | null, id: number): void {
    if (!sessao) {
      throw new NotFoundDomainException(`Sessão de fisioterapia com id ${id} não encontrada`);
    }
  }
}