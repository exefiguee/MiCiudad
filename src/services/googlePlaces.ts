/// <reference types="google.maps" />

const GOOGLE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY++
;

export interface PlaceResult {
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  photoUrl?: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number;
  isOpen?: boolean;
  placeId: string;
}

// Función para calcular distancia entre dos puntos (en km)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function loadGoogleMapsScript() {
  if (typeof google !== 'undefined' && google.maps) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}

export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  type: string,
  radius: number = 5000, // 5km por defecto
  keyword?: string
): Promise<PlaceResult[]> {
  try {
    await loadGoogleMapsScript();
    
    const service = new google.maps.places.PlacesService(
      document.createElement('div')
    );

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(lat, lng),
        radius,
        type,
      };

      if (keyword) {
        request.keyword = keyword;
      }

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const places: PlaceResult[] = results.map((place) => {
            const placeLat = place.geometry?.location?.lat() || 0;
            const placeLng = place.geometry?.location?.lng() || 0;
            const distance = calculateDistance(lat, lng, placeLat, placeLng);

            return {
              name: place.name || 'Sin nombre',
              address: place.vicinity || 'Sin dirección',
              rating: place.rating,
              photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400 }),
              location: {
                lat: placeLat,
                lng: placeLng,
              },
              distance: parseFloat(distance.toFixed(2)),
              isOpen: place.opening_hours?.isOpen(),
              placeId: place.place_id || '',
            };
          });

          // Ordenar por distancia
          places.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          resolve(places);
        } else {
          reject(new Error(`Error en búsqueda: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Error loading Google Maps:', error);
    throw error;
  }
}

// Obtener detalles completos de un lugar
export async function getPlaceDetails(placeId: string): Promise<any> {
  await loadGoogleMapsScript();
  
  const service = new google.maps.places.PlacesService(
    document.createElement('div')
  );

  return new Promise((resolve, reject) => {
    service.getDetails(
      {
        placeId,
        fields: [
          'name',
          'formatted_address',
          'formatted_phone_number',
          'opening_hours',
          'website',
          'rating',
          'reviews',
          'photos',
        ],
      },
      (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(result);
        } else {
          reject(new Error(`Error obteniendo detalles: ${status}`));
        }
      }
    );
  });
}