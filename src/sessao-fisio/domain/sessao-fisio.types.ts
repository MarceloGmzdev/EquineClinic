export interface SessaoFisio {
  id: number;
  cavaloId: number;
  focoLesao: string;
  dataSessao: Date;
  progressoBoa: boolean;
  duracaoMin: number;
  ativo: boolean;
}

/** Resultado do create com alerta clínico opcional de regressão consecutiva */
export interface SessaoFisioComAlerta extends SessaoFisio {
  alerta: string | null;
}

export type CreateSessaoFisioData = Omit<SessaoFisio, 'id' | 'ativo'>;
export type UpdateSessaoFisioData = Partial<CreateSessaoFisioData>;
