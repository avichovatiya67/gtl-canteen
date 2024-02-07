import React, { useState, useEffect } from "react";

import tea from "../assets/tea.png";
import tea_disabled from "../assets/tea_bw.png";
import snacks from "../assets/snacks.png";
import snacks_disabled from "../assets/snacks_bw.png";
import scanned from "../assets/scanned.png";

import QRCode from "react-qr-code";
import { fetchDate } from "../utils/getDate";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useLocation, useParams, useSearchParams } from "react-router-dom";

const generateRandomName = () => {
  const firstNames = ["Alice", "Bob", "Charlie", "David", "Eva", "Frank", "Grace", "Henry", "Ivy", "Jack"];
  const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"];

  const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${randomFirstName} ${randomLastName}`;
};
const namesArray = Array.from({ length: 10 }, generateRandomName);
// const empId = Math.floor(10000 + Math.random() * 90000);
// const name = namesArray[Math.floor(Math.random() * namesArray.length)];

const UserPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qrData, setQrData] = useState(null);
  // 0 ==> not scanned/disabled, 1 ==> available/clickable, 2 ==> already scanned/scanned
  const [userScanData, setUserScanData] = useState(null);
  let search = useLocation().search;
  let params = new URLSearchParams(search);
  let uid = params.get("uid");
  let uname = params.get("uname");

  const handleProductClick = async (product) => {
    if (selectedProduct === product) return;
    setSelectedProduct(product);
    // generate 5 digit number randomly

    const date = await fetchDate();
    var dataForQr = {
      empId: uid,
      name: uname,
      product,
      date: new Date(date).toLocaleDateString(),
    };
    console.log("QR Data: ", JSON.stringify(dataForQr));
    setQrData(JSON.stringify(dataForQr));
  };

  const iconSize = {
    height: "80px",
    width: "80px",
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

  useEffect(async () => {
    let configTime = await getConfigTime();
    console.log("uid: ", uid);
    let unsub;
    if (uid) {
      // Fetch and listen for updates from Firebase
      const dateToday = await fetchDate();
      const q = query(
        collection(db, "scannedData"),
        where("empId", "==", uid),
        where("date", "==", dateToday.toLocaleDateString())
      );
      unsub = onSnapshot(q, (querySnapshot) => {
        let scanData = null;
        if (querySnapshot.size) {
          const data = querySnapshot.docs.map((doc) => doc.data())[0];
          scanData = {
            isMorning:
              dateToday.getHours() <= (configTime.morningEndTime.hours || 13) &&
              dateToday.getMinutes() <= (configTime.morningEndTime.minutes || 0)
                ? data.isMorning
                  ? 2
                  : 1
                : 0,
            isEvening:
              dateToday.getHours() >= configTime.eveningStartTime.hours &&
              dateToday.getMinutes() >= configTime.eveningStartTime.minutes
                ? data.isEvening
                  ? 2
                  : 1
                : 0,
            isSnack:
              dateToday.getHours() >= (configTime.eveningStartTime.hours || 16) &&
              dateToday.getMinutes() >= (configTime.eveningStartTime.minutes || 30)
                ? data.isSnack
                  ? 2
                  : 1
                : 0,
          };
          console.log("Scan Data: ", scanData);
          setUserScanData(scanData);
        } else {
          scanData = {
            isMorning:
              dateToday.getHours() <= configTime.morningEndTime.hours &&
              dateToday.getMinutes() <= configTime.morningEndTime.minutes
                ? 1
                : 0,
            isEvening:
              dateToday.getHours() >= configTime.eveningStartTime.hours &&
              dateToday.getMinutes() >= configTime.eveningStartTime.minutes
                ? 1
                : 0,
            isSnack:
              dateToday.getHours() >= (configTime.eveningStartTime.hours || 16) &&
              dateToday.getMinutes() >= (configTime.eveningStartTime.minutes || 30)
                ? 1
                : 0,
          };
        }
        setUserScanData(scanData);
      });
    }

    return () => {
      unsub();
      setSelectedProduct(null);
      setQrData(null);
    };
  }, [uid]);

  return (
    <>
      <div className="container text-center mt-3">
        <h5>Please Select Your Menu</h5>

        <div className="d-flex align-items-center justify-content-center" style={{ height: "50vh" }}>
          {qrData ? <QRCode value={qrData} /> : <h2>What you want to avail ?</h2>}
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
      </div>
    </>
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
