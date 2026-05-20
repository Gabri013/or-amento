import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV_ITEMS = [
  { to: '/orcamentos/novo', label: 'Criar Orçamento', icon: '📝', public: true },
  { to: '/orcamentos', label: 'Listar Orçamentos', icon: '✏️', public: true },
  { to: '/vendas', label: 'Vendas', icon: '🛒', public: true },
  { to: '/cadastro', label: 'Cadastro', icon: '📇', public: true },
  { to: '/relatorios', label: 'Relatórios', icon: '📊', public: true },
  { to: '/admin', label: 'Gerenciar Usuários', icon: '⚙️', adminOnly: true },
];

export default function Layout() {
  const { user, logoutUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        className="sidebar fixed top-0 left-0 h-full text-white"
        style={{ backgroundColor: '#212529', width: '220px', padding: '20px 0' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img
            src="/imagens/cozincainox.png"
            alt="Cozinca Inox"
            style={{ maxWidth: '160px', margin: '0 auto' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <nav style={{ padding: '0 10px' }}>
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              style={({ isActive }) => ({
                display: 'block',
                padding: '12px 20px',
                margin: '2px 0',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '8px',
                backgroundColor: isActive ? '#343a40' : 'transparent',
                fontWeight: isActive ? 700 : 400,
              })}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="btn btn-outline-light"
            style={{ width: 'calc(100% - 20px)', margin: '10px', borderRadius: '8px' }}
          >
            🚪 Sair
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        style={{ marginLeft: '220px', padding: '20px', minHeight: '100vh' }}
      >
        <div style={{ borderBottom: '2px solid #ff530d', paddingBottom: '10px', marginBottom: '20px' }}>
          <span style={{ fontWeight: 600, color: '#1c1c1c' }}>
            Usuário: <strong>{user?.nome}</strong>
          </span>
          <span style={{ marginLeft: '16px', fontSize: '0.85rem', color: '#666' }}>
            {user?.tipo === 'admin' ? 'Administrador' : 'Vendedor'}
          </span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
