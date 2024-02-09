import React, { useEffect, useState, useRef } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { collection, doc, getDocs, onSnapshot, orderBy, query, setDoc, where } from "firebase/firestore";
import { db } from "../utils/firebase";
import QrScanner from "./QrScanner";
import { fetchDate, getDDMMYYYY } from "../utils/getDate";
import { Alert, Backdrop, CircularProgress, Fab, Snackbar } from "@mui/material";
import { yellow } from "@mui/material/colors";
import VerifiedIcon from "@mui/icons-material/Verified";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import { LocalizationProvider, MobileDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const VendorPage = () => {
  const [scannedUsers, setScannedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrimaryLoading, setIsPrimaryLoading] = useState(true);
  const [snackbarData, setSnackbarData] = useState(null);
  const [scannedCount, setScannedCount] = useState(null);
  const [highlightIndex, setHighlightIndex] = useState(null);

  // State for Date Filter
  const [dateFilter, setDateFilter] = useState(null);
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  const qrScannerRef = useRef(null);
  // const [qrScannerDiv, setQrScannerDiv] = useState(null);

  const verifyProductStatus = (doc, product) => {
    const prodMap = {
      Morning: "isMorning",
      Evening: "isEvening",
      Snack: "isSnack",
    };
    return doc[prodMap[product]];
  };

  const verifyData = async (data) => {
    const q = query(collection(db, "scannedData"), where("empId", "==", data.empId), where("date", "==", data.date));
    const doc_refs = await getDocs(q);

    if (doc_refs.size === 0) return null; // No records exists
    else {
      const doc = doc_refs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))[0];
      return doc; // Return the first record
    }
  };

  const handleScanned = async (data) => {
    // debugger;
    try {
      if (isLoading) return;
      setIsLoading(true);
      data = data && typeof data === "object" ? data : null;
      const date = await fetchDate();
      const formattedDate = getDDMMYYYY(date);

      // Store the scanned data in Firebase
      if (data?.date === formattedDate) {
        let newDoc = {
          empId: data.empId,
          name: data.name,
          isMorning: data.product === "Morning",
          isEvening: data.product === "Evening",
          isSnack: data.product === "Snack",
          date: formattedDate,
          created: firebase.firestore.FieldValue.serverTimestamp(),
          modified: firebase.firestore.FieldValue.serverTimestamp(),
        };

        var existingDoc = await verifyData(newDoc, data.product);
        if (existingDoc) {
          const productStatus = verifyProductStatus(existingDoc, data.product);
          if (productStatus) {
            // Already Availed
            setSnackbarData({ message: "Already Availed!", severity: "error" });
            // console.log("Already Availed!");
          } else {
            // Entry Exists but not Availed
            const updatedDoc = {
              modified: firebase.firestore.FieldValue.serverTimestamp(),
            };
            if (data.product === "Morning") updatedDoc.isMorning = true;
            else if (data.product === "Evening") updatedDoc.isEvening = true;
            else if (data.product === "Snack") updatedDoc.isSnack = true;
            const modifiedData = await db.collection("scannedData").doc(existingDoc.id).update(updatedDoc);
            setSnackbarData({ message: "Scan Verified!", severity: "success" });
            // console.log("Document modified with ID: ", modifiedData);
          }
        } else {
          // New Entry
          // const createdData = await setDoc(doc(db, "scannedData", newDoc.empId+''), newDoc)
          const createdData = await db.collection("scannedData").add(newDoc);
          setSnackbarData({ message: "Scan Verified!", severity: "success" });
          // console.log("Document written with ID: ", createdData);
        }
      } else {
        const reqDate = data.date.split("/");
        const reqDateObj = new Date(reqDate[2], reqDate[1] - 1, reqDate[0]);
        if (reqDateObj < new Date(date)) {
          // QR Code Expired
          console.log("QR Code Expired!");
          setSnackbarData({ message: "QR Code Expired!", severity: "error" });
        } else {
          // Invalid QR Code
          console.log("Invalid QR Code!");
          setSnackbarData({ message: "Invalid QR Code!", severity: "error" });
        }
      }
    } catch (error) {
      console.log("Error: ", error.message);
      setSnackbarData({ message: "Invalid QR Code!", severity: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch and listen for updates from Firebase for Today's Data
  useEffect(() => {
    let unsub;
    const getData = async () => {
      const dateToday = await fetchDate();
      const formattedDate = getDDMMYYYY(dateToday);
      const q = query(collection(db, "scannedData"), where("date", "==", formattedDate), orderBy("modified", "desc"));
      unsub = onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.size) {
          const data = querySnapshot.docs.map((doc) => doc.data());
          setScannedUsers(data);
          setHighlightIndex(0);
          setScannedCount({
            morning: data.filter((user) => user.isMorning).length,
            evening: data.filter((user) => user.isEvening).length,
            snack: data.filter((user) => user.isSnack).length,
          });
        }
        setIsPrimaryLoading(false);
      });
    };
    getData();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Fetch Filtered Data from Firebase
  useEffect(() => {
    if (dateFilter) {
      setIsPrimaryLoading(true);
      const q = query(collection(db, "scannedData"), where("date", "==", dateFilter), orderBy("modified", "desc"));

      // Fetch the data from Firebase on Date Change only once without snapshot
      getDocs(q).then((querySnapshot) => {
        if (querySnapshot.size) {
          const data = querySnapshot.docs.map((doc) => doc.data());
          setScannedUsers(data);
          setScannedCount({
            morning: data.filter((user) => user.isMorning).length,
            evening: data.filter((user) => user.isEvening).length,
            snack: data.filter((user) => user.isSnack).length,
          });
        } else {
          setScannedUsers([]);
          setScannedCount({
            morning: 0,
            evening: 0,
            snack: 0,
          });
        }
        setIsPrimaryLoading(false);
      });

      // const unsub = onSnapshot(q, (querySnapshot) => {
      //   console.log("q===>", querySnapshot);
      //   if (querySnapshot.size) {
      //     const data = querySnapshot.docs.map((doc) => doc.data());
      //     setScannedUsers(data);
      //     setScannedCount({
      //       morning: data.filter((user) => user.isMorning).length,
      //       evening: data.filter((user) => user.isEvening).length,
      //       snack: data.filter((user) => user.isSnack).length,
      //     });
      //   }
      //   setIsPrimaryLoading(false);
      // });

      // return () => unsub();
    }
  }, [dateFilter]);

  // // Calculate Div Height for Loader
  // useEffect(() => {
  //   const handleLoad = () => {
  //     const divHeight = qrScannerRef.current?.getBoundingClientRect().height;
  //     if (divHeight >= qrScannerDiv) setQrScannerDiv(divHeight);
  //   };
  //   setTimeout(handleLoad, 1000);
  // }, [qrScannerDiv]);

  useEffect(() => {
    // Highlight the topmost card for 3 seconds
    const highlightTimeout = setTimeout(() => {
      setHighlightIndex(null);
    }, 3000);

    return () => {
      clearTimeout(highlightTimeout);
    };
  }, [highlightIndex]);

  return (
    <>
      <div className="container-fluid p-2">
        {/* Todays Item Box */}

        {/* Scanner Section with Counts */}
        <div style={{ position: "relative" }} className="d-flex align-items-center justify-content-center m-3">
          {/* Scanner and Loader */}
          <div
            ref={qrScannerRef}
            className="d-flex align-items-center justify-content-center"
            style={{
              borderRadius: "10px",
              boxShadow: "0px 0px 10px 0px #000000",
              overflow: "hidden",
              // height: qrScannerDiv + "px",
              // height: window.screen.width - 50,
              width: "100%",
            }}
          >
            {isLoading && (
              <div
                className={"d-flex align-items-center justify-content-center"}
                style={{
                  position: "absolute",
                  zIndex: 1000,
                  height: "100%",
                  width: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  borderRadius: "10px",
                }}
              >
                <CircularProgress size={50} thickness={4} />
              </div>
            )}
            <QrScanner
              onScan={!isLoading ? handleScanned : null}
              setSnackbarData={setSnackbarData}
              isLoading={isLoading}
              // style={{ width: window.screen.width }}
            />
            {/* )} */}
          </div>
          {/* Counts */}
          <div
            className="d-flex p-1 justify-content-around align-items-center"
            style={{
              borderRadius: "10px 10px 10px 10px",
              position: "absolute",
              bottom: "0px",
              // backgroundColor: "rgba(255, 255, 255, 0.5)",
              width: "100%",
            }}
          >
            {Object.keys(scannedCount || {}).map((key, index) => (
              <Fab size="large" key={index} variant="extended">
                <div className="d-flex flex-column justify-content-center align-items-center">
                  <h1 className="m-0 p-0 text-center" style={{ lineHeight: 0.5 }}>
                    {scannedCount[key]}
                  </h1>
                  <h6 className="text-muted text-capitalize" style={{ marginBottom: "-5px", lineHeight: 1 }}>
                    {key}
                  </h6>
                </div>
              </Fab>
            ))}
          </div>
        </div>

        {/* Detail Cards */}
        <div>
          {scannedUsers.length ? (
            scannedUsers.map((user, index) => (
              <DetailsCard user={user} key={index} id={index} highlightIndex={highlightIndex} />
            ))
          ) : (
            <div className="d-flex justify-content-center align-items-center">
              <h6>No Data Found!</h6>
            </div>
          )}
        </div>

        {/* Calendar Filter Button */}
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
          }}
        >
          <Fab
            onClick={() => setDatePickerOpen(!isDatePickerOpen)}
            style={{
              backgroundColor: yellow[700],
            }}
          >
            <div>
              <h1 className="m-0 p-0 text-center" style={{ lineHeight: 1 }}>
                {dateFilter ? dateFilter.slice(0, 2) : getDDMMYYYY(new Date()).slice(0, 2)}
              </h1>
              <h6 className="text-capitalize" style={{ marginBottom: "-5px", lineHeight: 1 }}>
                {dateFilter
                  ? months[parseInt(dateFilter.slice(3, 5)) - 1]
                  : months[parseInt(getDDMMYYYY(new Date()).slice(3, 5)) - 1]}
              </h6>
            </div>

            <div
              className="invisible"
              style={{
                position: "absolute",
                bottom: "0px",
                right: "0px",
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileDatePicker
                  open={isDatePickerOpen}
                  closeOnSelect={true}
                  disableFuture={true}
                  onClose={() => setDatePickerOpen(false)}
                  onAccept={(date) => {
                    setDatePickerOpen(false);
                    setDateFilter(getDDMMYYYY(date));
                  }}
                />
              </LocalizationProvider>
            </div>
          </Fab>
        </div>
      </div>

      <Snackbar open={Boolean(snackbarData?.message)} autoHideDuration={2000} onClose={() => setSnackbarData(null)}>
        {snackbarData?.severity && (
          <Alert
            onClose={() => setSnackbarData(null)}
            severity={snackbarData?.severity || "info"}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbarData?.message}
          </Alert>
        )}
      </Snackbar>

      {isPrimaryLoading && (
        <Backdrop
          open={true}
          style={{
            zIndex: 10000,
            color: "white",
          }}
        >
          <CircularProgress color={"inherit"} size={"50px"} />
        </Backdrop>
      )}
    </>
  );
};

const DetailsCard = ({ user, highlightIndex, id }) => {
  return (
    <div
      className="card m-2"
      style={{
        transition: "background-color 2s ease",
        backgroundColor: id !== highlightIndex ? "transparent" : "#4caf50",
      }}
    >
      <div className="card-body p-2">
        <h6 className="d-flex justify-content-between">
          <div>{user.name}</div>
          <div className="text-secondary">{new Date(user.created?.seconds * 1000).toTimeString().slice(0, 5)}</div>
        </h6>
        <div className="d-flex justify-content-around">
          {["isMorning", "isEvening", "isSnack"].map((key, index) => (
            <div key={index} className="d-flex flex-column justify-content-end align-items-center">
              {user[key] ? <VerifiedIcon color="success" /> : <NewReleasesIcon color="disabled" />}
              <>{key.slice(2)}</>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorPage;

{
  /* <div className="d-flex flex-column justify-content-end align-items-center">
  {user.isMorning ? (
    <VerifiedIcon color="success" />
  ) : (
    <NewReleasesIcon color="warning" />
  )}
  <>Morning</>
</div>
<div className="d-flex flex-column justify-content-end align-items-center">
  {user.isEvening ? (
    <VerifiedIcon color="success" />
  ) : (
    <NewReleasesIcon color="warning" />
  )}
  <>Evening</>
</div>
<div className="d-flex flex-column justify-content-end align-items-center">
  {user.isSnack ? (
    <VerifiedIcon color="success" />
  ) : (
    <NewReleasesIcon color="warning" />
  )}
  <>Snacks</>
</div> */
}
