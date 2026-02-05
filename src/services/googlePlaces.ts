/// <reference types="google.maps" />

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
  isPartner?: boolean; // 🆕 Negocio asociado
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof google !== 'undefined' && google.maps && google.maps.places) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const checkPlaces = setInterval(() => {
        if (google.maps.places) {
          clearInterval(checkPlaces);
          resolve();
        }
      }, 50);
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

// 🆕 Tipo para el resultado con paginación
export interface PlacesSearchResult {
  places: PlaceResult[];
  hasMore: boolean;
  loadMore: (() => Promise<PlacesSearchResult>) | null;
}

// 🆕 Búsqueda con soporte de paginación
export async function searchNearbyPlacesWithPagination(
  lat: number,
  lng: number,
  type: string,
  radius: number = 5000,
  keyword?: string
): Promise<PlacesSearchResult> {
  await loadGoogleMapsScript();

  const mapDiv = document.createElement('div');
  const service = new google.maps.places.PlacesService(mapDiv);

  return new Promise((resolve, reject) => {
    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(lat, lng),
      radius,
      type,
    };

    if (keyword) {
      request.keyword = keyword;
    }

    service.nearbySearch(request, (results, status, pagination) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const places = mapResultsToPlaces(results, lat, lng);
        
        resolve({
          places,
          hasMore: pagination?.hasNextPage || false,
          loadMore: pagination?.hasNextPage 
            ? () => loadNextPage(pagination, lat, lng)
            : null
        });
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve({ places: [], hasMore: false, loadMore: null });
      } else {
        reject(new Error(`Error en búsqueda: ${status}`));
      }
    });
  });
}

function loadNextPage(
  pagination: google.maps.places.PlaceSearchPagination,
  lat: number,
  lng: number
): Promise<PlacesSearchResult> {
  return new Promise((resolve) => {
    void resolve
    // Google requiere delay antes de la siguiente página
    setTimeout(() => {
      pagination.nextPage();
    }, 300);

    // Escuchar el callback (esto es un hack porque nextPage no retorna promesa)


    // Mejor approach: usar el callback directamente
    const originalNextPage = pagination.nextPage.bind(pagination);
    void lat
   void lng
    setTimeout(() => {
      originalNextPage();
    }, 300);
  });
}

function mapResultsToPlaces(
  results: google.maps.places.PlaceResult[],
  lat: number,
  lng: number
): PlaceResult[] {
  return results.map((place) => {
    const placeLat = place.geometry?.location?.lat() || 0;
    const placeLng = place.geometry?.location?.lng() || 0;
    const distance = calculateDistance(lat, lng, placeLat, placeLng);

    let isOpen: boolean | undefined = undefined;
    try {
      if (place.opening_hours) {
        isOpen = place.opening_hours.isOpen();
      }
    } catch (e) {
      isOpen = undefined;
    }

    return {
      name: place.name || 'Sin nombre',
      address: place.vicinity || 'Sin dirección',
      rating: place.rating,
      photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400 }),
      location: { lat: placeLat, lng: placeLng },
      distance: parseFloat(distance.toFixed(2)),
      isOpen,
      placeId: place.place_id || '',
      isPartner: false,
    };
  }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

// Mantener la función original para compatibilidad
export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  type: string,
  radius: number = 5000,
  keyword?: string
): Promise<PlaceResult[]> {
  const result = await searchNearbyPlacesWithPagination(lat, lng, type, radius, keyword);
  return result.places;
}

export async function getPlaceDetails(placeId: string): Promise<any> {
  await loadGoogleMapsScript();

  const mapDiv = document.createElement('div');
  const service = new google.maps.places.PlacesService(mapDiv);

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