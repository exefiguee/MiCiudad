import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearNegocio, getNegocioById } from '../services/negociosService';
import { getPlaceDetails } from '../services/googlePlaces';
import './Admin.css';

function AdminNegocioForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    email: '',
    foto: '',
    rating: 0,
    lat: '',
    lng: '',
    categorias: '',
    placeIdGoogle: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🆕 Buscar negocio por Place ID
  const buscarPorPlaceId = async () => {
    if (!form.placeIdGoogle.trim()) {
      alert('Poné el Place ID primero');
      return;
    }

    setBuscando(true);

    try {
      const details = await getPlaceDetails(form.placeIdGoogle.trim());
      
      if (details) {
        setForm({
          ...form,
          nombre: details.name || form.nombre,
          direccion: details.formatted_address || form.direccion,
          telefono: details.formatted_phone_number || form.telefono,
          whatsapp: details.formatted_phone_number || form.whatsapp,
          rating: details.rating || 0,
          lat: details.geometry?.location?.lat()?.toString() || form.lat,
          lng: details.geometry?.location?.lng()?.toString() || form.lng,
          foto: details.photos?.[0]?.getUrl({ maxWidth: 800 }) || form.foto
        });
        
        alert('✅ Datos cargados desde Google!');
      } else {
        alert('❌ No se encontró el negocio');
      }
    } catch (error) {
      console.error('Error buscando:', error);
      alert('❌ Error al buscar. Verificá el Place ID.');
    } finally {
      setBuscando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const negocioData = {
        nombre: form.nombre,
        direccion: form.direccion,
        telefono: form.telefono,
        whatsapp: form.whatsapp || form.telefono,
        email: form.email,
        foto: form.foto,
        rating: parseFloat(form.rating.toString()) || 0,
        ubicacion: {
          lat: parseFloat(form.lat) || 0,
          lng: parseFloat(form.lng) || 0
        },
        categorias: form.categorias.split(',').map(c => c.trim()).filter(Boolean),
        placeIdGoogle: form.placeIdGoogle,
        isPartner: true,
        tieneMenu: false,
        activo: true
      };

      console.log('📦 Guardando:', negocioData); // Debug

      const id = await crearNegocio(negocioData);
      console.log('✅ Creado con ID:', id); // Debug
      
      // Obtener el código generado
      const negocio = await getNegocioById(id);
      setCodigoGenerado(negocio?.codigoAcceso || null);
      
    } catch (error) {
      console.error('❌ Error creando negocio:', error);
      alert('Error al crear el negocio. Revisá la consola.');
    } finally {
      setLoading(false);
    }
  };

  
  // Mostrar código generado
  if (codigoGenerado) {
    return (
      <div className="admin-page">
        <div className="codigo-generado">
          <div className="codigo-icono">🎉</div>
          <h2>¡Negocio Agregado!</h2>
          <p>Compartí este código con <strong>{form.nombre}</strong> para que puedan subir su menú:</p>
          
          <div className="codigo-box">
            <span className="codigo">{codigoGenerado}</span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(codigoGenerado);
                alert('✅ Código copiado!');
              }}
              className="btn-copiar"
            >
              📋 Copiar
            </button>
          </div>

          <div className="codigo-instrucciones">
            <h4>Instrucciones para el negocio:</h4>
            <ol>
              <li>Ir a <strong>{window.location.origin}/negocio</strong></li>
              <li>Ingresar el código: <strong>{codigoGenerado}</strong></li>
              <li>Cargar sus productos y menú</li>
            </ol>
          </div>

          <div className="codigo-actions">
            <button onClick={() => navigate('/admin/negocios')} className="btn-secondary">
              Ver Negocios
            </button>
            <button onClick={() => {
              setCodigoGenerado(null);
              setForm({
                nombre: '', direccion: '', telefono: '', whatsapp: '',
                email: '', foto: '', rating: 0, lat: '', lng: '',
                categorias: '', placeIdGoogle: ''
              });
            }} className="btn-primary">
              Agregar Otro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>➕ Agregar Negocio</h1>
      </header>

      <form onSubmit={handleSubmit} className="admin-form">
        
        {/* 🆕 Búsqueda por Place ID primero */}
        <div className="form-section">
          <h3>🔍 Buscar en Google (opcional)</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Si tenés el Place ID, pegalo acá y los datos se cargan automáticamente
          </p>
          
          <div className="form-group">
            <label>Place ID de Google</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                name="placeIdGoogle"
                value={form.placeIdGoogle}
                onChange={handleChange}
                placeholder="ChIJ..."
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                onClick={buscarPorPlaceId}
                disabled={buscando || !form.placeIdGoogle.trim()}
                className="btn-primary"
                style={{ whiteSpace: 'nowrap' }}
              >
                {buscando ? '🔄 Buscando...' : '🔍 Buscar'}
              </button>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>📋 Información Básica</h3>
          
          <div className="form-group">
            <label>Nombre del Negocio *</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Antojos Factory"
              required
            />
          </div>

          <div className="form-group">
            <label>Dirección *</label>
            <input
              type="text"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Ej: Ruta 38, Concepción"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Teléfono *</label>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+54 3865 123456"
                required
              />
            </div>
            <div className="form-group">
              <label>WhatsApp</label>
              <input
                type="tel"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="+54 3865 123456"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="negocio@email.com"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>📍 Ubicación</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Latitud</label>
              <input
                type="text"
                name="lat"
                value={form.lat}
                onChange={handleChange}
                placeholder="-27.3445"
              />
            </div>
            <div className="form-group">
              <label>Longitud</label>
              <input
                type="text"
                name="lng"
                value={form.lng}
                onChange={handleChange}
                placeholder="-65.5920"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>🏷️ Detalles</h3>

          <div className="form-group">
            <label>URL de Foto</label>
            <input
              type="url"
              name="foto"
              value={form.foto}
              onChange={handleChange}
              placeholder="https://..."
            />
            {form.foto && (
              <img 
                src={form.foto} 
                alt="Preview" 
                style={{ 
                  marginTop: '0.5rem', 
                  maxWidth: '200px', 
                  borderRadius: '8px' 
                }} 
              />
            )}
          </div>

          <div className="form-group">
            <label>Rating (0-5)</label>
            <input
              type="number"
              name="rating"
              value={form.rating}
              onChange={handleChange}
              min="0"
              max="5"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label>Categorías (separadas por coma)</label>
            <input
              type="text"
              name="categorias"
              value={form.categorias}
              onChange={handleChange}
              placeholder="hamburguesas, pizzas, delivery"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Guardando...' : '✅ Crear Negocio'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminNegocioForm;