import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CavaloRepositoryPort } from '../../../application/ports/cavalo.repository.port';
import { Cavalo, CavaloComSessoes, CreateCavaloData, UpdateCavaloData } from '../../../domain/cavalo.types';
import { CavaloFilterParams } from '../../../../shared/types/cavalo-filter.types';
import { PaginatedResult, PaginationParams } from '../../../../shared/types/pagination.types';
import { CavaloOrmEntity } from './cavalo.orm-entity';

@Injectable()
export class CavaloTypeOrmRepository implements CavaloRepositoryPort {
  constructor(
    @InjectRepository(CavaloOrmEntity)
    private readonly ormRepo: Repository<CavaloOrmEntity>,
  ) { }

  async save(data: CreateCavaloData): Promise<Cavalo> {
    const entity = this.ormRepo.create(data);
    const saved = await this.ormRepo.save(entity) as CavaloOrmEntity;
    return this.toDomain(saved);
  }

  async findById(id: number): Promise<Cavalo | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByIdWithSessoes(id: number): Promise<CavaloComSessoes | null> {
    const entity = await this.ormRepo.findOne({
      where: { id },
      relations: ['sessoes'],
    });
    return entity ? this.toDomainWithSessoes(entity) : null;
  }

  async findAll(
    filters: CavaloFilterParams,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Cavalo>> {
    const where = this.buildWhereClause(filters);
    const order = this.buildOrderClause(filters);
    const skip = (pagination.page - 1) * pagination.limit;

    const [entities, total] = await this.ormRepo.findAndCount({
      where,
      order,
      skip,
      take: pagination.limit,
    });

    return {
      data: entities.map((e) => this.toDomain(e)),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async update(id: number, data: UpdateCavaloData): Promise<Cavalo> {
    await this.ormRepo.update(id, data);
    const updated = await this.ormRepo.findOneOrFail({ where: { id, ativo: true } });
    return this.toDomain(updated);
  }

  async deactivate(id: number): Promise<Cavalo> {
    await this.ormRepo.update(id, { ativo: false });
    const deactivated = await this.ormRepo.findOneOrFail({ where: { id } });
    return this.toDomain(deactivated);
  }

  // ---------------------------------------------------------------------------
  // Mapeamento ORM -> Domínio
  // ---------------------------------------------------------------------------

  private toDomain(entity: CavaloOrmEntity): Cavalo {
    return {
      id: entity.id,
      nomeHaras: entity.nomeHaras,
      dataAquisicao: entity.dataAquisicao,
      emTratamento: entity.emTratamento,
      valorCompra: entity.valorCompra,
      ativo: entity.ativo,
    };
  }

  private toDomainWithSessoes(entity: CavaloOrmEntity): CavaloComSessoes {
    return {
      ...this.toDomain(entity),
      sessoes: (entity.sessoes ?? []).filter((s) => s.ativo).map((s) => ({
        id: s.id,
        cavaloId: s.cavaloId,
        focoLesao: s.focoLesao,
        dataSessao: s.dataSessao,
        progressoBoa: s.progressoBoa,
        duracaoMin: s.duracaoMin,
        ativo: s.ativo,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Construção de cláusulas de query
  // ---------------------------------------------------------------------------

  private buildWhereClause(filters: CavaloFilterParams): Record<string, unknown> {
    const where: Record<string, unknown> = { ativo: true };

    if (filters.nomeHaras) {
      where.nomeHaras = Like(`%${filters.nomeHaras}%`);
    }

    if (filters.emTratamento !== undefined) {
      where.emTratamento = filters.emTratamento;
    }

    if (filters.valorCompraMin !== undefined && filters.valorCompraMax !== undefined) {
      where.valorCompra = Between(filters.valorCompraMin, filters.valorCompraMax);
    } else if (filters.valorCompraMin !== undefined) {
      where.valorCompra = MoreThanOrEqual(filters.valorCompraMin);
    } else if (filters.valorCompraMax !== undefined) {
      where.valorCompra = LessThanOrEqual(filters.valorCompraMax);
    }

    if (filters.dataAquisicaoInicio !== undefined && filters.dataAquisicaoFim !== undefined) {
      where.dataAquisicao = Between(filters.dataAquisicaoInicio, filters.dataAquisicaoFim);
    } else if (filters.dataAquisicaoInicio !== undefined) {
      where.dataAquisicao = MoreThanOrEqual(filters.dataAquisicaoInicio);
    } else if (filters.dataAquisicaoFim !== undefined) {
      where.dataAquisicao = LessThanOrEqual(filters.dataAquisicaoFim);
    }

    return where;
  }

  private buildOrderClause(filters: CavaloFilterParams): Record<string, string> {
    return {
      [filters.sort ?? 'dataAquisicao']: (filters.order ?? 'desc').toUpperCase(),
    };
  }
}
