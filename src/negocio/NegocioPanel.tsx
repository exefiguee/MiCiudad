import { useState, useEffect } from 'react';
import { getNegocioByCodigo, getMenuNegocio, type Negocio, type MenuItem } from '../services/negociosService';
import NegocioMenu from './NegocioMenu';
import './Negocio.css';

function NegocioPanel() {
  const [codigo, setCodigo] = useState('');
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar si ya hay sesión guardada
  useEffect(() => {
    const savedNegocioId = localStorage.getItem('negocioId');
    const savedCodigo = localStorage.getItem('negocioCodigo');
    void savedNegocioId
    
    if (savedCodigo) {
      setCodigo(savedCodigo);
      handleLogin(savedCodigo);
    }
  }, []);

  const handleLogin = async (codigoAcceso?: string) => {
    const codigoUsar = codigoAcceso || codigo;
    if (!codigoUsar.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await getNegocioByCodigo(codigoUsar.toUpperCase());
      
      if (!result) {
        setError('Código inválido. Verificá e intentá de nuevo.');
        return;
      }

      setNegocio(result);
      localStorage.setItem('negocioId', result.id!);
      localStorage.setItem('negocioCodigo', codigoUsar.toUpperCase());

      // Cargar menú
      const menuData = await getMenuNegocio(result.id!);
      setMenu(menuData);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setNegocio(null);
    setMenu([]);
    setCodigo('');
    localStorage.removeItem('negocioId');
    localStorage.removeItem('negocioCodigo');
  };

  // Pantalla de login
  if (!negocio) {
    return (
      <div className="negocio-login">
        <div className="login-card">
          <div className="login-icon">🏪</div>
          <h1>Panel de Negocio</h1>
          <p>Ingresá el código que te dieron para acceder</p>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              className="codigo-input"
            />
            
            {error && <p className="error-msg">{error}</p>}
            
            <button type="submit" disabled={loading || codigo.length < 6}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>

          <p className="login-help">
            ¿No tenés código? Contactanos para registrar tu negocio.
          </p>
        </div>
      </div>
    );
  }

  // Panel del negocio
  return (
    <div className="negocio-panel">
      <header className="negocio-header">
        <div className="negocio-header-info">
          {negocio.foto && <img src={negocio.foto} alt={negocio.nombre} />}
          <div>
            <h1>{negocio.nombre}</h1>
            <p>{negocio.direccion}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Salir
        </button>
      </header>

      <div className="negocio-stats">
        <div className="stat">
          <span className="stat-num">{menu.length}</span>
          <span className="stat-label">Productos</span>
        </div>
        <div className="stat">
          <span className="stat-num">{menu.filter(m => m.disponible).length}</span>
          <span className="stat-label">Disponibles</span>
        </div>
        <div className="stat">
          <span className={`stat-status ${negocio.activo ? 'active' : ''}`}>
            {negocio.activo ? '🟢 Activo' : '🔴 Inactivo'}
          </span>
        </div>
      </div>

      <NegocioMenu 
        negocioId={negocio.id!} 
        menu={menu} 
        onMenuUpdate={(newMenu) => setMenu(newMenu)} 
      />
    </div>
  );
}

export default NegocioPanel;