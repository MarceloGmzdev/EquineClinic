export interface Cavalo {
  id: number;
  nomeHaras: string;
  dataAquisicao: Date;
  emTratamento: boolean;
  valorCompra: number;
  ativo: boolean;
}

/**
 * Contrato de sessão de fisioterapia conforme visualizado pelo domínio de Cavalo.
 * Definido inline para que o domínio de Cavalo seja autossuficiente e não possua
 * dependência direta sobre o domínio de SessaoFisio (Arquitetura Hexagonal —
 * cada bounded context permanece isolado).
 */
interface SessaoFisioDomainView {
  id: number;
  cavaloId: number;
  focoLesao: string;
  dataSessao: Date;
  progressoBoa: boolean;
  duracaoMin: number;
  ativo: boolean;
}

export interface CavaloComSessoes extends Cavalo {
  sessoes: SessaoFisioDomainView[];
}

export type CreateCavaloData = Omit<Cavalo, 'id' | 'ativo'>;
export type UpdateCavaloData = Partial<CreateCavaloData>;
