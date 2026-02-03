import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Location.css';

function Location() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const requestLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Guardamos la ubicación en localStorage
        localStorage.setItem('userLocation', JSON.stringify({ latitude, longitude }));
        setLoading(false);
        navigate('/');
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Necesitamos tu ubicación para mostrarte negocios cercanos');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('No pudimos obtener tu ubicación. Intentá nuevamente.');
            break;
          case error.TIMEOUT:
            setError('Se agotó el tiempo de espera. Intentá nuevamente.');
            break;
          default:
            setError('Ocurrió un error al obtener tu ubicación');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="location-container">
      <div className="location-card">
        <div className="location-icon">
          📍
        </div>
        
        <h1>Activá tu ubicación</h1>
        <p className="location-description">
          Necesitamos acceso a tu ubicación para mostrarte los negocios y servicios más cercanos a vos.
        </p>

        {error && (
          <div className="location-error">
            ⚠️ {error}
          </div>
        )}

        <button 
          onClick={requestLocation} 
          className="location-btn"
          disabled={loading}
        >
          {loading ? 'Obteniendo ubicación...' : '📍 Activar GPS'}
        </button>

        <button 
          onClick={() => navigate('/')} 
          className="location-skip-btn"
        >
          Continuar sin ubicación
        </button>

        <p className="location-note">
          Tu ubicación solo se usa para mostrarte resultados cercanos. No la compartimos con terceros.
        </p>
      </div>
    </div>
  );
}

export default Location;