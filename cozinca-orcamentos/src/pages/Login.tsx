import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(email, senha);
      navigate('/dashboard', { replace: true });
    } catch {
      setErro('Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px', borderRadius: '12px' }} className="card shadow">
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <img src="/imagens/cozincainox.png" alt="Cozinca Inox" style={{ maxWidth: '200px', margin: '0 auto' }} onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.parentElement!.innerHTML = '<h3 style="color:#ff530d;font-weight:700;">COZINCA INOX</h3>'; }} />
          </div>
          <h5 className="card-title text-center mb-4" style={{ fontWeight: 700, color: '#1c1c1c' }}>Acesso ao Sistema</h5>
          {erro && <div className="alert" style={{ backgroundColor: '#f8d7da', color: '#842029', border: '1px solid #f5c2c7', borderRadius: '8px' }}>{erro}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: 500 }}>Email</label>
              <input type="email" className="form-control" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ borderRadius: '8px' }} />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: 500 }}>Senha</label>
              <input type="password" className="form-control" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} required style={{ borderRadius: '8px' }} />
            </div>
            <button type="submit" className="btn w-100" disabled={loading} style={{ background: '#0d6efd', color: 'white', borderRadius: '8px', fontWeight: 600, padding: '10px' }}>{loading ? 'Entrando...' : 'Entrar'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
