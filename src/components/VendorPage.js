import React, { useEffect, useState, useRef } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import QrScanner from "./QrScanner";
import { fetchDate } from "../utils/getDate";
import {
  Alert,
  Backdrop,
  CircularProgress,
  Fab,
  Snackbar,
} from "@mui/material";
import { yellow } from "@mui/material/colors";
import VerifiedIcon from "@mui/icons-material/Verified";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import {
  CalendarIcon,
  DateField,
  DatePicker,
  LocalizationProvider,
  MobileDatePicker,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
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

  const verifyData = async (data, product) => {
    const prodMap = {
      Morning: "isMorning",
      Evening: "isEvening",
      Snack: "isSnack",
    };
    const q = query(
      collection(db, "scannedData"),
      where("empId", "==", data.empId),
      where("date", "==", data.date)
      // where(prodMap[product], "==", true)
    );
    const doc_refs = await getDocs(q);

    if (doc_refs.size === 0) return 0;
    else {
      const doc = doc_refs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))[0];
      console.log("docId===>", doc);
      if (doc[prodMap[product]]) return 1;
      else return doc;
    }
  };

  const handleScanned = async (data) => {
    try {
      if (isLoading) return;
      setIsLoading(true);
      const date = await fetchDate();

      // console.log("Scanned QR Code:", JSON.parse(data));
      data = data ? JSON.parse(data) : null;

      // Store the scanned data in Firebase
      if (data?.date === new Date(date).toLocaleDateString()) {
        let newDoc = {
          empId: data.empId,
          name: data.name,
          isMorning: false,
          isEvening: false,
          isSnack: false,
          // product: data.product,
          date: new Date(date).toLocaleDateString(),
          created: firebase.firestore.FieldValue.serverTimestamp(),
          modified: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (data.product === "Morning") newDoc.isMorning = true;
        else if (data.product === "Evening") newDoc.isEvening = true;
        else if (data.product === "Snack") newDoc.isSnack = true;

        var ifExists = await verifyData(newDoc, data.product);
        if (ifExists === 1) {
          // Already Availed
          console.log("Data already exists!");
          setSnackbarData({ message: "Already Availed!", severity: "error" });
        } else if (ifExists === 0) {
          // New Entry
          setSnackbarData({ message: "Scan Verified!", severity: "success" });
          const createdData = await db.collection("scannedData").add(newDoc);
          console.log("Document written with ID: ", createdData);
        } else {
          // Entry Exists but not Availed
          const updatedDoc = {
            ...ifExists,
            modified: firebase.firestore.FieldValue.serverTimestamp(),
          };
          if (data.product === "Morning") updatedDoc.isMorning = true;
          else if (data.product === "Evening") updatedDoc.isEvening = true;
          else if (data.product === "Snack") updatedDoc.isSnack = true;
          const modifiedData = await db
            .collection("scannedData")
            .doc(ifExists.id)
            .set(updatedDoc);
          console.log("Document modified with ID: ", modifiedData);
          // console.log(ifExists.id, "Document modified with ID: ", updatedDoc);
          setSnackbarData({ message: "Scan Verified!", severity: "success" });
        }
      } else {
        console.log("QR Code Expired!");
        setSnackbarData({ message: "QR Code Expired!", severity: "error" });
      }
    } catch (error) {
      console.log("Error: ", error);
      setSnackbarData({ message: "Something went wrong!", severity: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch and listen for updates from Firebase for Today's Data
  useEffect(async () => {
    // Fetch and listen for updates from Firebase
    const dateToday = await fetchDate();
    const q = query(
      collection(db, "scannedData"),
      where("date", "==", dateToday.toLocaleDateString()),
      orderBy("modified", "desc")
    );
    const unsub = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.size) {
        const data = querySnapshot.docs.map((doc) => doc.data());
        // setScannedUsers(data);
        setHighlightIndex(0);
        setScannedCount({
          morning: data.filter((user) => user.isMorning).length,
          evening: data.filter((user) => user.isEvening).length,
          snack: data.filter((user) => user.isSnack).length,
        });
      }
      setIsPrimaryLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch Filtered Data from Firebase
  useEffect(() => {
    if (dateFilter) {
      setIsPrimaryLoading(true);
      const q = query(
        collection(db, "scannedData"),
        where("date", "==", dateFilter),
        orderBy("modified", "desc")
      );

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
        <div
          style={{ position: "relative" }}
          className="d-flex align-items-center justify-content-center m-3"
        >
          {/* Scanner and Loader */}
          <div
            ref={qrScannerRef}
            className="d-flex align-items-center justify-content-center"
            style={{
              borderRadius: "10px",
              boxShadow: "0px 0px 10px 0px #000000",
              overflow: "hidden",
              // height: qrScannerDiv + "px",
              height: window.screen.width - 50,
              width: "100%",
            }}
          >
            {isLoading ? (
              <div className="d-flex align-items-center justify-content-center">
                <CircularProgress />
              </div>
            ) : (
              <QrScanner
                onScan={handleScanned}
                // style={{ width: window.screen.width }}
              />
            )}
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
                  <h1
                    className="m-0 p-0 text-center"
                    style={{ lineHeight: 0.5 }}
                  >
                    {scannedCount[key]}
                  </h1>
                  <h6
                    className="text-muted text-capitalize"
                    style={{ marginBottom: "-5px", lineHeight: 1 }}
                  >
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
              <DetailsCard
                user={user}
                key={index}
                id={index}
                highlightIndex={highlightIndex}
              />
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
                {dateFilter
                  ? dateFilter.slice(0, 2)
                  : new Date().toLocaleDateString().slice(0, 2)}
              </h1>
              <h6
                className="text-capitalize"
                style={{ marginBottom: "-5px", lineHeight: 1 }}
              >
                {dateFilter
                  ? months[parseInt(dateFilter.slice(3, 5))]
                  : months[
                      parseInt(new Date().toLocaleDateString(0).slice(3, 5))
                    ]}
              </h6>
            </div>

            <div className="invisible" style={{
              position: "absolute",
              bottom: "0px",
              right: "0px",
            }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileDatePicker
                  open={isDatePickerOpen}
                  closeOnSelect={true}
                  disableFuture={true}
                  onClose={() => setDatePickerOpen(false)}
                  onAccept={(date) => {
                    setDatePickerOpen(false);
                    setDateFilter(new Date(date).toLocaleDateString());
                  }}
                />
              </LocalizationProvider>
            </div>
          </Fab>
        </div>
      </div>

      <Snackbar
        open={Boolean(snackbarData?.message)}
        autoHideDuration={2000}
        onClose={() => setSnackbarData(null)}
      >
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
          <div className="text-secondary">
            {new Date(user.created?.seconds * 1000).toTimeString().slice(0, 5)}
          </div>
        </h6>
        <div className="d-flex justify-content-around">
          {["isMorning", "isEvening", "isSnack"].map((key, index) => (
            <div
              key={index}
              className="d-flex flex-column justify-content-end align-items-center"
            >
              {user[key] ? (
                <VerifiedIcon color="success" />
              ) : (
                <NewReleasesIcon color="disabled" />
              )}
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
