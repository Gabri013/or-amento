import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buscarDocumento, atualizarDocumento, COLECOES } from '../firebase/firestore';
import type { Orcamento } from '../types';
import FormularioOrcamento from '../components/FormularioOrcamento';

export default function EditarOrcamento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const buscar = async () => {
      try {
        const doc = await buscarDocumento<Orcamento>(COLECOES.ORCAMENTOS, id);
        if (doc) {
          setOrcamento({
            ...doc,
            criadoEm: doc.criadoEm instanceof Date ? doc.criadoEm : new Date(doc.criadoEm),
            atualizadoEm: doc.atualizadoEm instanceof Date ? doc.atualizadoEm : new Date(doc.atualizadoEm),
          } as Orcamento);
        }
      } catch (err) {
        console.error('Erro ao buscar orcamento:', err);
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, [id]);

  const onSalvar = async (dados: Partial<Orcamento>) => {
    if (!id) return;
    await atualizarDocumento(COLECOES.ORCAMENTOS, id, dados);
    navigate('/orcamentos');
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Carregando...</span></div></div>;
  }
  if (!orcamento) {
    return <div className="container my-4"><p>Orçamento não encontrado.</p></div>;
  }
  return <FormularioOrcamento orcamentoInicial={orcamento} onSalvar={onSalvar} />;
}
