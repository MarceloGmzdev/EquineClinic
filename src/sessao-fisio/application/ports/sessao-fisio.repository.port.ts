import { SessaoFisio, CreateSessaoFisioData, UpdateSessaoFisioData } from '../../domain/sessao-fisio.types';
import { SessaoFisioFilterParams } from '../../../shared/types/sessao-fisio-filter.types';
import { PaginatedResult, PaginationParams } from '../../../shared/types/pagination.types';

export const SESSAO_FISIO_REPOSITORY_PORT = 'SESSAO_FISIO_REPOSITORY_PORT';

export interface SessaoFisioRepositoryPort {
  save(data: CreateSessaoFisioData): Promise<SessaoFisio>;
  findById(id: number): Promise<SessaoFisio | null>;
  findAll(filters: SessaoFisioFilterParams, pagination: PaginationParams): Promise<PaginatedResult<SessaoFisio>>;
  update(id: number, data: UpdateSessaoFisioData): Promise<SessaoFisio>;
  deactivate(id: number): Promise<SessaoFisio>;
  /** Retorna as últimas N sessões (decrescente por data) para um cavalo e lesão específicos */
  findUltimasSessoesPorLesao(cavaloId: number, focoLesao: string, limite: number): Promise<SessaoFisio[]>;
}