import { Cavalo, CavaloComSessoes, CreateCavaloData, UpdateCavaloData } from '../../domain/cavalo.types';
import { CavaloFilterParams } from '../../../shared/types/cavalo-filter.types';
import { PaginatedResult, PaginationParams } from '../../../shared/types/pagination.types';

export const CAVALO_REPOSITORY_PORT = 'CAVALO_REPOSITORY_PORT';

export interface CavaloRepositoryPort {
  save(data: CreateCavaloData): Promise<Cavalo>;
  findById(id: number): Promise<Cavalo | null>;
  findByIdWithSessoes(id: number): Promise<CavaloComSessoes | null>;
  findAll(filters: CavaloFilterParams, pagination: PaginationParams): Promise<PaginatedResult<Cavalo>>;
  update(id: number, data: UpdateCavaloData): Promise<Cavalo>;
  delete(id: number): Promise<Cavalo>;
}