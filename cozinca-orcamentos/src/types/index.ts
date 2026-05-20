export interface Usuario {
  uid: string;
  nome: string;
  email: string;
  tipo: 'admin' | 'usuario';
  ativo: boolean;
  criadoEm: Date;
}

export interface Cliente {
  id: string;
  nome: string;
  documento: string;
  telefone: string;
  email: string;
  endereco: string;
  criadoEm: Date;
}

export interface Produto {
  id: string;
  nome: string;
  sku: string;
  descricao: string;
  precoBase: number;
  unidade: string;
  imagem?: string;
  ativo: boolean;
}

export interface ItemOrcamento {
  produtoId?: string;
  nome: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
  setor: string;
  imagem?: string;
}

export interface Orcamento {
  id: string;
  codigo: string;
  vendedorId: string;
  vendedorNome: string;
  clienteId?: string;
  nomeCliente: string;
  endereco: string;
  telefone: string;
  email: string;
  cnpj: string;
  itens: ItemOrcamento[];
  frete: number;
  desconto: number;
  totalProdutos: number;
  totalGeral: number;
  valorDesconto: number;
  totalFinal: number;
  formaPagamento: string;
  condicoesEntrega: string;
  assinaturaVendedor: string;
  status: 'aberto' | 'venda' | 'cancelado';
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Venda {
  id: string;
  orcamentoId: string;
  vendedorId: string;
  vendedorNome: string;
  clienteId?: string;
  nomeCliente: string;
  itens: ItemOrcamento[];
  totalFinal: number;
  criadoEm: Date;
}
