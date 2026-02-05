import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,

  
  } from 'firebase/firestore';
import { db } from './firebase';

export interface Negocio {
  id?: string;
  nombre: string;
  direccion: string;
  telefono: string;
  slug?: string; // 👈 NUEVO
  whatsapp: string;
  email: string;
  foto: string;
  logo?: string;
  rating: number;
  ubicacion: {
    lat: number;
    lng: number;
  };
  categorias: string[];
  placeIdGoogle?: string;
  isPartner: boolean;
  tieneMenu: boolean;
  activo: boolean;
  // Credenciales para el negocio
  codigoAcceso?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface MenuItem {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  foto?: string;
  categoria: string;
  disponible: boolean;
  orden: number;
}

// ============ NEGOCIOS ============

// Obtener todos los negocios
export async function getNegocios(): Promise<Negocio[]> {
  const q = query(collection(db, 'negocios'), orderBy('nombre'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Negocio[];
}

// Obtener un negocio por ID
export async function getNegocioById(id: string): Promise<Negocio | null> {
  const docRef = doc(db, 'negocios', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Negocio;
}

// Obtener negocio por código de acceso (para login de negocios)
export async function getNegocioByCodigo(codigo: string): Promise<Negocio | null> {
  const q = query(collection(db, 'negocios'), where('codigoAcceso', '==', codigo));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Negocio;
}

// Crear negocio
// En la función crearNegocio
export async function crearNegocio(negocio: Omit<Negocio, 'id'>): Promise<string> {
  try {
    const codigoAcceso = generarCodigoAcceso();
    
    console.log('🔥 Intentando guardar en Firestore...');
    console.log('📱 DB instance:', db);
    console.log('🌐 Project ID:', db.app.options.projectId);
    
    // Agregar timeout de 10 segundos
    const savePromise = addDoc(collection(db, 'negocios'), {
      ...negocio,
      
      codigoAcceso,
      isPartner: true,
      
      tieneMenu: false,
      activo: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('⏱️ Timeout: Firebase no responde en 10 segundos. Revisa las reglas de Firestore.')), 10000);
    });

    const docRef = await Promise.race([savePromise, timeoutPromise]) as any;
    
    console.log('✅ Guardado! ID:', docRef.id);
    return docRef.id;
    
  } catch (error: any) {
    console.error('❌ Error completo:', error);
    console.error('📋 Error code:', error?.code);
    console.error('💬 Error message:', error?.message);
    
    // Mensaje más claro para el usuario
    if (error.message?.includes('Timeout')) {
      throw new Error('No se pudo guardar. Verifica las reglas de Firestore en Firebase Console.');
    }
    throw error;
  }
}
// Obtener negocio por slug
export async function getNegocioBySlug(slug: string): Promise<Negocio | null> {
  const q = query(collection(db, 'negocios'), where('slug', '==', slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Negocio;
}
// Actualizar negocio
export async function actualizarNegocio(id: string, data: Partial<Negocio>): Promise<void> {
  const docRef = doc(db, 'negocios', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
}

// Eliminar negocio
export async function eliminarNegocio(id: string): Promise<void> {
  await deleteDoc(doc(db, 'negocios', id));
}

// ============ MENÚ ============

// Obtener menú de un negocio
export async function getMenuNegocio(negocioId: string): Promise<MenuItem[]> {
  const q = query(
    collection(db, 'negocios', negocioId, 'menu'),
    orderBy('categoria'),
    orderBy('orden')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MenuItem[];
}

// Agregar item al menú
export async function agregarMenuItem(negocioId: string, item: Omit<MenuItem, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'negocios', negocioId, 'menu'), item);
  
  // Marcar que tiene menú
  await actualizarNegocio(negocioId, { tieneMenu: true });
  
  return docRef.id;
}

// Actualizar item del menú
export async function actualizarMenuItem(
  negocioId: string,
  itemId: string,
  data: Partial<MenuItem>
): Promise<void> {
  const docRef = doc(db, 'negocios', negocioId, 'menu', itemId);
  await updateDoc(docRef, data);
}

// Eliminar item del menú
export async function eliminarMenuItem(negocioId: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'negocios', negocioId, 'menu', itemId));
}

// ============ HELPERS ============

function generarCodigoAcceso(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}