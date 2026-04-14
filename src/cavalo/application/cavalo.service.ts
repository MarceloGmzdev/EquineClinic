import { Inject } from '@nestjs/common';
import type { CavaloRepositoryPort } from './ports/cavalo.repository.port';
import { CAVALO_REPOSITORY_PORT } from './ports/cavalo.repository.port';

import type { Cavalo, CavaloComSessoes, CreateCavaloData, UpdateCavaloData } from '../domain/cavalo.types';
import type { CavaloFilterParams } from '../../shared/types/cavalo-filter.types';
import type { PaginatedResult, PaginationParams } from '../../shared/types/pagination.types';

import { BadRequestDomainException } from '../../shared/exceptions/bad-request.exception';
import { NotFoundDomainException } from '../../shared/exceptions/not-found.exception';
import { GoneDomainException } from '../../shared/exceptions/gone.exception';
import { assertDataNaoFutura } from '../../shared/domain/date-validation';

export class CavaloService {
  constructor(
    @Inject(CAVALO_REPOSITORY_PORT)
    private readonly cavaloRepository: CavaloRepositoryPort,
  ) { }

  async create(data: CreateCavaloData): Promise<Cavalo> {
    assertDataNaoFutura(data.dataAquisicao, 'dataAquisicao');
    this.validateValorCompra(data.valorCompra);
    return this.cavaloRepository.save(data);
  }

  async findById(id: number): Promise<Cavalo> {
    const cavalo = await this.cavaloRepository.findById(id);
    this.assertCavaloExists(cavalo, id);
    return cavalo;
  }

  async findByIdWithSessoes(id: number): Promise<CavaloComSessoes> {
    const cavalo = await this.cavaloRepository.findByIdWithSessoes(id);
    this.assertCavaloExists(cavalo, id);
    return cavalo;
  }

  async findAll(
    filters: CavaloFilterParams,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Cavalo>> {
    return this.cavaloRepository.findAll(filters, pagination);
  }

  async update(id: number, data: UpdateCavaloData): Promise<Cavalo> {
    const cavalo = await this.cavaloRepository.findById(id);
    
    if (!cavalo) {
      throw new NotFoundDomainException(`Cavalo com id ${id} não encontrado`);
    }

    // Impede atualizações em cavalos inativos, a menos que seja para reativá-lo
    if (!cavalo.ativo && data.ativo !== true) {
      throw new GoneDomainException(`Cavalo com id ${id} não está mais disponível (inativo)`);
    }

    if (data.dataAquisicao !== undefined) {
      assertDataNaoFutura(data.dataAquisicao, 'dataAquisicao');
    }

    if (data.valorCompra !== undefined) {
      this.validateValorCompra(data.valorCompra);
    }

    return this.cavaloRepository.update(id, data);
  }

  async deactivate(id: number): Promise<Cavalo> {
    const cavalo = await this.cavaloRepository.findById(id);
    this.assertCavaloExists(cavalo, id);
    return this.cavaloRepository.deactivate(id);
  }

  /*
    Validações privadas — cada método valida uma única regra
  */


  private validateValorCompra(valorCompra: number): void {
    if (valorCompra <= 0) {
      throw new BadRequestDomainException('valorCompra deve ser maior que zero');
    }
  }

  private assertCavaloExists(
    cavalo: Cavalo | CavaloComSessoes | null,
    id: number,
  ): asserts cavalo is Cavalo | CavaloComSessoes {
    if (!cavalo) {
      throw new NotFoundDomainException(`Cavalo com id ${id} não encontrado`);
    }
    if (!cavalo.ativo) {
      throw new GoneDomainException(`Cavalo com id ${id} não está mais disponível (inativo)`);
    }
  }
}