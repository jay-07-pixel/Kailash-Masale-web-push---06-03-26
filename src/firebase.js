import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAl_0EEqbKQE4uSwsAkz19fxSwh0iKSO_k',
  authDomain: 'kailash-masale.firebaseapp.com',
  projectId: 'kailash-masale',
  storageBucket: 'kailash-masale.firebasestorage.app',
  messagingSenderId: '837297988577',
  appId: '1:837297988577:web:8cdaa5d718f79f2614a8a0',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export default app
