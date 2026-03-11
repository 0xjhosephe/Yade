// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "yadeforecast.firebaseapp.com",
    projectId: "yadeforecast",
    storageBucket: "yadeforecast.firebasestorage.app",
    messagingSenderId: "861847931918",
    appId: "1:861847931918:web:88369027c70270ce8f005f",
    measurementId: "G-2MJVSBY9T9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const functions = getFunctions(app);

// Use emulator if running locally
if (window.location.hostname === "localhost") {
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
