
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnAXFNAdbSdmQu1_M094OWrcRh-NjPBBI",
  authDomain: "chaos-chicc-de-roche.firebaseapp.com",
  projectId: "chaos-chicc-de-roche",
  storageBucket: "chaos-chicc-de-roche.firebasestorage.app",
  messagingSenderId: "567580725236",
  appId: "1:567580725236:web:9ce3633f64a09fdc50b3a1",
  measurementId: "G-9Y1LEVZQCP"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
