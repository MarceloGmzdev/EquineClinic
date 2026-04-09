export interface SessaoFisio {
  id: number;
  cavaloId: number;
  focoLesao: string;
  dataSessao: Date;
  progressoBoa: boolean;
  duracaoMin: number;
  ativo: boolean;
}

export type CreateSessaoFisioData = Omit<SessaoFisio, 'id' | 'ativo'>;
export type UpdateSessaoFisioData = Partial<CreateSessaoFisioData>;
