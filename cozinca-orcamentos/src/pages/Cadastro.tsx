import { useState, useEffect } from 'react';
import { buscarColecao, salvarDocumento, atualizarDocumento, excluirDocumento, COLECOES } from '../firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/config';
import type { Cliente, Produto } from '../types';

export default function Cadastro() {
  const [aba, setAba] = useState<'clientes' | 'produtos'>('clientes');
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ borderBottom: '2px solid #ff530d', paddingBottom: '10px' }}>
        <h2 style={{ color: '#ff530d', fontWeight: 700, margin: 0 }}>Cadastro</h2>
        <div className="d-flex gap-2">
          <button className={`btn btn-sm ${aba === 'clientes' ? '' : 'btn-outline-primary'}`} style={aba === 'clientes' ? { background: '#ff530d', color: '#fff', borderRadius: '8px' } : {}} onClick={() => setAba('clientes')}>Clientes</button>
          <button className={`btn btn-sm ${aba === 'produtos' ? '' : 'btn-outline-primary'}`} style={aba === 'produtos' ? { background: '#ff530d', color: '#fff', borderRadius: '8px' } : {}} onClick={() => setAba('produtos')}>Produtos</button>
        </div>
      </div>
      {aba === 'clientes' ? <ClientesTab /> : <ProdutosTab />}
    </div>
  );
}

function ClientesTab() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');

  const carregar = async () => {
    try {
      const dados = await buscarColecao<Cliente>(COLECOES.CLIENTES);
      setClientes(dados);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const limparForm = () => { setNome(''); setDocumento(''); setTelefone(''); setEmail(''); setEndereco(''); setEditandoId(null); };
  const handleEditar = (cli: Cliente) => { setNome(cli.nome); setDocumento(cli.documento); setTelefone(cli.telefone); setEmail(cli.email); setEndereco(cli.endereco); setEditandoId(cli.id); setMostrarForm(true); };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editandoId) { await atualizarDocumento(COLECOES.CLIENTES, editandoId, { nome, documento, telefone, email, endereco }); }
      else { await salvarDocumento(COLECOES.CLIENTES, { nome, documento, telefone, email, endereco, criadoEm: new Date() }); }
      limparForm(); setMostrarForm(false); carregar();
    } catch (err) { console.error(err); alert('Erro ao salvar cliente.'); }
  };

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Excluir cliente?')) return;
    try { await excluirDocumento(COLECOES.CLIENTES, id); carregar(); } catch (err) { console.error(err); alert('Erro ao excluir cliente.'); }
  };

  return (
    <div>
      <div className="mb-3"><button className="btn" style={{ background: '#ff530d', color: '#fff', borderRadius: '8px' }} onClick={() => { limparForm(); setMostrarForm(true); }}>+ Novo Cliente</button></div>
      {mostrarForm && (
        <div className="card mb-4" style={{ border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,.06)', borderRadius: '12px' }}>
          <div className="card-body">
            <h5 className="card-title mb-3">{editandoId ? 'Editar Cliente' : 'Novo Cliente'}</h5>
            <form onSubmit={handleSalvar}>
              <div className="row g-3">
                <div className="col-md-4"><label className="form-label">Nome / Razão Social</label><input type="text" className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
                <div className="col-md-4"><label className="form-label">CNPJ / CPF</label><input type="text" className="form-control" value={documento} onChange={(e) => setDocumento(e.target.value)} /></div>
                <div className="col-md-4"><label className="form-label">Telefone</label><input type="text" className="form-control" value={telefone} onChange={(e) => setTelefone(e.target.value)} /></div>
                <div className="col-md-4"><label className="form-label">Email</label><input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="col-md-8"><label className="form-label">Endereço</label><input type="text" className="form-control" value={endereco} onChange={(e) => setEndereco(e.target.value)} /></div>
                <div className="col-12 mt-2">
                  <button type="submit" className="btn" style={{ background: '#ff530d', color: '#fff' }}>{editandoId ? 'Atualizar' : 'Salvar'}</button>
                  <button type="button" className="btn btn-outline-secondary ms-2" onClick={() => { limparForm(); setMostrarForm(false); }}>Cancelar</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading ? <div className="spinner-border text-primary" role="status" /> : (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', overflow: 'auto' }}>
          <table className="table table-hover mb-0">
            <thead><tr style={{ background: '#1c1c1c', color: '#fff' }}><th>Nome</th><th>Documento</th><th>Telefone</th><th>Email</th><th>Endereço</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>
              {clientes.map((cli) => <tr key={cli.id}><td>{cli.nome}</td><td>{cli.documento}</td><td>{cli.telefone}</td><td>{cli.email}</td><td>{cli.endereco}</td><td style={{ textAlign: 'right' }}><div className="d-flex justify-content-end gap-1"><button className="btn btn-sm btn-outline-primary" onClick={() => handleEditar(cli)}>Editar</button><button className="btn btn-sm btn-outline-danger" onClick={() => handleExcluir(cli.id)}>✕</button></div></td></tr>)}
              {clientes.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-muted">Nenhum cliente cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProdutosTab() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [sku, setSku] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoBase, setPrecoBase] = useState('');
  const [unidade, setUnidade] = useState('un');
  const [ativo, setAtivo] = useState(true);
  const [imagem, setImagem] = useState('');
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);

  const carregar = async () => {
    try {
      const dados = await buscarColecao<Produto>(COLECOES.PRODUTOS);
      setProdutos(dados);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const limparForm = () => { setNome(''); setSku(''); setDescricao(''); setPrecoBase(''); setUnidade('un'); setAtivo(true); setImagem(''); setArquivoImagem(null); setEditandoId(null); };
  const handleEditar = (p: Produto) => { setNome(p.nome); setSku(p.sku); setDescricao(p.descricao); setPrecoBase(String(p.precoBase)); setUnidade(p.unidade); setAtivo(p.ativo); setImagem(p.imagem || ''); setEditandoId(p.id); setMostrarForm(true); };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imagemUrl = imagem;
      if (arquivoImagem) {
        const produtoId = editandoId || crypto.randomUUID();
        const storageRef = ref(storage, `produtos/${produtoId}/${Date.now()}_${arquivoImagem.name}`);
        const snap = await uploadBytes(storageRef, arquivoImagem);
        imagemUrl = await getDownloadURL(snap.ref);
      }
      const dados = { nome, sku, descricao, precoBase: parseFloat(precoBase) || 0, unidade, ativo, imagem: imagemUrl || '' };
      if (editandoId) { await atualizarDocumento(COLECOES.PRODUTOS, editandoId, dados); }
      else { await salvarDocumento(COLECOES.PRODUTOS, dados); }
      limparForm(); setMostrarForm(false); carregar();
    } catch (err) { console.error(err); alert('Erro ao salvar produto.'); }
  };

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Excluir produto?')) return;
    try { await excluirDocumento(COLECOES.PRODUTOS, id); carregar(); } catch (err) { console.error(err); alert('Erro ao excluir produto.'); }
  };

  return (
    <div>
      <div className="mb-3"><button className="btn" style={{ background: '#ff530d', color: '#fff', borderRadius: '8px' }} onClick={() => { limparForm(); setMostrarForm(true); }}>+ Novo Produto</button></div>
      {mostrarForm && (
        <div className="card mb-4" style={{ border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,.06)', borderRadius: '12px' }}>
          <div className="card-body">
            <h5 className="card-title mb-3">{editandoId ? 'Editar Produto' : 'Novo Produto'}</h5>
            <form onSubmit={handleSalvar}>
              <div className="row g-3">
                <div className="col-md-4"><label className="form-label">Nome</label><input type="text" className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
                <div className="col-md-3"><label className="form-label">SKU</label><input type="text" className="form-control" value={sku} onChange={(e) => setSku(e.target.value)} /></div>
                <div className="col-md-5"><label className="form-label">Descrição</label><input type="text" className="form-control" value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
                <div className="col-md-3"><label className="form-label">Preço Base (R$)</label><input type="number" className="form-control" value={precoBase} onChange={(e) => setPrecoBase(e.target.value)} min="0" step="0.01" required /></div>
                <div className="col-md-2"><label className="form-label">Unidade</label><select className="form-select" value={unidade} onChange={(e) => setUnidade(e.target.value)}><option value="un">un</option><option value="m">m</option><option value="kg">kg</option><option value="cx">cx</option></select></div>
                <div className="col-md-3"><label className="form-label">Ativo</label><select className="form-select" value={String(ativo)} onChange={(e) => setAtivo(e.target.value === 'true')}><option value="true">Sim</option><option value="false">Não</option></select></div>
                <div className="col-md-4"><label className="form-label">Imagem</label><input type="file" className="form-control" accept="image/*" onChange={(e) => setArquivoImagem(e.target.files?.[0] || null)} />{imagem && !arquivoImagem && <div className="mt-2"><img src={imagem} alt="" style={{ height: '60px', borderRadius: '6px', objectFit: 'cover' }} /><button type="button" className="btn btn-sm btn-link text-danger p-0 ms-2" onClick={() => setImagem('')}>Remover</button></div>}</div>
                <div className="col-12 mt-2"><button type="submit" className="btn" style={{ background: '#ff530d', color: '#fff' }}>Salvar</button><button type="button" className="btn btn-outline-secondary ms-2" onClick={() => { limparForm(); setMostrarForm(false); }}>Cancelar</button></div>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading ? <div className="spinner-border text-primary" role="status" /> : (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', overflow: 'auto' }}>
          <table className="table table-hover mb-0">
            <thead><tr style={{ background: '#1c1c1c', color: '#fff' }}><th>Nome</th><th>SKU</th><th>Descrição</th><th style={{ textAlign: 'right' }}>Preço</th><th>Un.</th><th>Ativo</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>
              {produtos.map((p) => <tr key={p.id}><td>{p.nome}</td><td><code>{p.sku}</code></td><td className="text-muted small">{p.descricao}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>R$ {p.precoBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td>{p.unidade}</td><td><span className={`badge ${p.ativo ? 'bg-success' : 'bg-danger'}`} style={{ border: 'none', borderRadius: '8px' }}>{p.ativo ? 'SIM' : 'NÃO'}</span></td><td style={{ textAlign: 'right' }}><div className="d-flex justify-content-end gap-1"><button className="btn btn-sm btn-outline-primary" onClick={() => handleEditar(p)}>Editar</button><button className="btn btn-sm btn-outline-danger" onClick={() => handleExcluir(p.id)}>✕</button></div></td></tr>)}
              {produtos.length === 0 && <tr><td colSpan={7} className="text-center py-4 text-muted">Nenhum produto cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
