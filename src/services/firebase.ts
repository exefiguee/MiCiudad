import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth,GoogleAuthProvider  } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC0u-LoJuQAd7rQ_rXff7S1zC2PhJ-en8g",
  authDomain: "miciudad-2e1a4.firebaseapp.com",
  projectId: "miciudad-2e1a4",
  storageBucket: "miciudad-2e1a4.firebasestorage.app",
  messagingSenderId: "660429924958",
  appId: "1:660429924958:web:ff3f4d65db5836fa7762cf",
  measurementId: "G-7Y5DNKTK76"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();