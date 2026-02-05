import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import type { PlaceResult } from './googlePlaces';

export interface Partner extends PlaceResult {
    slug?: string;    
  telefono?: string;
  whatsapp?: string;
  logo?: string;
  categorias?: string[];
  horarios?: Record<string, { abre: string; cierra: string }>;
  tieneMenu?: boolean;
}

export interface MenuItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  foto?: string;
  categoria: string;
  disponible: boolean;
  orden: number;
}

// Obtener negocios asociados activos


// Obtener negocios asociados activos (FILTRADOS POR UBICACIÓN)
export async function getPartnerBusinesses(
  userLat?: number,
  userLng?: number,
  maxDistanceKm: number = 50 // ✅ Solo negocios a menos de 50km
): Promise<Partner[]> {
  try {
    const q = query(
      collection(db, 'negocios'),
      where('isPartner', '==', true),
      where('activo', '==', true)
    );

    const snapshot = await getDocs(q);
    
    const partners: Partner[] = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Calcular distancia si tenemos ubicación del usuario
      let distance: number | undefined;
      if (userLat && userLng && data.ubicacion) {
        distance = calculateDistance(
          userLat, 
          userLng, 
          data.ubicacion.lat, 
          data.ubicacion.lng
        );
        
        // ✅ FILTRO: Solo agregar si está dentro del radio
        if (distance > maxDistanceKm) {
          return; // Skip este negocio, está muy lejos
        }
      } else if (userLat && userLng) {
        // Si el negocio no tiene ubicación, no lo mostramos
        return;
      }

      // Verificar si está abierto según horarios
      const isOpen = checkIfOpen(data.horarios);

      partners.push({
        placeId: doc.id,
        name: data.nombre,
        address: data.direccion,
        phone: data.telefono,
        rating: data.rating,
        photoUrl: data.foto,
        location: data.ubicacion || { lat: 0, lng: 0 },
        distance,
        isOpen,
        isPartner: true,
        slug: data.slug, // ✅ No olvides el slug!
        whatsapp: data.whatsapp,
        logo: data.logo,
        categorias: data.categorias,
        horarios: data.horarios,
        tieneMenu: data.tieneMenu,
      });
    });

    // Ordenar por distancia (más cercanos primero)
    return partners.sort((a, b) => (a.distance || 999) - (b.distance || 999));
  } catch (error) {
    console.error('Error cargando partners:', error);
    return [];
  }
}
// Obtener menú de un negocio
export async function getPartnerMenu(negocioId: string): Promise<MenuItem[]> {
  try {
    const q = query(
      collection(db, 'negocios', negocioId, 'menu'),
      where('disponible', '==', true),
      orderBy('orden')
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MenuItem[];
  } catch (error) {
    console.error('Error cargando menú:', error);
    return [];
  }
}

// Obtener detalle de un negocio
export async function getPartnerById(negocioId: string): Promise<Partner | null> {
  try {
    const docRef = doc(db, 'negocios', negocioId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    
    return {
      placeId: docSnap.id,
      name: data.nombre,
      address: data.direccion,
      phone: data.telefono,
      rating: data.rating,
      photoUrl: data.foto,
      location: data.ubicacion || { lat: 0, lng: 0 },
      isOpen: checkIfOpen(data.horarios),
      isPartner: true,
      whatsapp: data.whatsapp,
      logo: data.logo,
      categorias: data.categorias,
      horarios: data.horarios,
      tieneMenu: data.tieneMenu,
    };
  } catch (error) {
    console.error('Error cargando partner:', error);
    return null;
  }
}

// Helpers
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

function checkIfOpen(horarios?: Record<string, { abre: string; cierra: string }>): boolean {
  if (!horarios) return true; // Si no hay horarios, asumimos abierto

  const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const now = new Date();
  const diaActual = dias[now.getDay()];
  const horaActual = now.getHours() * 100 + now.getMinutes();

  const horarioHoy = horarios[diaActual];
  if (!horarioHoy) return false;

  const abre = parseInt(horarioHoy.abre.replace(':', ''));
  const cierra = parseInt(horarioHoy.cierra.replace(':', ''));

  // Manejar horarios que cruzan medianoche
  if (cierra < abre) {
    return horaActual >= abre || horaActual <= cierra;
  }

  return horaActual >= abre && horaActual <= cierra;
}