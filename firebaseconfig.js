// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCvqUSWfcMqaO-2YQYBh-gB5FgeaTtHhks",
  authDomain: "covech-fd89a.firebaseapp.com",
  projectId: "covech-fd89a",
  storageBucket: "covech-fd89a.appspot.com",
  messagingSenderId: "1094414052621",
  appId: "1:1094414052621:web:5d9cc43bcbf001900a9444",
  measurementId: "G-6S81T43FQN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
