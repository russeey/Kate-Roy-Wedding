
import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
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

isSupported()
  .then((supported) => {
    if (supported) {
      getAnalytics(app)
    }
  })
  .catch((error) => {
    console.error('Analytics initialization failed:', error)
  })

export default app
