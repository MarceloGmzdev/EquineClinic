import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { SessaoFisioRepositoryPort } from '../../../application/ports/sessao-fisio.repository.port';
import { SessaoFisio, CreateSessaoFisioData, UpdateSessaoFisioData } from '../../../domain/sessao-fisio.types';
import { SessaoFisioFilterParams } from '../../../../shared/types/sessao-fisio-filter.types';
import { PaginatedResult, PaginationParams } from '../../../../shared/types/pagination.types';
import { SessaoFisioOrmEntity } from './sessao-fisio.orm-entity';

@Injectable()
export class SessaoFisioTypeOrmRepository implements SessaoFisioRepositoryPort {
  constructor(
    @InjectRepository(SessaoFisioOrmEntity)
    private readonly ormRepo: Repository<SessaoFisioOrmEntity>,
  ) {}

  async save(data: CreateSessaoFisioData): Promise<SessaoFisio> {
    const entity = this.ormRepo.create(data);
    const saved = await this.ormRepo.save(entity) as SessaoFisioOrmEntity;
    return this.toDomain(saved);
  }

  async findById(id: number): Promise<SessaoFisio | null> {
    const entity = await this.ormRepo.findOne({ where: { id, ativo: true } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(
    filters: SessaoFisioFilterParams,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<SessaoFisio>> {
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

  async update(id: number, data: UpdateSessaoFisioData): Promise<SessaoFisio> {
    await this.ormRepo.update(id, data);
    const updated = await this.ormRepo.findOneOrFail({ where: { id } });
    return this.toDomain(updated);
  }

  async delete(id: number): Promise<SessaoFisio> {
    await this.ormRepo.update(id, { ativo: false });
    const deactivated = await this.ormRepo.findOneOrFail({ where: { id } });
    return this.toDomain(deactivated);
  }

  async findByCavaloIdAndFocoLesao(
    cavaloId: number,
    focoLesao: string,
  ): Promise<SessaoFisio[]> {
    const entities = await this.ormRepo.find({
      where: { cavaloId, focoLesao, ativo: true },
    });
    return entities.map((e) => this.toDomain(e));
  }

  // ---------------------------------------------------------------------------
  // Mapeamento ORM -> Domínio
  // ---------------------------------------------------------------------------

  private toDomain(entity: SessaoFisioOrmEntity): SessaoFisio {
    return {
      id: entity.id,
      cavaloId: entity.cavaloId,
      focoLesao: entity.focoLesao,
      dataSessao: entity.dataSessao,
      progressoBoa: entity.progressoBoa,
      duracaoMin: entity.duracaoMin,
      ativo: entity.ativo,
    };
  }

  // ---------------------------------------------------------------------------
  // Construção de cláusulas de query
  // ---------------------------------------------------------------------------

  private buildWhereClause(filters: SessaoFisioFilterParams): Record<string, unknown> {
    const where: Record<string, unknown> = { ativo: true };

    if (filters.cavaloId !== undefined) {
      where.cavaloId = filters.cavaloId;
    }

    if (filters.focoLesao !== undefined) {
      where.focoLesao = filters.focoLesao;
    }

    if (filters.progressoBoa !== undefined) {
      where.progressoBoa = filters.progressoBoa;
    }

    if (filters.duracaoMinima !== undefined && filters.duracaoMaxima !== undefined) {
      where.duracaoMin = Between(filters.duracaoMinima, filters.duracaoMaxima);
    } else if (filters.duracaoMinima !== undefined) {
      where.duracaoMin = MoreThanOrEqual(filters.duracaoMinima);
    } else if (filters.duracaoMaxima !== undefined) {
      where.duracaoMin = LessThanOrEqual(filters.duracaoMaxima);
    }

    if (filters.dataSessaoInicio !== undefined && filters.dataSessaoFim !== undefined) {
      where.dataSessao = Between(filters.dataSessaoInicio, filters.dataSessaoFim);
    } else if (filters.dataSessaoInicio !== undefined) {
      where.dataSessao = MoreThanOrEqual(filters.dataSessaoInicio);
    } else if (filters.dataSessaoFim !== undefined) {
      where.dataSessao = LessThanOrEqual(filters.dataSessaoFim);
    }

    return where;
  }

  private buildOrderClause(filters: SessaoFisioFilterParams): Record<string, string> {
    return {
      [filters.sort ?? 'dataSessao']: (filters.order ?? 'desc').toUpperCase(),
    };
  }
}