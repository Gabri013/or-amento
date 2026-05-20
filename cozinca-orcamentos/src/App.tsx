import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import PrivateRoute from '../auth/PrivateRoute';
import { AdminRoute } from '../auth/AdminRoute';
import Layout from './Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import CriarOrcamento from '../pages/CriarOrcamento';
import ListarOrcamentos from '../pages/ListarOrcamentos';
import EditarOrcamento from '../pages/EditarOrcamento';
import Vendas from '../pages/Vendas';
import Cadastro from '../pages/Cadastro';
import Relatorios from '../pages/Relatorios';
import Admin from '../pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/orcamentos/novo" element={<CriarOrcamento />} />
              <Route path="/orcamentos" element={<ListarOrcamentos />} />
              <Route path="/orcamentos/:id/editar" element={<EditarOrcamento />} />
              <Route path="/vendas" element={<Vendas />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/relatorios" element={<Relatorios />} />

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
