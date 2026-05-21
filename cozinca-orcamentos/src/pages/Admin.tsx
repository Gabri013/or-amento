import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { buscarColecao, atualizarDocumento, COLECOES } from '../firebase/firestore';
import type { Usuario } from '../types';

export default function Admin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoTipo, setNovoTipo] = useState<'admin' | 'usuario'>('usuario');
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    try {
      const dados = await buscarColecao<Usuario>(COLECOES.USUARIOS);
      setUsuarios(dados);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCriando(true);
    try {
      const functions = getFunctions();
      const criarUsuario = httpsCallable(functions, 'criarUsuario');
      await criarUsuario({ nome: novoNome, email: novoEmail, senha: novaSenha, tipo: novoTipo });
      setNovoNome(''); setNovoEmail(''); setNovaSenha(''); setNovoTipo('usuario');
      carregar();
    } catch (err) {
      console.error(err);
      setErro('Erro ao criar usuário. Verifique se a Cloud Function está implantada.');
    } finally { setCriando(false); }
  };

  const handleToggleAtivo = async (usuario: Usuario) => {
    try { await atualizarDocumento(COLECOES.USUARIOS, usuario.uid, { ativo: !usuario.ativo });
      setUsuarios((prev) => prev.map((u) => (u.uid === usuario.uid ? { ...u, ativo: !u.ativo } : u)));
    } catch (err) { console.error(err); alert('Erro ao atualizar usuário.'); }
  };

  if (loading) { return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status" /></div>; }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ borderBottom: '2px solid #ff530d', paddingBottom: '10px' }}>
        <h2 style={{ color: '#ff530d', fontWeight: 700, margin: 0 }}>Gerenciamento de Usuários</h2>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => window.history.back()}>← Voltar ao painel</button>
      </div>
      {erro && <div className="alert mb-3" style={{ background: '#f8d7da', color: '#842029', border: '1px solid #f5c2c7', borderRadius: '8px' }}>{erro}</div>}
      <div className="card mb-4" style={{ border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,.06)', borderRadius: '12px' }}>
        <div className="card-body">
          <h5 className="card-title mb-3">Novo Usuário</h5>
          <form onSubmit={handleCriar}>
            <div className="row g-2">
              <div className="col-md-3"><input type="text" className="form-control" placeholder="Nome" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} required /></div>
              <div className="col-md-3"><input type="email" className="form-control" placeholder="Email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} required /></div>
              <div className="col-md-3"><input type="password" className="form-control" placeholder="Senha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required minLength={6} /></div>
              <div className="col-md-2"><select className="form-select" value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as 'admin' | 'usuario')}><option value="usuario">Vendedor</option><option value="admin">Administrador</option></select></div>
              <div className="col-md-1"><button type="submit" className="btn w-100" disabled={criando} style={{ background: '#ff530d', color: '#fff' }}>{criando ? '...' : '+'}</button></div>
            </div>
          </form>
        </div>
      </div>
      <div className="card" style={{ border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,.06)', borderRadius: '12px' }}>
        <div className="card-body">
          <h5 className="card-title mb-3">Usuários Cadastrados</h5>
          <div style={{ overflow: 'auto' }}>
            <table className="table table-hover mb-0">
              <thead><tr style={{ background: '#1c1c1c', color: '#fff' }}><th>Nome</th><th>Email</th><th>Tipo</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.uid}>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td><span className="badge" style={{ background: u.tipo === 'admin' ? '#e3f2fd' : '#f3e5f5', color: u.tipo === 'admin' ? '#1565c0' : '#7b1fa2' }}>{u.tipo.toUpperCase()}</span></td>
                    <td><span className="badge" style={{ background: u.ativo ? '#d1fae5' : '#fee2e2', color: u.ativo ? '#065f46' : '#991b1b' }}>{u.ativo ? 'ATIVO' : 'INATIVO'}</span></td>
                    <td style={{ textAlign: 'right' }}><button className={`btn btn-sm ${u.ativo ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => handleToggleAtivo(u)}>{u.ativo ? 'Desativar' : 'Ativar'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
