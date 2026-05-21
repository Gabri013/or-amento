import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { buscarColecao, COLECOES } from '../firebase/firestore';
import type { Orcamento, Venda } from '../types';

export default function Vendas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await buscarColecao<Venda>(COLECOES.VENDAS);
        setVendas(user?.tipo === 'usuario' ? dados.filter((v) => v.vendedorId === user.uid) : dados);
      } catch (err) {
        console.error('Erro ao carregar vendas:', err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [user]);

  const handleVerDetalhes = (venda: Venda) => {
    alert(`Venda: ${venda.id}\nCliente: ${venda.nomeCliente}\nVendedor: ${venda.vendedorNome}\nTotal: R$ ${venda.totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nItens:\n${venda.itens.map((i, idx) => `${idx + 1}. ${i.nome} — ${i.quantidade}x R$ ${i.precoUnitario.toFixed(2)} = R$ ${i.precoTotal.toFixed(2)}`).join('\n')}`);
  };

  const handlePDF = async (venda: Venda) => {
    const { gerarEBaixarPDF } = await import('../components/gerarEBaixarPDF');
    const orcamentoParaPdf: Orcamento = {
      id: venda.id,
      codigo: venda.id.substring(0, 8).toUpperCase(),
      vendedorId: venda.vendedorId,
      vendedorNome: venda.vendedorNome,
      clienteId: venda.clienteId,
      nomeCliente: venda.nomeCliente,
      endereco: '',
      telefone: '',
      email: '',
      cnpj: '',
      itens: venda.itens,
      frete: 0,
      desconto: 0,
      totalProdutos: venda.totalFinal,
      totalGeral: venda.totalFinal,
      valorDesconto: 0,
      totalFinal: venda.totalFinal,
      formaPagamento: '',
      condicoesEntrega: '',
      assinaturaVendedor: venda.vendedorNome,
      status: 'venda',
      criadoEm: venda.criadoEm,
      atualizadoEm: venda.criadoEm,
    };
    gerarEBaixarPDF(orcamentoParaPdf);
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status" /></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ borderBottom: '2px solid #ff530d', paddingBottom: '10px' }}>
        <h2 style={{ color: '#ff530d', fontWeight: 700, margin: 0 }}>Vendas</h2>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/orcamentos/novo')}>+ Novo Orçamento</button>
      </div>
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', overflow: 'auto' }}>
        <table className="table table-hover mb-0">
          <thead>
            <tr style={{ background: '#1c1c1c', color: '#fff' }}>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th style={{ textAlign: 'right' }}>Total Final</th>
              <th>Data</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendas.map((v) => {
              const data = v.criadoEm instanceof Date ? v.criadoEm : new Date(v.criadoEm);
              return (
                <tr key={v.id}>
                  <td>{v.nomeCliente}</td>
                  <td>{v.vendedorNome}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#198754' }}>R$ {v.totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>{data.toLocaleDateString('pt-BR')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="d-flex justify-content-end gap-1">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleVerDetalhes(v)}>Ver detalhes</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => handlePDF(v)}>PDF</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {vendas.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-muted">Nenhuma venda registrada ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
