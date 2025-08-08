import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { getDatabase } from "firebase/database"

const env = import.meta.env

const FIREBASE_ENV = {
  API_KEY: env.VITE_FIREBASE_API_KEY,
  AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN,
  PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID,
  STORAGE_BUCKET: env.VITE_FIREBASE_STORAGE_BUCKET,
  MESSAGING_SENDER_ID: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  APP_ID: env.VITE_FIREBASE_APP_ID,
  DATABASE_URL: env.VITE_FIREBASE_DATABASE_URL
}

// Ensure all required Firebase environment variables are set
if (Object.values(FIREBASE_ENV).some((value) => !value)) {
  throw new Error(
    "Missing required Firebase environment variables. Please check your .env file."
  )
}

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: FIREBASE_ENV.API_KEY,
  authDomain: FIREBASE_ENV.AUTH_DOMAIN,
  projectId: FIREBASE_ENV.PROJECT_ID,
  storageBucket: FIREBASE_ENV.STORAGE_BUCKET,
  messagingSenderId: FIREBASE_ENV.MESSAGING_SENDER_ID,
  appId: FIREBASE_ENV.APP_ID,
  databaseURL: FIREBASE_ENV.DATABASE_URL
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const storage = getStorage(app)
export const db = getDatabase(app)
