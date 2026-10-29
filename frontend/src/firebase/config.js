
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    browserLocalPersistence,
    setPersistence
} from 'firebase/auth';

// Firebase configuration from the frontend/.env file
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check whether the required Firebase settings exist
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

// Prevent the app from silently using fake Firebase credentials
if (!isFirebaseConfigured) {
    throw new Error(
        'Firebase is not configured. Check the frontend/.env file.'
    );
}

// Initialize Firebase only once
const app = getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Keep authentication persistent in the browser
if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.warn('Firebase persistence warning:', error);
    });
}

export default app;
