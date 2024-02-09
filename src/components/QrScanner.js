import React, { useCallback, useEffect } from "react";
// import QrReader from "react-qr-scanner";
import { QrReader } from "react-qr-reader";
import { decryptData } from "../utils/crypto";
const MyQrScanner = ({ onScan, setSnackbarData, isLoading }) => {
  let qrData = null;
  let curTime = -1;

  const getTimeDiff = () => {
    const newTime = new Date().getTime();
    const diff = newTime - curTime;
    if (diff / 1000 >= 2) {
      curTime = newTime;
      return true;
    } else {
      return false;
    }
  };

  const getDecryptedData = (data) => {
    let decryptedData = decryptData(data);
    return decryptedData;
  };

  const handleScan = useCallback(
    (data, err) => {
      if (data) {
        try {
          if (data.text !== qrData) {
            qrData = data.text;
            setTimeout(() => {
              qrData = null;
            }, 4000);
            let decryptedData = getDecryptedData(data.text);
            onScan(decryptedData);
            // onScan(data.text);
            curTime = new Date().getTime() + 4000;
          } else {
            let isDiff = getTimeDiff();
            if (isDiff && !isLoading) {
              setSnackbarData({
                message: "QR code is already scanned",
                severity: "warning",
              });
            }
          }
        } catch (error) {
          console.log("Error: ", error);
          setSnackbarData({
            message: "Invalid QR code",
            severity: "error",
          });
        }
      }
      if (!!err && JSON.stringify(err) !== JSON.stringify({})) {
        console.log(err);
      }
    },
    [onScan]
  );
  // if (!isLoading) {
  //   if (data) {
  //     // debugger;
  //     setIsLoading(true);
  //     onScan(data.text);
  //   }
  // }

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
      scanDelay={50}
      // onError={handleError}
      onResult={handleScan}
      constraints={{
        facingMode: "environment",
        // sampleRate: {
        //   ideal: 10,
        // },
        // aspectRatio: { ideal: 1 },
      }}
      containerStyle={{
        height: "inherit",
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
