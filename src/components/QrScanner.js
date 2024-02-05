import React, { useState, useEffect } from "react";
import QrReader from "react-qr-scanner";

const QrScanner = ({ onScan }) => {
  const [result, setResult] = useState(null);

  const handleScan = (data) => {
    if (data) {
      console.log(data);
      setResult(data.text);
      onScan(data.text); // You can send the data to Firebase or handle it as needed
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  useEffect(() => {
    setResult(null);

    return () => {
      // Clean up resources (e.g., stop the camera) when the component is unmounted
      setResult(null);
    };
  }, []);

  return (
    <div>
      <QrReader
        delay={2000}
        onError={handleError}
        onScan={handleScan}
        style={{ width: "300px" }}
        // constraints={{
        //     facingMode: 'environment'
        // }}
      />
      {result && <p>Scanned QR Code: {result}</p>}
    </div>
  );
};

export default QrScanner;
