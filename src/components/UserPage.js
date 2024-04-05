import React, { useState, useEffect } from "react";

import tea from "../assets/tea.png";
import tea_disabled from "../assets/tea_bw.png";
import snacks from "../assets/snacks.png";
import snacks_disabled from "../assets/snacks_bw.png";
import scanned from "../assets/scanned.png";

import QRCode from "react-qr-code";
import { fetchDate, getDDMMYYYY } from "../utils/getDate";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useLocation } from "react-router-dom";
import canteen from "../assets/canteen.png";
import { decryptData, encryptData } from "../utils/crypto";
import { Backdrop, CircularProgress } from "@mui/material";
// const generateRandomName = () => {
//   const firstNames = ["Alice", "Bob", "Charlie", "David", "Eva", "Frank", "Grace", "Henry", "Ivy", "Jack"];
//   const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"];

//   const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
//   const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

//   return `${randomFirstName} ${randomLastName}`;
// };
// const namesArray = Array.from({ length: 10 }, generateRandomName);
// const uid = Math.floor(10000 + Math.random() * 90000);
// const uname = namesArray[Math.floor(Math.random() * namesArray.length)];

const UserPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qrData, setQrData] = useState(null);
  // 0 ==> not scanned/disabled, 1 ==> available/clickable, 2 ==> already scanned/scanned
  const [userScanData, setUserScanData] = useState(null);
  const [todaysSnack, setTodaysSnack] = useState(null);
  let search = useLocation().search;
  let params = new URLSearchParams(search);
  let uid = parseInt(params.get("uid"));
  let uname = params.get("uname");
  const iconSize = { height: "90px", width: "90px" };

  const handleProductClick = async (product) => {
    if (selectedProduct === product) return;
    setSelectedProduct(product);

    const date = await fetchDate();
    var dataForQr = {
      empId: uid,
      name: uname,
      product,
      date: getDDMMYYYY(date),
    };
    const encryptedData = encryptData(dataForQr);
    setQrData(encryptedData);
    // console.log("encrypted QR Data: ", encryptedData);
  };

  const getConfigTime = async () => {
    const config = await db.collection("config").doc("timing").get();
    const data = config.data();
    return {
      morningEndTime: {
        hours: parseInt(data.morningEndTime.split(":")[0]),
        minutes: parseInt(data.morningEndTime.split(":")[1]),
      },
      eveningStartTime: {
        hours: parseInt(data.eveningStartTime.split(":")[0]),
        minutes: parseInt(data.eveningStartTime.split(":")[1]),
      },
    };
  };

  // Fetch User's Scan Data
  useEffect(() => {
    let unsub;
    const setUserData = async () => {
      if (uid) {
        let configTime = await getConfigTime();
        const dateToday = await fetchDate();
        let morningEndTime = new Date(dateToday);
        morningEndTime.setHours(configTime.morningEndTime.hours);
        morningEndTime.setMinutes(configTime.morningEndTime.minutes);
        let eveningStartTime = new Date(dateToday);
        eveningStartTime.setHours(configTime.eveningStartTime.hours);
        eveningStartTime.setMinutes(configTime.eveningStartTime.minutes);

        // Fetch and listen for updates from Firebase
        const q = query(
          collection(db, "scannedData"),
          where("empId", "==", uid),
          where("date", "==", getDDMMYYYY(dateToday))
        );
        unsub = onSnapshot(q, (querySnapshot) => {
          let scanData = null;
          if (querySnapshot.size) {
            const data = querySnapshot.docs.map((doc) => doc.data())[0];
            scanData = {
              isMorning: dateToday <= morningEndTime ? (data.isMorning ? 2 : 1) : 0,
              isEvening: dateToday >= eveningStartTime ? (data.isEvening ? 2 : 1) : 0,
              isSnack: dateToday >= eveningStartTime ? (data.isSnack ? 2 : 1) : 0,
            };
          } else {
            scanData = {
              isMorning: dateToday <= morningEndTime ? 1 : 0,
              isEvening: dateToday >= eveningStartTime ? 1 : 0,
              isSnack: dateToday >= eveningStartTime ? 1 : 0,
            };
          }
          setUserScanData(scanData);
          setIsLoading(false);
        });
      }
    };
    setUserData();

    return () => {
      if (unsub) unsub();
      setSelectedProduct(null);
      setQrData(null);
    };
  }, [uid]);

  // Fetch Today's Snack
  useEffect(() => {
    let unsub;
    const fetchSnackData = async () => {
      const dateToday = await fetchDate();
      const q = query(
        collection(db, "snacks"),
        where("created", ">=", new Date(dateToday.getFullYear(), dateToday.getMonth(), dateToday.getDate())),
        where("created", "<", new Date(dateToday.getTime() + 86400000))
      );
      unsub = onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.size) {
          let snackData = querySnapshot.docs.map((doc) => doc.data())[0];
          setTodaysSnack(snackData.snack);
        } else {
          setTodaysSnack(null);
        }
      });
    };
    fetchSnackData();

    return () => {
      if (unsub) unsub();
      setTodaysSnack(null);
    };
  }, []);

  return (
    <div className="container text-center mt-3">
      <h5>Please Select Your Menu</h5>

      {/* QR Code / Image */}
      <div className="d-flex align-items-center justify-content-center" style={{ height: "50vh" }}>
        {qrData && selectedProduct && userScanData && userScanData[`is${selectedProduct}`] == 1 ? (
          <QRCode value={qrData} />
        ) : (
          <img src={canteen} height={"100%"} />
        )}
      </div>

      {/* Message  */}
      {qrData && selectedProduct && userScanData && userScanData[`is${selectedProduct}`] == 1 ? (
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
      ) : selectedProduct ? (
        <h5 className="my-2" style={{ height: "48px" }}>
          Enjoy Your Day !!
        </h5>
      ) : (
        <h5 className="my-2" style={{ height: "48px" }}>
          Please Select Your Refreshment!
        </h5>
      )}

      {/* Product Cards */}
      <div
        className="row mx-auto d-flex justify-content-center gap-2"
        style={{ width: "100%", fontSize: "10px", fontWeight: "bold" }}
      >
        {["Morning", "Evening", "Snack"].map((product, index) => (
          <ProductCard
            key={index}
            product={product}
            selectedProduct={selectedProduct}
            onClick={handleProductClick}
            status={userScanData ? userScanData[`is${product}`] : 0}
            style={{ ...iconSize }}
          />
        ))}
      </div>

      {/* Today's Snacks */}
      {todaysSnack && (
        <h6 className="my-2 mt-4" style={{ height: "48px" }}>
          Today's Snack : {todaysSnack}
        </h6>
      )}

      {/* Backdrop */}
      <Backdrop open={isLoading} >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

const ProductCard = ({ product, selectedProduct, onClick, status = 2, style }) => {
  const icons = {
    Morning: {
      0: tea_disabled,
      1: tea,
      2: tea_disabled,
    },
    Evening: {
      0: tea_disabled,
      1: tea,
      2: tea_disabled,
    },
    Snack: {
      0: snacks_disabled,
      1: snacks,
      2: snacks_disabled,
    },
  };
  return (
    <div
      className={
        "border rounded-3 d-flex flex-column align-items-center" +
        (selectedProduct === product ? " bg-light border-warning" : " border-dark") +
        (status !== 1 ? " disabled" : "")
      }
      style={{ ...style }}
      onClick={status === 1 ? () => onClick(product) : null}
    >
      {status === 2 && <img style={{ position: "fixed", ...style }} src={scanned} />}
      <div className="mt-3 d-flex flex-column gap-2 align-items-center">
        <img height={"70%"} width={"70%"} src={icons[product][status]} alt={product} />
        {product.toUpperCase()}
      </div>
    </div>
  );
};

export default UserPage;
