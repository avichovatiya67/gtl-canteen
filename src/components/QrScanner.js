import React, { useCallback, useEffect } from "react";
// import QrReader from "react-qr-scanner";
import { QrReader } from "react-qr-reader";
import { decryptData } from "../utils/crypto";
const MyQrScanner = ({ onScan, setSnackbarData, isLoading }) => {
  let qrData = null;
  let curTime = -1;
  let timeout = null;

  const getTimeDiff = (delay) => {
    const newTime = new Date().getTime();
    const diff = newTime - curTime;
    if (diff >= delay) {
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
            timeout = setTimeout(() => {
              if(timeout) clearTimeout(timeout);
              qrData = null;
            }, 10000);
            if (getTimeDiff(500)) {
              let decryptedData = getDecryptedData(data.text);
              // console.log("Decrypted Data: ", decryptedData);
              onScan(decryptedData);
              curTime = new Date().getTime() + 2000;
            }
          } else {
            let isDiff = getTimeDiff(4000);
            if (isDiff ) {
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
