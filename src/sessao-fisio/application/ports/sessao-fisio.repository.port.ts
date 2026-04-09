import { SessaoFisio, CreateSessaoFisioData, UpdateSessaoFisioData } from '../../domain/sessao-fisio.types';
import { SessaoFisioFilterParams } from '../../../shared/types/sessao-fisio-filter.types';
import { PaginatedResult, PaginationParams } from '../../../shared/types/pagination.types';

export const SESSAO_FISIO_REPOSITORY_PORT = 'SESSAO_FISIO_REPOSITORY_PORT';

export interface SessaoFisioRepositoryPort {
  save(data: CreateSessaoFisioData): Promise<SessaoFisio>;
  findById(id: number): Promise<SessaoFisio | null>;
  findAll(filters: SessaoFisioFilterParams, pagination: PaginationParams): Promise<PaginatedResult<SessaoFisio>>;
  update(id: number, data: UpdateSessaoFisioData): Promise<SessaoFisio>;
  delete(id: number): Promise<SessaoFisio>;
  findByCavaloIdAndFocoLesao(cavaloId: number, focoLesao: string): Promise<SessaoFisio[]>;
}