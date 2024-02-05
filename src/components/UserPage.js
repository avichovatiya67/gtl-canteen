import React, { useState, useEffect } from "react";
import QrScanner from "./QrScanner";
import { db } from "../firebase";

const UserPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [scannedData, setScannedData] = useState(null);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleScanned = (data) => {
    const product = selectedProduct; // Use the selected product
    setSelectedProduct(null); // Reset the selected product
    setScannedData(product);
    console.log("Scanned QR Code:", data);
    // Store the scanned data in Firebase
    // db.ref('scannedData').push({
    //   product: data.product, // Adjust this based on your product or use selectedProduct state
    //   qrData: data,
    //   timestamp: Date.now(),
    // });
  };

  // navigator?.mediaDevices
  //   ?.getUserMedia({ video: true })
  //   .then((stream) => {
  //     alert("Camera permission granted");
  //     console.log("Camera permission granted:", stream);
  //   })
  //   .catch((error) => {
  //     // alert("Camera permission denied");
  //     console.log("Camera permission denied:", error);
  //   });

  const getCameraPermission = async () => {
    // await navigator?.mediaDevices
    //   ?.getUserMedia({ video: true })
    //   .then((stream) => {
    //     alert("Camera permission granted");
    //     console.log("Camera permission granted:", stream);
    //   })
    //   .catch((error) => {
    //     alert("Camera permission denied");
    //     console.log("Camera permission denied:", error);
    //   });

    await navigator.permissions
      .query({ name: "camera" })
      .then((permissionStatus) => {
        alert("Camera permission granted 123");
        console.log("Camera permission state:", permissionStatus.state);
      })
      .catch((error) => {
        alert("Camera permission denied 123");
        console.log("Permission query error:", error);
      });
  };

  useEffect(() => {
    getCameraPermission();
  }, []);

  return (
    <div>
      <h1>User Page</h1>
      <button onClick={() => handleProductClick("Tea")}>Tea</button>
      <button onClick={() => handleProductClick("Coffee")}>Coffee</button>
      <button onClick={() => handleProductClick("Snack")}>Snack</button>
      {scannedData && <h3>Scanned QR Code: {scannedData}</h3>}

      {selectedProduct === "Tea" && <QrScanner onScan={handleScanned} />}
      {selectedProduct === "Coffee" && <QrScanner onScan={handleScanned} />}
      {selectedProduct === "Snack" && <QrScanner onScan={handleScanned} />}
    </div>
  );
};

export default UserPage;
