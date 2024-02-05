import React, { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import QrScanner from "./QrScanner";
import { fetchDate } from "../utils/getDate";
import { CircularProgress } from "@mui/material";

const VendorPage = () => {
  const [scannedUsers, setScannedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch and listen for updates from Firebase
    // const unsubscribe = db.collection('scannedUsers').onSnapshot((snapshot) => {
    //   const users = snapshot.docs.map((doc) => doc.data());
    //   setScannedUsers(users);
    // });
    const unsub = onSnapshot(collection(db, "scannedData"), (querySnapshot) => {
      console.log(
        querySnapshot.size,
        "Current data: ",
        querySnapshot.docs.map((doc) => doc.data())
      );
      if (querySnapshot.size) {
        const data = querySnapshot.docs.map((doc) => doc.data());
        setScannedUsers(data);
      }
      // if(querySnapshot.exists()){
      //   console.log("Data: ", querySnapshot.data());
      // }
      // const data = querySnapshot.docs.map((doc) => {
      //   console.log("doc", doc.data());
      //   return doc.data();
      // });
      // setScannedUsers(data);
    });

    return () => unsub();
    // db.collection('scannedData')
    //   .get()
    //   .then((querySnapshot) => {
    //     const data = querySnapshot.docs.map((doc) => {
    //       console.log("doc", doc.data());
    //       return doc.data();
    //     });
    //     setScannedUsers(data);
    //   });
  }, []);

  const handleScanned = async (data) => {
    if(isLoading) return;
    setIsLoading(true);
    console.log("Scanned QR Code:", JSON.parse(data));
    data = JSON.parse(data);

    // Store the scanned data in Firebase
    const date = await fetchDate();
    if (data.date === new Date(date).toLocaleDateString()) {
      let doc = {
        empId: data.empId,
        name: "John Doe",
        product: data.product,
        date: new Date(date).toLocaleDateString(),
        created: firebase.firestore.FieldValue.serverTimestamp(),
      };
      console.log("doc", doc);
      const createdData = await db.collection("scannedData").add(doc);
      console.log("Document written with ID: ", createdData);
    }
    setIsLoading(false);
  };

  return (
    <div>
      {isLoading ? <CircularProgress /> : <QrScanner onScan={handleScanned} />}
      <h1>Vendor Page</h1>
      <ul>
        {scannedUsers.map((user, index) => (
          <li key={index}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default VendorPage;
