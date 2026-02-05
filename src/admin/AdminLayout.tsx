import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Admin.css';

// Emails autorizados como admin (ponés el tuyo)
const ADMIN_EMAILS = ['exefiguee@gmail.com'];

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Verificar si es admin
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  if (!user) {
    return (
      <div className="admin-login">
        <h2>🔐 Acceso Admin</h2>
        <p>Iniciá sesión para continuar</p>
        <button onClick={() => navigate('/login')}>Iniciar Sesión</button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-login">
        <h2>⛔ Acceso Denegado</h2>
        <p>No tenés permisos de administrador</p>
        <button onClick={logout}>Cerrar Sesión</button>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>🏪 Admin</h2>
          <span>MiCiudad</span>
        </div>
        
        <nav className="admin-nav">
          <NavLink to="/admin" end>
            📊 Dashboard
          </NavLink>
          <NavLink to="/admin/negocios">
            🏪 Negocios
          </NavLink>
          <NavLink to="/admin/negocios/nuevo">
            ➕ Agregar Negocio
          </NavLink>
        </nav>

        <div className="admin-user">
          <img src={user.photoURL || '/default-avatar.png'} alt="Avatar" />
          <span>{user.displayName}</span>
          <button onClick={logout}>Salir</button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;