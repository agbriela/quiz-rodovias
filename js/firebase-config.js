import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAivA8YiJBdVzaVYRx_rh70oTZMwX-BTYs",
  authDomain: "quiz-rodovias.firebaseapp.com",
  projectId: "quiz-rodovias",
  storageBucket: "quiz-rodovias.firebasestorage.app",
  messagingSenderId: "323537134562",
  appId: "1:323537134562:web:b9eb2a61d552bb290bcfbb"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
