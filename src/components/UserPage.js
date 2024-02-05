import React, { useState, useEffect } from "react";

import tea from "../assets/ic_tea.png";
import tea_scanned from "../assets/ic_tea_bw.png";
import snacks from "../assets/snacks.png";
import snacks_scanned from "../assets/snacks_bw.png";

import QRCode from "react-qr-code";
import { fetchDate } from "../utils/getDate";

const UserPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [morning_tea, evening_tea, evening_snacks] = [tea, tea, snacks];

  const handleProductClick = async (product) => {
    setSelectedProduct(product);
    // generate 5 digit number randomly
    const empId = Math.floor(10000 + Math.random() * 90000);
    const date = await fetchDate();
    var dataForQr = {
      empId,
      product,
      date: new Date(date).toLocaleDateString(),
    };
    setQrData(JSON.stringify(dataForQr));
    console.log("QR Data: ", JSON.stringify(dataForQr));
  };


  // const handleScanned = async (data) => {
  //   const product = selectedProduct; // Use the selected product
  //   setSelectedProduct(null); // Reset the selected product
  //   setScannedData(product);
  //   console.log("Scanned QR Code:", data);
  //   // Store the scanned data in Firebase
  //   let doc = {
  //     empId: 540125,
  //     name: "John Doe",
  //     product: product,
  //     qrData: data,
  //     timestamp: new Date().toDateString(),
  //   };
  //   console.log("doc", doc);
  //   const createdData = await db.collection("scannedData").add(doc);

  //   console.log("Document written with ID: ", createdData);
  // };

  // const getCameraPermission = async () => {
  //   // await navigator?.mediaDevices
  //   //   ?.getUserMedia({ video: true })
  //   //   .then((stream) => {
  //   //     alert("Camera permission granted");
  //   //     console.log("Camera permission granted:", stream);
  //   //   })
  //   //   .catch((error) => {
  //   //     alert("Camera permission denied");
  //   //     console.log("Camera permission denied:", error);
  //   //   });

  //   await navigator.permissions
  //     .query({ name: "camera" })
  //     .then((permissionStatus) => {
  //       // alert("Camera permission granted 123");
  //       console.log("Camera permission state:", permissionStatus.state);
  //     })
  //     .catch((error) => {
  //       // alert("Camera permission denied 123");
  //       console.log("Permission query error:", error);
  //     });
  // };

  // useEffect(() => {
  //   getCameraPermission();
  // }, []);
  const iconSize = {
    height: "80px",
    width: "80px",
  };

  return (
    <>
      <div className="container text-center mt-3">
        <h5>Please Select Your Menu</h5>

        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: "50vh" }}
        >
          {qrData ? (
            <QRCode value={qrData} />
          ) : (
            <h2>What you want to avail ?</h2>
          )}
        </div>

        <h5 className="my-2" style={{ height: "48px" }}>
          {selectedProduct && (
            <>
              Show this QR code to avail <br />
            </>
          )}
          {(selectedProduct
            ? ["Morning", "Evening"].includes(selectedProduct)
              ? selectedProduct + " Tea/Coffee"
              : "Evening Snacks"
            : null) || "Refreshments"}
        </h5>

        <div
          className="row mx-auto d-flex justify-content-center gap-2"
          style={{ width: "100%", fontSize: "10px", fontWeight: "bold" }}
        >
          <div
            className="col-md-4 p-3 mb-3 border rounded-3 border-dark d-flex flex-column gap-2 align-items-center"
            style={{ ...iconSize }}
            onClick={() => handleProductClick("Morning")}
          >
            <img height={"70%"} width={"70%"} src={morning_tea} />
            MORNING
          </div>
          <div
            className="col-md-4 p-3 mb-3 border rounded-3 border-dark d-flex flex-column gap-2 align-items-center"
            style={{ ...iconSize }}
            onClick={() => handleProductClick("Evening")}
          >
            <img height={"70%"} width={"70%"} src={evening_tea} />
            EVENING
          </div>
          <div
            className="col-md-4 p-3 mb-3 border rounded-3 border-dark d-flex flex-column gap-2 align-items-center"
            style={{ ...iconSize }}
            onClick={() => handleProductClick("Snack")}
          >
            <img height={"70%"} width={"70%"} src={evening_snacks} />
            SNACKS
          </div>
        </div>
        {/* <button onClick={() => handleProductClick("Tea")}>Tea</button>
        <button onClick={() => handleProductClick("Coffee")}>Coffee</button>
        <button onClick={() => handleProductClick("Snack")}>Snack</button> */}
        {scannedData && <h3>Scanned QR Code: {scannedData}</h3>}
      </div>
      {/* <Backdrop
        open={selectedProduct !== null}
        // className="text-center"
        sx={{ backgroundColor: "rgb(0 0 0 / 00%)", color: "white" }}
        onClick={() => setSelectedProduct(null)}
      >
        <div style={{height:"100vh"}}>
          {selectedProduct === "Morning" && <QrScanner onScan={handleScanned} />}
          {selectedProduct === "Evening" && <QrScanner onScan={handleScanned} />}
          {selectedProduct === "Snack" && <QrScanner onScan={handleScanned} />}
        </div>
      </Backdrop> */}
    </>
  );
};

export default UserPage;
