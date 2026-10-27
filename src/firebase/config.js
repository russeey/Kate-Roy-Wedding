
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB3Q0DAMp5qJx_hqS7KJEydIHYbs4jphMU',
  authDomain: 'kate-roy.firebaseapp.com',
  projectId: 'kate-roy',
  storageBucket: 'kate-roy.firebasestorage.app',
  messagingSenderId: '358162924370',
  appId: '1:358162924370:web:8d029d549eabbf1b77b08b',
  measurementId: 'G-SKRNG1X7NS'
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)

export default app
