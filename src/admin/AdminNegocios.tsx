import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNegocios, type Negocio } from '../services/negociosService';
import './Admin.css';

function AdminNegocios() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarNegocios();
  }, []);

  const cargarNegocios = async () => {
    try {
      const data = await getNegocios();
      setNegocios(data);
    } catch (error) {
      console.error('Error cargando negocios:', error);
    } finally {
      setLoading(false);
    }
  };

  const negociosFiltrados = negocios.filter(n =>
    n.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    n.direccion.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) {
    return <div className="admin-loading">Cargando negocios...</div>;
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>🏪 Negocios Asociados</h1>
        <Link to="/admin/negocios/nuevo" className="btn-primary">
          ➕ Agregar Negocio
        </Link>
      </header>

      <div className="admin-search">
        <input
          type="text"
          placeholder="Buscar negocio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-number">{negocios.length}</span>
          <span className="stat-label">Total Negocios</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{negocios.filter(n => n.tieneMenu).length}</span>
          <span className="stat-label">Con Menú</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{negocios.filter(n => n.activo).length}</span>
          <span className="stat-label">Activos</span>
        </div>
      </div>

      <div className="negocios-lista">
        {negociosFiltrados.length === 0 ? (
          <div className="empty-state">
            <p>😔 No hay negocios registrados</p>
            <Link to="/admin/negocios/nuevo">Agregar el primero</Link>
          </div>
        ) : (
          negociosFiltrados.map((negocio) => (
            <Link
              key={negocio.id}
              to={`/admin/negocios/${negocio.id}`}
              className="negocio-card"
            >
              <div className="negocio-foto">
                {negocio.foto ? (
                  <img src={negocio.foto} alt={negocio.nombre} />
                ) : (
                  <span>🏪</span>
                )}
              </div>
              
              <div className="negocio-info">
                <h3>{negocio.nombre}</h3>
                <p>{negocio.direccion}</p>
                
                <div className="negocio-badges">
                  {negocio.tieneMenu ? (
                    <span className="badge success">✅ Con Menú</span>
                  ) : (
                    <span className="badge warning">⏳ Sin Menú</span>
                  )}
                  {negocio.activo ? (
                    <span className="badge success">🟢 Activo</span>
                  ) : (
                    <span className="badge error">🔴 Inactivo</span>
                  )}
                </div>
              </div>

              <div className="negocio-codigo">
                <span className="codigo-label">Código</span>
                <span className="codigo-value">{negocio.codigoAcceso}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminNegocios;