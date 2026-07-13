import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import {
    getFirestore
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAivA8YiJBdVzaVYRx_rh70oTZMwX-BTYs",
  authDomain: "quiz-rodovias.firebaseapp.com",
  projectId: "quiz-rodovias",
  storageBucket: "quiz-rodovias.firebasestorage.app",
  messagingSenderId: "323537134562",
  appId: "1:323537134562:web:b9eb2a61d552bb290bcfbb",
  measurementId: "G-DNSVXJC643"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
