import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { buscarColecao, COLECOES } from '../firebase/firestore';
import type { Orcamento } from '../types';

export default function Relatorios() {
  const { user } = useAuth();
  const hoje = new Date();
  const [dataInicio, setDataInicio] = useState(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`);
  const [dataFim, setDataFim] = useState(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`);
  const [vendedorId, setVendedorId] = useState('all');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await buscarColecao<Orcamento>(COLECOES.ORCAMENTOS);
        const filtrados = user?.tipo === 'usuario' ? dados.filter((o) => o.vendedorId === user?.uid) : dados;
        setOrcamentos(filtrados);
        if (user?.tipo === 'admin') {
          const users = await buscarColecao<{ id: string; nome: string }>(COLECOES.USUARIOS);
          setUsuarios(users);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    carregar();
  }, [user]);

  const itensFiltrados = useMemo(() => {
    return orcamentos.filter((o) => {
      const data = o.criadoEm instanceof Date ? o.criadoEm : new Date(o.criadoEm);
      const dataStr = data.toISOString().split('T')[0];
      return dataStr >= dataInicio && dataStr <= dataFim && (vendedorId === 'all' || o.vendedorId === vendedorId) && (statusFiltro === 'todos' || o.status === statusFiltro);
    });
  }, [orcamentos, dataInicio, dataFim, vendedorId, statusFiltro]);

  const metricas = useMemo(() => {
    const qtd = itensFiltrados.length;
    const valor = itensFiltrados.reduce((s, o) => s + o.totalFinal, 0);
    return { qtd, valor, porStatus: { aberto: itensFiltrados.filter((o) => o.status === 'aberto').length, venda: itensFiltrados.filter((o) => o.status === 'venda').length, cancelado: itensFiltrados.filter((o) => o.status === 'cancelado').length } };
  }, [itensFiltrados]);

  const exportarCSV = () => {
    const cabecalho = ['Codigo', 'Cliente', 'Vendedor', 'Total Final', 'Status', 'Data'];
    const linhas = itensFiltrados.map((o) => {
      const data = o.criadoEm instanceof Date ? o.criadoEm : new Date(o.criadoEm);
      return [o.codigo, `"${o.nomeCliente}"`, `"${o.vendedorNome}"`, o.totalFinal.toFixed(2), o.status, data.toLocaleDateString('pt-BR')].join(',');
    });
    const csv = [cabecalho.join(','), ...linhas].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `relatorio_orcamentos_${dataInicio}_${dataFim}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (loading) { return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status" /></div>; }

  return (
    <div>
      <div className="mb-4" style={{ borderBottom: '2px solid #ff530d', paddingBottom: '10px' }}><h2 style={{ color: '#ff530d', fontWeight: 700, margin: 0 }}>Relatorios</h2></div>
      <div className="card mb-4" style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.06)', borderRadius: '12px' }}>
        <div className="card-body">
          <h5 className="card-title mb-3">Filtros</h5>
          <div className="row g-3">
            <div className="col-md-2"><label className="form-label">Data Inicio</label><input type="date" className="form-control" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
            <div className="col-md-2"><label className="form-label">Data Fim</label><input type="date" className="form-control" value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>
            {user?.tipo === 'admin' && <div className="col-md-4"><label className="form-label">Vendedor</label><select className="form-select" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}><option value="all">Todos</option>{usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></div>}
            <div className="col-md-3"><label className="form-label">Status</label><select className="form-select" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}><option value="todos">Todos</option><option value="aberto">Abertos</option><option value="venda">Vendas</option><option value="cancelado">Cancelados</option></select></div>
            <div className="col-md-1 d-flex align-items-end"><button className="btn w-100" style={{ background: '#ff530d', color: '#fff', borderRadius: '8px' }} onClick={exportarCSV}>CSV</button></div>
          </div>
        </div>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-md-4"><div className="card" style={{ borderLeft: '6px solid #ff530d' }}><div className="card-body"><h5 style={{ margin: 0, fontSize: '0.95rem', color: '#555' }}>Total Orcamentos</h5><p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{metricas.qtd}</p></div></div></div>
        <div className="col-md-4"><div className="card" style={{ borderLeft: '6px solid #198754' }}><div className="card-body"><h5 style={{ margin: 0, fontSize: '0.95rem', color: '#555' }}>Valor Total</h5><p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#198754' }}>R$ {metricas.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div></div></div>
        <div className="col-md-4"><div className="card" style={{ borderLeft: '6px solid #0d6efd' }}><div className="card-body"><h5 style={{ margin: 0, fontSize: '0.95rem', color: '#555' }}>Vendas: {metricas.porStatus.venda} | Abertos: {metricas.porStatus.aberto}</h5><p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Cancelados: {metricas.porStatus.cancelado}</p></div></div></div>
      </div>
      <div className="card" style={{ borderRadius: '12px' }}><div className="card-body p-0">
        <div style={{ overflow: 'auto' }}><table className="table mb-0">
          <thead><tr style={{ background: '#1c1c1c', color: '#fff' }}><th>Codigo</th><th>Cliente</th><th>Vendedor</th><th style={{ textAlign: 'right' }}>Total</th><th>Status</th><th>Data</th></tr></thead>
          <tbody>
            {itensFiltrados.map((o) => {
              const data = o.criadoEm instanceof Date ? o.criadoEm : new Date(o.criadoEm);
              return <tr key={o.id}><td style={{ fontWeight: 600, color: '#ff530d' }}>{o.codigo}</td><td>{o.nomeCliente}</td><td>{o.vendedorNome}</td><td style={{ textAlign: 'right', fontWeight: 700 }}>R$ {o.totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td><span className="badge" style={{ borderRadius: '8px', ...(o.status === 'venda' ? { background: '#d1fae5', color: '#065f46' } : o.status === 'cancelado' ? { background: '#fee2e2', color: '#991b1b' } : { background: '#dbeafe', color: '#1e40af' }) }}>{o.status.toUpperCase()}</span></td><td>{data.toLocaleDateString('pt-BR')}</td></tr>;
            })}
            {itensFiltrados.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted">Nenhum resultado encontrado.</td></tr>}
          </tbody>
        </table></div>
      </div></div>
    </div>
  );
}
