import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'

/* ── Firebase Configuration from Environment Variables ── */
const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId:             import.meta.env.VITE_FIREBASE_APP_ID || '',
}

export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'YOUR_FIREBASE_PROJECT_ID'
)

// Initialize Firebase App
const app = getApps().length > 0
    ? getApp()
    : initializeApp(
        isFirebaseConfigured
            ? firebaseConfig
            : {
                apiKey: 'demo-api-key-for-local-development',
                authDomain: 'dhruv-pharma-local.firebaseapp.com',
                projectId: 'dhruv-pharma-local',
                storageBucket: 'dhruv-pharma-local.appspot.com',
                messagingSenderId: '123456789012',
                appId: '1:123456789012:web:abcdef123456',
            }
    )

export const auth = getAuth(app)

// Ensure session persistence is set to browser local storage
if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn('Firebase persistence warning:', err)
    })
}

export default app

