import { CircularProgress } from "@mui/material";
import React, { useState, useEffect } from "react";
// import QrReader from "react-qr-scanner";
import { QrReader } from "react-qr-reader";
const MyQrScanner = ({ onScan }) => {
  //   const [result, setResult] = useState(null);

  const handleScan = (data) => {
    if (data) {
      //   setResult(data.text);
      onScan(data.text); // You can send the data to Firebase or handle it as needed
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  //   useEffect(() => {
  //     setResult(null);
  //     return () => {
  //       setResult(null);
  //     };
  //   }, []);

  return (
    <QrReader
      scanDelay={2000}
      onError={handleError}
      onResult={handleScan}
      constraints={{
        facingMode: "environment",
      }}
      containerStyle={{
        height:"inherit"
      }}
      videoContainerStyle={{
        padding: "0",
      }}
      videoStyle={{
        position: "relative",
        height: "inherit",
        width: "inherit",
      }}
    />
  );
};

export default MyQrScanner;
