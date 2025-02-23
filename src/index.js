// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAVusOJqUZp98eR7imK40VGcowAHPrCMts",
  authDomain: "chatbot-app-8848.firebaseapp.com",
  projectId: "chatbot-app-8848",
  storageBucket: "chatbot-app-8848.firebasestorage.app",
  messagingSenderId: "590283329300",
  appId: "1:590283329300:web:4d417b3f2e38164b5f3c01",
  measurementId: "G-M0BBDX3380"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);