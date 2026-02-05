import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPlaceDetails } from '../services/googlePlaces';
import { getNegocios, getMenuNegocio, type MenuItem } from '../services/negociosService'; // 👈 AQUÍ
import type { PlaceResult } from '../services/googlePlaces';
import './PlaceDetail.css';

interface PlaceDetails {
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  rating?: number;
  website?: string;
  opening_hours?: {
    weekday_text: string[];
    isOpen: () => boolean;
  };
  photos?: google.maps.places.PlacePhoto[];
  reviews?: google.maps.places.PlaceReview[];
}

function PlaceDetail() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]); // 👈 AGREGAR ESTA LÍNEA

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'info' | 'reviews'>('menu');

  useEffect(() => {
    // Cargar datos básicos del localStorage
    const savedPlace = localStorage.getItem('selectedPlace');
    if (savedPlace) {
      setPlace(JSON.parse(savedPlace));
    }

    // Cargar detalles de Google
    if (placeId) {
      loadDetails(placeId);
      loadMenu(placeId);;
    }
  }, [placeId]);

  const loadDetails = async (id: string) => {
    try {
      const result = await getPlaceDetails(id);
      setDetails(result);
    } catch (error) {
      console.error('Error cargando detalles:', error);
    } finally {
      setLoading(false);
    }
  };

  
const loadMenu = async (slugOrId: string) => {
  try {
    console.log('🔍 Buscando negocio:', slugOrId);
    
    const negocios = await getNegocios();
    
    // Buscar por slug, ID de Firestore, O placeIdGoogle
    const negocio = negocios.find(n => 
      n.slug === slugOrId ||
      n.id === slugOrId || 
      n.placeIdGoogle === slugOrId
    );
    
    if (negocio && negocio.id) {
      console.log('✅ Negocio encontrado:', negocio);
      const menuData = await getMenuNegocio(negocio.id);
      setMenu(menuData);
      console.log('✅ Menú cargado:', menuData);
    } else {
      console.log('❌ No se encontró negocio');
    }
  } catch (error) {
    console.error('Error cargando menú:', error);
  }
};

  const openInMaps = () => {
    if (place) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}&query_place_id=${place.placeId}`,
        '_blank'
      );
    }
  };

  const callPlace = () => {
    if (details?.formatted_phone_number) {
      window.open(`tel:${details.formatted_phone_number}`);
    }
  };

  if (loading || !place) {
    return (
      <div className="detail-container">
        <div className="detail-loading">
          <div className="spinner"></div>
          <p>Cargando negocio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-container">
      {/* Header con imagen */}
      <div className="detail-header">
        <div className="detail-header-image">
          {place.photoUrl ? (
            <img src={place.photoUrl} alt={place.name} />
          ) : (
            <div className="detail-header-placeholder">🍔</div>
          )}
          <div className="detail-header-overlay" />
        </div>
        
        <button onClick={() => navigate(-1)} className="detail-back-btn">
          ←
        </button>

        <div className="detail-header-info">
          {place.isOpen !== undefined && (
            <span className={`detail-status ${place.isOpen ? 'open' : 'closed'}`}>
              {place.isOpen ? '🟢 Abierto' : '🔴 Cerrado'}
            </span>
          )}
          <h1>{place.name}</h1>
          
          <div className="detail-meta">
            {place.rating && (
              <span className="detail-rating">★ {place.rating}</span>
            )}
            {place.distance && (
              <span className="detail-distance">📍 {place.distance} km</span>
            )}
            <span className="detail-time">🕐 30-45 min</span>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="detail-actions">
        <button onClick={openInMaps} className="detail-action-btn">
          <span className="action-icon">📍</span>
          <span>Cómo llegar</span>
        </button>
        
        {details?.formatted_phone_number && (
          <button onClick={callPlace} className="detail-action-btn">
            <span className="action-icon">📞</span>
            <span>Llamar</span>
          </button>
        )}
        
        <button className="detail-action-btn">
          <span className="action-icon">❤️</span>
          <span>Favorito</span>
        </button>
        
        <button className="detail-action-btn">
          <span className="action-icon">↗️</span>
          <span>Compartir</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Menú
        </button>
        <button
          className={`detail-tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Información
        </button>
        <button
          className={`detail-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reseñas
        </button>
      </div>

      {/* Contenido del tab */}
      <div className="detail-content">
       {activeTab === 'menu' && (
  <div className="menu-section">
    {menu && menu.length > 0 ? (
      <div className="menu-list">
        {/* Agrupar por categoría */}
        {Array.from(new Set(menu.map(item => item.categoria))).map(categoria => (
          <div key={categoria} className="menu-category">
            <h3>{categoria}</h3>
            {menu
              .filter(item => item.categoria === categoria && item.disponible)
              .map(item => (
                <div key={item.id} className="menu-item">
                  <div className="menu-item-info">
                    <h4>{item.nombre}</h4>
                    <p>{item.descripcion}</p>
                    <span className="menu-item-price">${item.precio}</span>
                  </div>
                  {item.foto && (
                    <img src={item.foto} alt={item.nombre} className="menu-item-image" />
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
    ) : (
      <div className="menu-placeholder">
        <div className="menu-placeholder-icon">🍽️</div>
        <h3>Menú próximamente</h3>
        <p>Estamos trabajando para traerte el menú de este negocio</p>
      </div>
    )}
  </div>
)}

        {activeTab === 'info' && (
          <div className="info-section">
            <div className="info-item">
              <span className="info-icon">📍</span>
              <div>
                <strong>Dirección</strong>
                <p>{details?.formatted_address || place.address}</p>
              </div>
            </div>
            
            {details?.formatted_phone_number && (
              <div className="info-item">
                <span className="info-icon">📞</span>
                <div>
                  <strong>Teléfono</strong>
                  <p>{details.formatted_phone_number}</p>
                </div>
              </div>
            )}

            {details?.opening_hours?.weekday_text && (
              <div className="info-item">
                <span className="info-icon">🕐</span>
                <div>
                  <strong>Horarios</strong>
                  {details.opening_hours.weekday_text.map((day, i) => (
                    <p key={i} className="schedule-day">{day}</p>
                  ))}
                </div>
              </div>
            )}

            {details?.website && (
              <div className="info-item">
                <span className="info-icon">🌐</span>
                <div>
                  <strong>Sitio web</strong>
                  <a href={details.website} target="_blank" rel="noopener noreferrer">
                    {details.website}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

       {activeTab === 'reviews' && (
  <div className="reviews-section">
    {details?.reviews && details.reviews.length > 0 ? (
      details.reviews.map((review, index) => {
        const rating = review.rating ?? 0;
        
        return (
          <div key={index} className="review-card">
            <div className="review-header">
              <img 
                src={review.profile_photo_url || '/default-avatar.png'} 
                alt={review.author_name}
                className="review-avatar"
              />
              <div>
                <strong>{review.author_name}</strong>
                <div className="review-rating">
                  {'★'.repeat(rating)}
                  {'☆'.repeat(5 - rating)}
                </div>
              </div>
            </div>
            <p className="review-text">{review.text}</p>
            <span className="review-time">{review.relative_time_description}</span>
          </div>
        );
      })
    ) : (
      <div className="no-reviews">
        <p>😔 Sin reseñas disponibles</p>
      </div>
    )}
  </div>
)}
      </div>
    </div>
  );
}

export default PlaceDetail;