import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_STORAGE_BUCKET",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID",
// };

const firebaseConfig = {
  apiKey: "AIzaSyAzK-PeNqxjG_z17hvxEN4d_B9NBWAewAg",
  authDomain: "gtl-canteen.firebaseapp.com",
  projectId: "gtl-canteen",
  storageBucket: "gtl-canteen.appspot.com",
  messagingSenderId: "115410252401",
  appId: "1:115410252401:web:cc3e7f835d0dfd55cde1d0",
  measurementId: "G-MKXK0Q76G0",
};

// Configure Firebase Details for Yash's Project
// const firebaseConfig = {
//   apiKey: "AIzaSyBkWU_7vWrgRx0Dc5cDaSTe9hG6C2AR1bQ",
//   authDomain: "reactapp-32963.firebaseapp.com",
//   databaseURL: "https://reactapp-32963-default-rtdb.firebaseio.com",
//   projectId: "reactapp-32963",
//   storageBucket: "reactapp-32963.appspot.com",
//   messagingSenderId: "527706986382",
//   appId: "1:527706986382:web:8e316d8f6aefee664bf6df",
//   measurementId: "G-9LB8XE3TWZ"
// };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

export { db };
