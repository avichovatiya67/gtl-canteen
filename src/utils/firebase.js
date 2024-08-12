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
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function getMaxCountData() {
  try {
    const maxCountCollectionRef = db.collection('config');
    const querySnapshot = await maxCountCollectionRef.limit(1).get();

    if (querySnapshot.empty) {
      console.log('No data found in maxCount collection');
      return null;
    }

    const firstDoc = querySnapshot.docs[0];
    const data = firstDoc.data();
    return data;
  } catch (error) {
    console.error('Error getting max count data:', error);
    return null;
  }
}

export { db, getMaxCountData };
