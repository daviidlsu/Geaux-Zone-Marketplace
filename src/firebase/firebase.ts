import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3zPDcZpSCLHx1Nd9QkeTmnPObS8q30u0",
  authDomain: "geaux-zone.firebaseapp.com",
  databaseURL: "https://geaux-zone-default-rtdb.firebaseio.com",
  projectId: "geaux-zone",
  storageBucket: "geaux-zone.firebasestorage.app",
  messagingSenderId: "105074688604",
  appId: "1:105074688604:web:eaa0714167f139239b1c99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore();

export { app, auth, db};