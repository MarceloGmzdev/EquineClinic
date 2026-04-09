export interface SessaoFisioFilterParams {
  cavaloId?: number;
  focoLesao?: string;
  progressoBoa?: boolean;
  dataSessaoInicio?: string;
  dataSessaoFim?: string;
  duracaoMinima?: number;
  duracaoMaxima?: number;
  sort?: 'dataSessao' | 'duracaoMin' | 'cavaloId';
  order?: 'asc' | 'desc';
}