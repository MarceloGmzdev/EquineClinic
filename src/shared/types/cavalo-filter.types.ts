export interface CavaloFilterParams {
  nomeHaras?: string;
  emTratamento?: boolean;
  dataAquisicaoInicio?: string;
  dataAquisicaoFim?: string;
  valorCompraMin?: number;
  valorCompraMax?: number;
  sort?: 'nomeHaras' | 'dataAquisicao' | 'valorCompra';
  order?: 'asc' | 'desc';
}