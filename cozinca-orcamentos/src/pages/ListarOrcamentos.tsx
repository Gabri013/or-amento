import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { buscarColecao, excluirDocumento, atualizarDocumento, COLECOES } from '../firebase/firestore';
import type { Orcamento } from '../types';

export default function ListarOrcamentos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await buscarColecao<Orcamento>(COLECOES.ORCAMENTOS);
        setOrcamentos(user?.tipo === 'usuario' ? dados.filter((o) => o.vendedorId === user.uid) : dados);
      } catch (err) {
        console.error('Erro ao carregar orcamentos:', err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [user]);

  const handleExcluir = useCallback(async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este orçamento?')) return;
    try {
      await excluirDocumento(COLECOES.ORCAMENTOS, id);
      setOrcamentos((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir orçamento.');
    }
  }, []);

  const handleTransformarEmVenda = useCallback(async (orcam: Orcamento) => {
    try {
      await (await import('../firebase/firestore')).salvarDocumento(COLECOES.VENDAS, {
        orcamentoId: orcam.id,
        vendedorId: orcam.vendedorId,
        vendedorNome: orcam.vendedorNome,
        clienteId: orcam.clienteId,
        nomeCliente: orcam.nomeCliente,
        itens: orcam.itens,
        totalFinal: orcam.totalFinal,
        criadoEm: new Date(),
      });
      await atualizarDocumento(COLECOES.ORCAMENTOS, orcam.id, { status: 'venda' });
      setOrcamentos((prev) => prev.map((o) => (o.id === orcam.id ? { ...o, status: 'venda' } : o)));
    } catch (err) {
      console.error('Erro ao transformar em venda:', err);
      alert('Erro ao transformar em venda.');
    }
  }, []);

  const handlePDF = useCallback(async (orcam: Orcamento) => {
    const { gerarEBaixarPDF } = await import('../components/OrcamentoPDF');
    gerarEBaixarPDF(orcam);
  }, []);

  const statusBadge = (status: string) => {
    const mapa: Record<string, { cor: string; bg: string }> = {
      aberto: { cor: '#0d6efd', bg: '#e3f2fd' },
      venda: { cor: '#198754', bg: '#e8f5e9' },
      cancelado: { cor: '#dc3545', bg: '#fef2f2' },
    };
    return mapa[status] || { cor: '#666', bg: '#f5f5f5' };
  };

  const listaFiltrada = orcamentos.filter((o) => filtroStatus === 'todos' || o.status === filtroStatus);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Carregando...</span></div></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ borderBottom: '2px solid #ff530d', paddingBottom: '10px' }}>
        <h2 style={{ color: '#ff530d', fontWeight: 700, margin: 0 }}>Lista de Orçamentos</h2>
        <div className="d-flex gap-2 align-items-center">
          <label className="form-label mb-0">Filtrar:</label>
          <select className="form-select form-select-sm" style={{ width: '120px' }} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="aberto">Abertos</option>
            <option value="venda">Vendas</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', overflow: 'auto' }}>
        <table className="table table-hover mb-0">
          <thead>
            <tr style={{ background: '#1c1c1c', color: '#fff' }}>
              <th>Código</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th style={{ textAlign: 'right' }}>Total Final</th>
              <th>Status</th>
              <th>Data</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {listaFiltrada.map((orc) => {
              const data = orc.criadoEm instanceof Date ? orc.criadoEm : new Date(orc.criadoEm);
              const st = statusBadge(orc.status);
              return (
                <tr key={orc.id}>
                  <td style={{ fontWeight: 600, color: '#ff530d' }}>{orc.codigo}</td>
                  <td>{orc.nomeCliente}</td>
                  <td>{orc.vendedorNome}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>R$ {orc.totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td><span className="badge" style={{ background: st.bg, color: st.cor, border: 'none', borderRadius: '8px', padding: '6px 10px' }}>{orc.status.toUpperCase()}</span></td>
                  <td>{data.toLocaleDateString('pt-BR')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="d-flex justify-content-end gap-1 flex-wrap">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/orcamentos/${orc.id}/editar`)}>Editar</button>
                      {orc.status === 'aberto' && <button className="btn btn-sm" style={{ background: '#198754', color: 'white' }} onClick={() => handleTransformarEmVenda(orc)}>Transformar em Venda</button>}
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleExcluir(orc.id)}>✕</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => handlePDF(orc)}>PDF</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {listaFiltrada.length === 0 && <tr><td colSpan={7} className="text-center py-4 text-muted">Nenhum orçamento encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
