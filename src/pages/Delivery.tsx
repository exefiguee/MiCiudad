import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchNearbyPlaces } from '../services/googlePlaces';
import type { PlaceResult } from '../services/googlePlaces';
import './Delivery.css';

function Delivery() {
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'near'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError('');

      // Obtenemos la ubicación del usuario
      const locationData = localStorage.getItem('userLocation');
      
      if (!locationData) {
        setError('No tenemos tu ubicación. Por favor, activá el GPS.');
        setLoading(false);
        return;
      }

      const { latitude, longitude } = JSON.parse(locationData);

      // Buscamos restaurantes/deliverys cercanos
      const results = await searchNearbyPlaces(
        latitude,
        longitude,
        'restaurant',
        10000, // 10km de radio
        'delivery'
      );

      setPlaces(results);
      setLoading(false);
    } catch (err) {
      console.error('Error cargando deliveries:', err);
      setError('Error al cargar los deliveries. Intentá nuevamente.');
      setLoading(false);
    }
  };

  // Filtrar lugares según el filtro activo
  const getFilteredPlaces = () => {
    let filtered = places;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(place =>
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (filter === 'open') {
      filtered = filtered.filter(place => place.isOpen === true);
    } else if (filter === 'near') {
      filtered = filtered.filter(place => (place.distance || 0) <= 3); // <= 3km
    }

    return filtered;
  };

  const filteredPlaces = getFilteredPlaces();

  if (loading) {
    return (
      <div className="delivery-container">
        <div className="delivery-loading">
          <div className="spinner"></div>
          <p>Buscando deliveries cercanos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-container">
      {/* Header */}
      <header className="delivery-header">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Volver
        </button>
        <h1>🛵 Delivery</h1>
      </header>

      {/* Buscador */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Buscar por nombre o dirección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Filtros */}
      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({places.length})
        </button>
        <button
          className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
          onClick={() => setFilter('open')}
        >
          Abiertos ahora
        </button>
        <button
          className={`filter-btn ${filter === 'near' ? 'active' : ''}`}
          onClick={() => setFilter('near')}
        >
          Cerca (≤3km)
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadDeliveries} className="retry-btn">
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de lugares */}
      <div className="places-list">
        {filteredPlaces.length === 0 ? (
          <div className="no-results">
            <p>😔 No encontramos deliveries con esos filtros</p>
            <button onClick={() => { setFilter('all'); setSearchTerm(''); }} className="clear-filters-btn">
              Limpiar filtros
            </button>
          </div>
        ) : (
          filteredPlaces.map((place) => (
            <div key={place.placeId} className="place-card">
              {place.photoUrl && (
                <div className="place-image">
                  <img src={place.photoUrl} alt={place.name} />
                  {place.isOpen !== undefined && (
                    <span className={`status-badge ${place.isOpen ? 'open' : 'closed'}`}>
                      {place.isOpen ? '🟢 Abierto' : '🔴 Cerrado'}
                    </span>
                  )}
                </div>
              )}
              
              <div className="place-info">
                <h3>{place.name}</h3>
                <p className="place-address">📍 {place.address}</p>
                
                <div className="place-meta">
                  {place.rating && (
                    <span className="rating">⭐ {place.rating}</span>
                  )}
                  {place.distance && (
                    <span className="distance">📏 {place.distance} km</span>
                  )}
                </div>

                <div className="place-actions">
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}&query_place_id=${place.placeId}`, '_blank')}
                    className="action-btn primary"
                  >
                    Ver en Maps
                  </button>
                  {place.phone && (
                    <button
                      onClick={() => window.open(`tel:${place.phone}`)}
                      className="action-btn"
                    >
                      📞 Llamar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Delivery;