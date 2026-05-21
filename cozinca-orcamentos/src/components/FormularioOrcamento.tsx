import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useAuth } from '../auth/useAuth';
import { buscarComFiltro, COLECOES } from '../firebase/firestore';
import { Cliente, Produto, ItemOrcamento, Orcamento } from '../types';

type ModalAba = 'buscar' | 'manual';

interface FormularioOrcamentoProps {
  orcamentoInicial?: Orcamento | null;
  onSalvar: (dados: Partial<Orcamento>) => Promise<void>;
}

export default function FormularioOrcamento({
  orcamentoInicial,
  onSalvar,
}: FormularioOrcamentoProps) {
  const { user } = useAuth();
  const vendedorNome = user?.nome || '';

  const inicial = useMemo(() => {
    if (!orcamentoInicial) {
      return {
        nomeCliente: '',
        endereco: '',
        telefone: '',
        emailCliente: '',
        cnpj: '',
        itens: [] as ItemOrcamento[],
        setores: [] as string[],
        frete: '',
        desconto: '',
        formaPagamento: '',
        condicoesEntrega: '',
        assinaturaVendedor: '',
        codigoOrcamento: '',
      };
    }

    return {
      nomeCliente: orcamentoInicial.nomeCliente,
      endereco: orcamentoInicial.endereco,
      telefone: orcamentoInicial.telefone,
      emailCliente: orcamentoInicial.email,
      cnpj: orcamentoInicial.cnpj,
      itens: orcamentoInicial.itens,
      setores: [...new Set(orcamentoInicial.itens.map((item) => item.setor).filter(Boolean) as string[])],
      frete: String(orcamentoInicial.frete),
      desconto: String(orcamentoInicial.desconto),
      formaPagamento: orcamentoInicial.formaPagamento,
      condicoesEntrega: orcamentoInicial.condicoesEntrega,
      assinaturaVendedor: orcamentoInicial.assinaturaVendedor,
      codigoOrcamento: orcamentoInicial.codigo,
    };
  }, [orcamentoInicial]);

  // Cliente
  const [nomeCliente, setNomeCliente] = useState(inicial.nomeCliente);
  const [endereco, setEndereco] = useState(inicial.endereco);
  const [telefone, setTelefone] = useState(inicial.telefone);
  const [emailCliente, setEmailCliente] = useState(inicial.emailCliente);
  const [cnpj, setCnpj] = useState(inicial.cnpj);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);

  // Itens
  const [itens, setItens] = useState<ItemOrcamento[]>(inicial.itens);
  const [setores, setSetores] = useState<string[]>(inicial.setores);
  const [novoSetor, setNovoSetor] = useState('');

  // Modal produto
  const [modalAberto, setModalAberto] = useState(false);
  const [abaModal, setAbaModal] = useState<ModalAba>('buscar');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtosEncontrados, setProdutosEncontrados] = useState<Produto[]>([]);
  const [itemSetor, setItemSetor] = useState('-');

  // Manual
  const [manualNome, setManualNome] = useState('');
  const [manualPreco, setManualPreco] = useState('');
  const [manualDesc, setManualDesc] = useState('');

  // Totais
  const [frete, setFrete] = useState(inicial.frete);
  const [desconto, setDesconto] = useState(inicial.desconto);
  const [formaPagamento, setFormaPagamento] = useState(inicial.formaPagamento);
  const [condicoesEntrega, setCondicoesEntrega] = useState(inicial.condicoesEntrega);
  const [assinaturaVendedor, setAssinaturaVendedor] = useState(inicial.assinaturaVendedor);
  const codigoOrcamento = inicial.codigoOrcamento;
  const [loading, setLoading] = useState(false);

  // Busca de clientes
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (buscaCliente.length < 2) {
        setClientesEncontrados([]);
        return;
      }
      const dados = await buscarComFiltro<Cliente>(
        COLECOES.CLIENTES,
        'nome',
        buscaCliente
      );
      setClientesEncontrados(dados);
    }, 250);
    return () => clearTimeout(timeout);
  }, [buscaCliente]);

  // Busca de produtos
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (buscaProduto.length < 2) {
        setProdutosEncontrados([]);
        return;
      }
      const dados = await buscarComFiltro<Produto>(
        COLECOES.PRODUTOS,
        'nome',
        buscaProduto
      );
      setProdutosEncontrados(dados);
    }, 250);
    return () => clearTimeout(timeout);
  }, [buscaProduto]);

  const adicionarSetor = useCallback(() => {
    const nome = novoSetor.trim();
    if (nome && !setores.includes(nome)) {
      setSetores((prev) => [...prev, nome]);
      setNovoSetor('');
    }
  }, [novoSetor, setores]);

  const adicionarItem = useCallback(
    (
      nome: string,
      descricao: string,
      preco: number,
      imagem?: string,
      produtoId?: string
    ) => {
      const novo: ItemOrcamento = {
        produtoId,
        nome,
        descricao,
        quantidade: 1,
        precoUnitario: preco,
        precoTotal: preco,
        setor: itemSetor === '-' ? '' : itemSetor,
        imagem,
      };
      setItens((prev) => [...prev, novo]);
      setModalAberto(false);
      setBuscaProduto('');
      setManualNome('');
      setManualPreco('');
      setManualDesc('');
      setAbaModal('buscar');
    },
    [itemSetor]
  );

  const atualizarQuantidade = useCallback((index: number, qtd: number) => {
    setItens((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantidade: Math.max(1, qtd),
              precoTotal: Math.max(1, qtd) * item.precoUnitario,
            }
          : item
      )
    );
  }, []);

  const removerItem = useCallback((index: number) => {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const totais = useMemo(() => {
    const totalProdutos = itens.reduce((sum, i) => sum + i.precoTotal, 0);
    const f = parseFloat(frete) || 0;
    const d = parseFloat(desconto) || 0;
    const totalGeral = totalProdutos + f;
    const valorDesconto = totalGeral * (d / 100);
    const totalFinal = totalGeral - valorDesconto;
    return { totalProdutos, totalGeral, valorDesconto, totalFinal };
  }, [itens, frete, desconto]);

  const salvar = async () => {
    if (!user || !orcamentoInicial?.id) return;
    setLoading(true);
    try {
      await onSalvar({
        nomeCliente,
        endereco,
        telefone,
        email: emailCliente,
        cnpj,
        itens,
        frete: parseFloat(frete) || 0,
        desconto: parseFloat(desconto) || 0,
        totalProdutos: totais.totalProdutos,
        totalGeral: totais.totalGeral,
        valorDesconto: totais.valorDesconto,
        totalFinal: totais.totalFinal,
        formaPagamento,
        condicoesEntrega,
        assinaturaVendedor,
        codigo: codigoOrcamento,
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-3">
        <button
          onClick={() => window.history.back()}
          className="btn btn-outline-secondary btn-sm me-3"
        >
          ← Voltar
        </button>
        <h2 style={{ color: '#ff530d', margin: 0 }}>
          {orcamentoInicial ? 'Editar Orçamento' : 'Criar Novo Orçamento'}
        </h2>
        {codigoOrcamento && (
          <span
            className="badge ms-2"
            style={{ background: '#fff3e8', color: '#8a3b12', border: '1px solid #ffd6b8', borderRadius: '8px' }}
          >
            {codigoOrcamento}
          </span>
        )}
      </div>

      {/* Cliente */}
      <section
        className="card mb-3"
        style={{ border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,.06)', borderRadius: '12px' }}
      >
        <div className="card-body">
          <h5 className="card-title mb-3">
            <span className="badge me-2" style={{ background: '#ff530d' }}>1</span>
            Dados do Cliente
          </h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Cliente (buscar cadastrado ou digite)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Digite para buscar..."
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
              />
              {clientesEncontrados.length > 0 && buscaCliente.length >= 2 && (
                <div className="card mt-1" style={{ position: 'relative', zIndex: 100, maxHeight: '180px', overflowY: 'auto' }}>
                  {clientesEncontrados.map((cli) => (
                    <button
                      key={cli.id}
                      type="button"
                      className="list-group-item list-group-item-action"
                      onClick={() => {
                        setNomeCliente(cli.nome);
                        setEndereco(cli.endereco);
                        setTelefone(cli.telefone);
                        setEmailCliente(cli.email);
                        setCnpj(cli.documento);
                        setBuscaCliente('');
                        setClientesEncontrados([]);
                      }}
                    >
                      {cli.nome}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label">Nome do Cliente</label>
              <input type="text" className="form-control" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Endereço</label>
              <input type="text" className="form-control" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Telefone</label>
              <input type="text" className="form-control" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={emailCliente} onChange={(e) => setEmailCliente(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">CNPJ / CPF</label>
              <input type="text" className="form-control" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Vendedor</label>
              <input type="text" className="form-control" value={vendedorNome} disabled />
            </div>
          </div>
        </div>
      </section>

      {/* Seção 2 — Produtos / Itens */}
      <section
        className="card mb-3"
        style={{ border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,.06)', borderRadius: '12px' }}
      >
        <div className="card-body">
          <h5 className="card-title mb-3">
            <span className="badge me-2" style={{ background: '#ff530d' }}>2</span>
            Produtos / Itens
          </h5>

          <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
            <div style={{ minWidth: '200px' }}>
              <label className="form-label mb-0">Setor:</label>
              <select className="form-select" style={{ width: '200px' }} value={itemSetor} onChange={(e) => setItemSetor(e.target.value)}>
                <option value="-">— Sem setor —</option>
                {setores.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="d-flex gap-2">
              <input type="text" className="form-control" placeholder="Novo setor" value={novoSetor} onChange={(e) => setNovoSetor(e.target.value)} style={{ width: '180px' }} />
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={adicionarSetor}>+ Setor</button>
              <button type="button" className="btn btn-sm" style={{ background: '#ff530d', color: '#fff', borderRadius: '8px' }} onClick={() => { setModalAberto(true); setAbaModal('buscar'); }}>
                + Adicionar Produto
              </button>
            </div>
          </div>

          {/* Setores */}
          {setores.map((setorNome) => {
            const itensSetor = itens.filter((i) => i.setor === setorNome);
            return (
              <div key={setorNome} className="mb-2 border rounded overflow-hidden">
                <details>
                  <summary className="btn btn-light w-100 text-start" style={{ fontWeight: 700, cursor: 'pointer', padding: '10px 15px' }}>
                    ▶ {setorNome} <span className="badge bg-secondary">{itensSetor.length} itens</span>
                  </summary>
                  <div className="p-2">{itensSetor.map((item) => {
                    const ri = itens.indexOf(item);
                    return <RowItem key={ri} item={item} index={ri} onRemover={removerItem} onQtdChange={atualizarQuantidade} />;
                  })}</div>
                </details>
              </div>
            );
          })}

          <div className="mt-3">
            {itens.map((item, idx) => (
              <RowItem key={idx} item={item} index={idx} onRemover={removerItem} onQtdChange={atualizarQuantidade} />
            ))}
          </div>

          {/* Totais */}
          <div className="mt-4">
            <div className="list-group" style={{ maxWidth: '350px', marginLeft: 'auto', borderRadius: '10px' }}>
              <div className="list-group-item d-flex justify-content-between"><span>Total Produtos</span><span className="fw-bold">R$ {totais.totalProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div className="list-group-item d-flex justify-content-between"><span>Frete</span><span className="fw-bold">R$ {(parseFloat(frete) || 0).toFixed(2)}</span></div>
              <div className="list-group-item d-flex justify-content-between"><span>Desconto (%)</span><input type="number" className="form-control" style={{ width: '80px' }} value={desconto} onChange={(e) => setDesconto(e.target.value)} min="0" /></div>
              <div className="list-group-item d-flex justify-content-between"><span>Valor Desconto</span><span style={{ color: '#ff530d' }}>- R$ {totais.valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div className="list-group-item d-flex justify-content-between" style={{ background: '#fef6f2' }}><span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Total Final</span><span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ff530d' }}>R$ {totais.totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
            </div>
            <div className="mt-2">
              <label className="form-label">Frete</label>
              <input type="number" className="form-control" style={{ maxWidth: '200px' }} value={frete} onChange={(e) => setFrete(e.target.value)} min="0" step="0.01" />
            </div>
          </div>
        </div>
      </section>

      {/* Condicoes */}
      <section className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <span className="badge me-2" style={{ background: '#ff530d' }}>3</span>
            Condições do Orçamento
          </h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Forma de Pagamento</label>
              <input type="text" className="form-control" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Condições de Entrega</label>
              <input type="text" className="form-control" value={condicoesEntrega} onChange={(e) => setCondicoesEntrega(e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label">Assinatura do Vendedor</label>
              <input type="text" className="form-control" value={assinaturaVendedor} onChange={(e) => setAssinaturaVendedor(e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* Modal produto */}
      {modalAberto && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }} onClick={() => setModalAberto(false)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Adicionar Produto</h5>
                <button type="button" className="btn-close" onClick={() => setModalAberto(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3 d-flex gap-2">
                  <button type="button" className={`btn btn-sm ${abaModal === 'buscar' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setAbaModal('buscar')}>Buscar Produto</button>
                  <button type="button" className={`btn btn-sm ${abaModal === 'manual' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setAbaModal('manual')}>Manual</button>
                </div>
                {abaModal === 'buscar' && (
                  <div>
                    <input type="text" className="form-control mb-2" placeholder="Buscar por nome..." value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)} />
                    <div className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {produtosEncontrados.map((p) => (
                        <button key={p.id} type="button" className="list-group-item list-group-item-action" onClick={() => adicionarItem(p.nome, p.descricao, p.precoBase, p.imagem, p.id)}>
                          <div className="d-flex align-items-center gap-3">
                            {p.imagem && <img src={p.imagem} alt={p.nome} style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }} />}
                            <div><strong>{p.nome}</strong><div className="small text-muted">{p.descricao}</div></div>
                            <span className="ms-auto fw-bold" style={{ color: '#ff530d' }}>R$ {p.precoBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {abaModal === 'manual' && (
                  <div>
                    <div className="mb-3"><label className="form-label">Nome</label><input type="text" className="form-control" value={manualNome} onChange={(e) => setManualNome(e.target.value)} /></div>
                    <div className="mb-3"><label className="form-label">Descrição</label><input type="text" className="form-control" value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} /></div>
                    <div className="mb-3"><label className="form-label">Preço Unitário</label><input type="number" className="form-control" value={manualPreco} onChange={(e) => setManualPreco(e.target.value)} min="0" step="0.01" /></div>
                    <button type="button" className="btn" style={{ background: '#ff530d', color: '#fff' }} onClick={() => adicionarItem(manualNome || 'Item Manual', manualDesc, parseFloat(manualPreco) || 0)}>Adicionar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-end gap-2 mb-5">
        <button className="btn btn-outline-secondary" onClick={() => window.history.back()}>Cancelar</button>
        <button className="btn" disabled={loading} onClick={salvar} style={{ background: '#ff530d', color: '#fff', borderRadius: '8px', fontWeight: 600 }}>
          {loading ? 'Salvando...' : 'Salvar Orçamento'}
        </button>
      </div>
    </div>
  );
}

function RowItem({ item, index, onRemover, onQtdChange }: { item: ItemOrcamento; index: number; onRemover: (i: number) => void; onQtdChange: (i: number, qtd: number) => void }) {
  return (
    <div className="item-grid align-items-center py-2" style={{ borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
      <div className="d-flex align-items-center gap-2">
        {item.imagem && <img src={item.imagem} alt={item.nome} className="thumb" />}
        <span>{item.nome}</span>
      </div>
      <span className="text-muted small">{item.descricao}</span>
      <span><span className="badge" style={{ background: '#fff3e8', color: '#8a3b12', border: '1px solid #ffd6b8' }}>{item.setor || '—'}</span></span>
      <div><input type="number" className="form-control form-control-sm" style={{ width: '60px' }} value={item.quantidade} onChange={(e) => onQtdChange(index, parseInt(e.target.value) || 1)} min="1" /></div>
      <div style={{ textAlign: 'right' }}>R$ {item.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
      <div className="subtotal" style={{ textAlign: 'right', color: '#ff530d', fontWeight: 700 }}>R$ {item.precoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
      <div><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onRemover(index)}>✕</button></div>
    </div>
  );
}
