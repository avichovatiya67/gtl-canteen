import React, { useState, useEffect } from "react";
import QrScanner from "./QrScanner";
import { db } from "../firebase";
import { Backdrop } from "@mui/material";
import tea from "../assets/ic_tea.png";
import tea_scanned from "../assets/ic_tea_bw.png";
import snacks from "../assets/snacks.png";
import snacks_scanned from "../assets/snacks_bw.png";

const UserPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [morning_tea, evening_tea, evening_snacks] = [tea, tea, snacks];

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

  return (
    <>
      <div className="container text-center mt-3">
        <h5>Please Select Your Menu</h5>
        <div
          className="row mx-auto mt-5 d-flex justify-content-evenly "
          style={{ width: "100%", fontSize: "14px", fontWeight: "bold" }}
        >
          <div
            className="col-md-4 p-3 mb-3 border rounded-3 border-dark d-flex flex-column gap-2 align-items-center"
            style={{ width: "150px", height: "150px" }}
          >
            <img
              height={"80px"}
              width={"80px"}
              src={morning_tea}
              onClick={() => handleProductClick("Tea")}
            />
            MORNING TEA/ COFFEE-120ML
          </div>
          <div
            className="col-md-4 p-3 mb-3 border rounded-3 border-dark d-flex flex-column gap-2 align-items-center"
            style={{ width: "150px", height: "150px" }}
          >
            <img
              height={"80px"}
              width={"80px"}
              src={evening_tea}
              onClick={() => handleProductClick("Coffee")}
              className=""
            />
            EVENING TEA/ COFFEE-120ML
          </div>
          <div
            className="col-md-4 p-3 mb-3 border rounded-3 border-dark d-flex flex-column gap-2 align-items-center mx-auto"
            style={{ width: "150px", height: "150px" }}
          >
            <img
              height={"80px"}
              width={"80px"}
              src={evening_snacks}
              onClick={() => handleProductClick("Snack")}
            />
            PLATE 1
          </div>
        </div>
        {/* <button onClick={() => handleProductClick("Tea")}>Tea</button>
        <button onClick={() => handleProductClick("Coffee")}>Coffee</button>
        <button onClick={() => handleProductClick("Snack")}>Snack</button> */}
        {scannedData && <h3>Scanned QR Code: {scannedData}</h3>}
      </div>
      <Backdrop
        open={selectedProduct !== null}
        className="text-center"
        sx={{ backgroundColor: "rgb(0 0 0 / 80%)" }}
        onClick={() => setSelectedProduct(null)}
      >
        {/* <div
          style={{
            backgroundColor: "black",
            height: "300px",
            width: "300px",
          }}
        >
          Hey
        </div> */}
        {selectedProduct === "Tea" && <QrScanner onScan={handleScanned} />}
        {selectedProduct === "Coffee" && <QrScanner onScan={handleScanned} />}
        {selectedProduct === "Snack" && <QrScanner onScan={handleScanned} />}
      </Backdrop>
    </>
  );
};

export default UserPage;
