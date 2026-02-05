import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchNearbyPlaces } from '../services/googlePlaces';
import { getPartnerBusinesses } from '../services/partnerService';
import type { PlaceResult } from '../services/googlePlaces';
import type { Partner } from '../services/partnerService';
import './Delivery.css';

const INITIAL_RADIUS = 2000;
const MAX_RADIUS = 15000;
const RADIUS_INCREMENT = 3000;
const FIREBASE_TIMEOUT = 3000; // ✅ 3 segundos máximo para Firebase

function Delivery() {
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'near' | 'partners'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentRadius, setCurrentRadius] = useState(INITIAL_RADIUS);
  const [hasMore, setHasMore] = useState(true);
  
  const navigate = useNavigate();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  useEffect(() => {
    if (loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreDeliveries();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore]);

  // ✅ Helper: timeout para promesas
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
  };

  const loadDeliveries = async () => {
    console.log('🚀 Iniciando carga...');
    
    try {
      setLoading(true);
      setError('');
      setDebugInfo('Obteniendo ubicación...');

      const locationData = localStorage.getItem('userLocation');
      if (!locationData) {
        setError('No tenemos tu ubicación. Por favor, activá el GPS.');
        setLoading(false);
        return;
      }

      const { latitude, longitude } = JSON.parse(locationData);
      console.log('📍 Ubicación:', latitude, longitude);

      // ✅ ESTRATEGIA 1: Cargar Google Places PRIMERO (más confiable)
      console.log('⏳ Cargando Google Places (prioritario)...');
      setDebugInfo('Buscando restaurantes cercanos...');
      
      const startGoogle = Date.now();
      const googleResults = await searchNearbyPlaces(
        latitude, 
        longitude, 
        'restaurant', 
        INITIAL_RADIUS, 
        'delivery'
      );
      const googleTime = Date.now() - startGoogle;
      
      console.log(`✅ Google Places cargados en ${googleTime}ms:`, googleResults.length);
      
      // Mostrar resultados inmediatamente
      setPlaces(googleResults);
      setCurrentRadius(INITIAL_RADIUS);
      setHasMore(googleResults.length >= 20 || currentRadius < MAX_RADIUS);
      setLoading(false); // ✅ Ya mostramos contenido
      
      // ✅ ESTRATEGIA 2: Cargar Firebase en SEGUNDO PLANO con timeout
      console.log('⏳ Cargando partners en segundo plano...');
      setDebugInfo('Cargando negocios asociados...');
      
      try {
        const startPartners = Date.now();
        const partnerResults = await withTimeout(
          getPartnerBusinesses(latitude, longitude),
          FIREBASE_TIMEOUT
        );
        const partnersTime = Date.now() - startPartners;
        
        console.log(`✅ Partners cargados en ${partnersTime}ms:`, partnerResults.length);
        setPartners(partnerResults);
        setDebugInfo('');
      } catch (partnerError) {
        console.warn('⚠️ Firebase timeout o error (continuando sin partners):', partnerError);
        setDebugInfo('');
        // No mostramos error al usuario, solo continuamos sin partners
      }
      
    } catch (err) {
      console.error('❌ Error cargando deliveries:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Desconocido'}`);
      setDebugInfo(`Error: ${err}`);
      setLoading(false);
    }
  };

const loadMoreDeliveries = async () => {
  if (loadingMore || !hasMore) return;

  try {
    setLoadingMore(true);

    const locationData = localStorage.getItem('userLocation');
    if (!locationData) return;

    const { latitude, longitude } = JSON.parse(locationData);
    const newRadius = Math.min(currentRadius + RADIUS_INCREMENT, MAX_RADIUS);
    
    if (newRadius === currentRadius) {
      setHasMore(false);
      return;
    }

    console.log(`🔄 Expandiendo radio: ${currentRadius}m → ${newRadius}m`);
    
    const results = await searchNearbyPlaces(
      latitude,
      longitude,
      'restaurant',
      newRadius,
      'delivery'
    );

    console.log(`📦 Total resultados: ${results.length}`);

    // ✅ Usar callback para evitar stale closure
    setPlaces(prev => {
      const existingIds = new Set(prev.map(p => p.placeId));
      const newPlaces = results.filter(p => !existingIds.has(p.placeId));
      
      console.log(`✨ Nuevos únicos: ${newPlaces.length}`);
      
      if (newPlaces.length > 0) {
        return [...prev, ...newPlaces];
      }
      return prev;
    });

    setCurrentRadius(newRadius);
    setHasMore(newRadius < MAX_RADIUS && results.length >= 20);
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    setLoadingMore(false);
  }
};

  const getFilteredPlaces = () => {
    let filtered = places;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(place =>
        place.name.toLowerCase().includes(term) ||
        place.address.toLowerCase().includes(term)
      );
    }

    switch (filter) {
      case 'open':
        filtered = filtered.filter(place => place.isOpen === true);
        break;
      case 'near':
        filtered = filtered.filter(place => (place.distance || 0) <= 3);
        break;
      case 'partners':
        return partners;
    }

    return filtered;
  };

const handlePlaceClick = (place: PlaceResult | Partner) => {
  console.log('📍 Place:', place);
  
  localStorage.setItem('selectedPlace', JSON.stringify(place));
  
  // Si es partner y tiene slug, usar slug
  if ('slug' in place && place.slug) {
    navigate(`/delivery/${place.slug}`);
  } else {
    navigate(`/delivery/${place.placeId}`);
  }
};
  const filteredPlaces = getFilteredPlaces();
  const openCount = places.filter(p => p.isOpen === true).length;

  if (loading) {
    return (
      <div className="delivery-container">
        <div className="delivery-loading">
          <div className="spinner"></div>
          <p>Buscando deliveries cercanos...</p>
          {debugInfo && (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              {debugInfo}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-container">
      <header className="delivery-header">
        <button onClick={() => navigate('/')} className="back-btn">
          ←
        </button>
        <h1>🛵 Delivery</h1>
      </header>

      <div className="search-box">
        <input
          type="text"
          placeholder="Buscar restaurante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({places.length})
        </button>
        <button
          className={`filter-btn partner ${filter === 'partners' ? 'active' : ''}`}
          onClick={() => setFilter('partners')}
        >
          ⭐ Con Menú ({partners.length})
        </button>
        <button
          className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
          onClick={() => setFilter('open')}
        >
          Abiertos ({openCount})
        </button>
        <button
          className={`filter-btn ${filter === 'near' ? 'active' : ''}`}
          onClick={() => setFilter('near')}
        >
          Cerca (&lt;3km)
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadDeliveries} className="retry-btn">
            Reintentar
          </button>
        </div>
      )}

      {filter === 'all' && partners.length > 0 && !searchTerm && (
        <div className="partners-section">
          <h2 className="section-title">⭐ Negocios con Menú</h2>
          <div className="partners-scroll">
            {partners.map((place) => (
              <div
                key={place.placeId}
                className="partner-card"
                onClick={() => handlePlaceClick(place)}
              >
                <div className="partner-image">
                  {place.photoUrl && <img src={place.photoUrl} alt={place.name} />}
                  <span className="partner-badge">⭐ Menú</span>
                </div>
                <div className="partner-info">
                  <h4>{place.name}</h4>
                  <span className="partner-meta">
                    ★ {place.rating || 'N/A'} · {place.distance?.toFixed(1) || '?'} km
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="places-list">
        {filteredPlaces.length === 0 ? (
          <div className="no-results">
            <p>😔 No encontramos deliveries</p>
            <button 
              onClick={() => { 
                setFilter('all'); 
                setSearchTerm(''); 
              }} 
              className="clear-filters-btn"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          filteredPlaces.map((place) => (
            <div
              key={place.placeId}
              className="place-card"
              onClick={() => handlePlaceClick(place)}
            >
              <div className="place-image">
                {place.photoUrl ? (
                  <img src={place.photoUrl} alt={place.name} loading="lazy" />
                ) : (
                  <div className="place-image-placeholder">🍔</div>
                )}
                {place.isPartner && (
                  <span className="partner-badge-small">⭐</span>
                )}
                {place.isOpen !== undefined && (
                  <span className={`status-badge ${place.isOpen ? 'open' : 'closed'}`}>
                    {place.isOpen ? 'Abierto' : 'Cerrado'}
                  </span>
                )}
              </div>

              <div className="place-info">
                <h3>{place.name}</h3>
                <p className="place-address">{place.address}</p>
                <div className="place-meta">
                  {place.rating && (
                    <span className="rating">
                      <span className="rating-star">★</span> {place.rating}
                    </span>
                  )}
                  {place.distance && (
                    <span className="distance">{place.distance} km</span>
                  )}
                  <span className="delivery-time">30-45 min</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filter === 'all' && !searchTerm && (
        <div ref={loadMoreRef} className="load-more">
          {loadingMore ? (
            <>
              <div className="spinner-small"></div>
              <p>Buscando más negocios...</p>
            </>
          ) : hasMore ? (
            <p>Deslizá para ver más</p>
          ) : (
            <div className="end-results">
              <span>🏁</span>
              <p>Eso es todo por ahora</p>
              <span className="end-subtitle">
                Encontramos {places.length} negocios en un radio de {currentRadius/1000}km
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Delivery;