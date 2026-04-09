export interface Cavalo {
  id: number;
  nomeHaras: string;
  dataAquisicao: Date;
  emTratamento: boolean;
  valorCompra: number;
  ativo: boolean;
}

export interface CavaloComSessoes extends Cavalo {
  sessoes: SessaoFisioDomain[];
}

export interface SessaoFisioDomain {
  id: number;
  cavaloId: number;
  focoLesao: string;
  dataSessao: Date;
  progressoBoa: boolean;
  duracaoMin: number;
  ativo: boolean;
}

export type CreateCavaloData = Omit<Cavalo, 'id' | 'ativo'>;
export type UpdateCavaloData = Partial<CreateCavaloData>;
