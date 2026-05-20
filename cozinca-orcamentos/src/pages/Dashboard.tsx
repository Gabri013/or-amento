import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { buscarColecao } from '../firebase/firestore';
import { COLECOES } from '../firebase/firestore';
import type { Orcamento } from '../types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const dados = await buscarColecao<Orcamento>(COLECOES.ORCAMENTOS);
        setOrcamentos(dados);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
  }, []);

  const mesAtual = new Date();
  const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
  const ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0, 23, 59, 59);

  const metricasMesAtual = useMemo(() => {
    const filtrados = orcamentos.filter((o) => {
      const data = o.criadoEm instanceof Date ? o.criadoEm : new Date(o.criadoEm);
      return data >= primeiroDiaMes && data <= ultimoDiaMes;
    });
    const qtd = filtrados.length;
    const valor = filtrados.reduce((sum, o) => sum + (o.totalFinal || 0), 0);
    return { qtd, valor };
  }, [orcamentos, primeiroDiaMes, ultimoDiaMes]);

  const dadosGrafico = useMemo(() => {
    const ultimos6Meses: { mes: string; valor: number; qtd: number }[] = [];
    const agora = new Date();
    for (let i = 5; i >= 0; i--) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const mesFormatado = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const primeiro = new Date(data.getFullYear(), data.getMonth(), 1);
      const ultimo = new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59);
      const itens = orcamentos.filter((o) => {
        const d = o.criadoEm instanceof Date ? o.criadoEm : new Date(o.criadoEm);
        return d >= primeiro && d <= ultimo;
      });
      ultimos6Meses.push({
        mes: mesFormatado,
        valor: itens.reduce((sum, o) => sum + (o.totalFinal || 0), 0),
        qtd: itens.length,
      });
    }
    return ultimos6Meses;
  }, [orcamentos]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  const mm = String(mesAtual.getMonth() + 1).padStart(2, '0');
  const aaaa = mesAtual.getFullYear();

  return (
    <div>
      <h2 className="mb-4" style={{ color: '#1c1c1c', fontWeight: 700 }}>
        Bem-vindo, {user?.nome}!
      </h2>
      <div className="text-center fw-bold mb-4" style={{ color: '#ff530d' }}>
        Resumo referente ao mês: {mm}/{aaaa}
      </div>

      <div className="d-flex justify-content-around mb-5 flex-wrap gap-3">
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center', padding: '20px' }}>
          <h5 style={{ margin: 0, color: '#555' }}>Quantidade de Orçamentos (Mês Atual)</h5>
          <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: '10px', color: '#1c1c1c' }}>{metricasMesAtual.qtd}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center', padding: '20px' }}>
          <h5 style={{ margin: 0, color: '#555' }}>Valor Total em Orçamentos (Mês Atual)</h5>
          <p style={{ fontSize: '2rem', fontWeight: 800, marginTop: '10px', color: '#1c1c1c' }}>
            R$ {metricasMesAtual.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '15px', marginBottom: '30px' }}>
        <h5 style={{ color: '#1c1c1c', marginBottom: '15px' }}>Valor Total Mensal</h5>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="valor" name="Valor Total (R$)" stroke="#ff530d" strokeWidth={2} dot={{ fill: '#ff530d' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '15px' }}>
        <h5 style={{ color: '#1c1c1c', marginBottom: '15px' }}>Quantidade de Orçamentos</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="qtd" name="Quantidade" fill="#1c1c1c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
