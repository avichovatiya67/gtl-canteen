import { initializeApp } from "firebase/app";
import "firebase/firestore";
import { Firestore } from "firebase/firestore";

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
const app = initializeApp(firebaseConfig);
const db = new Firestore(app);

export { db };
