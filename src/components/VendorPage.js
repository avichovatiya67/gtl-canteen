import React, { useEffect, useState, useRef } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { addDoc, collection, getAggregateFromServer, getDocs, onSnapshot, orderBy, query, setDoc, sum, where } from "firebase/firestore";
import { db } from "../utils/firebase";
import QrScanner from "./QrScanner";
import { fetchDate, getDDMMYYYY, getHHMM } from "../utils/getDate";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Fab,
  IconButton,
  Input,
  InputAdornment,
  Popover,
  Snackbar,
  Stack,
  Tab,
  Tabs,
} from "@mui/material";
import { yellow } from "@mui/material/colors";
import VerifiedIcon from "@mui/icons-material/Verified";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import { CalendarIcon, LocalizationProvider, MobileDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import "@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css";
import "react-calendar/dist/Calendar.css";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DownloadIcon from '@mui/icons-material/Download';
import GatewayLogo from "../assets/gateway.png";

var showSnackbar = null;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const VendorPage = () => {
  const [scannedUsers, setScannedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrimaryLoading, setIsPrimaryLoading] = useState(true);
  const [snackbarData, setSnackbarData] = useState(null);
  const [scannedCount, setScannedCount] = useState({ morning: 0, evening: 0, snack: 0 });
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(true);
  const [processedData, setProcessedData] = useState({});
  showSnackbar = setSnackbarData;

  // State for Date Filter
  const [dateFilter, setDateFilter] = useState(null);
  const [dateRangeFilter, setDateRangeFilter] = useState([new Date(), new Date()]);
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  const qrScannerRef = useRef(null);

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

  let isOperating = false;
  const handleScanned = async (data) => {
    // debugger;
    try {
      if (isOperating || isLoading) return;
      isOperating = true;
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
          floor: selectedFloor,
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
              floor: selectedFloor,
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
      isOperating = false;
      setIsLoading(false);
    }
  };
  const processDataWithTotal = (data) => {
    let countsByDate = {};
    let total = { isMorning: 0, isEvening: 0, isSnack: 0 };

    data.forEach((item) => {
      const date = item.date;
      countsByDate[date] = countsByDate[date] || { date, isMorning: 0, isEvening: 0, isSnack: 0 };

      if (item.isMorning) {
        countsByDate[date].isMorning++;
        total.isMorning++;
      }
      if (item.isEvening) {
        countsByDate[date].isEvening++;
        total.isEvening++;
      }
      if (item.isSnack) {
        countsByDate[date].isSnack++;
        total.isSnack++;
      }
    });

    const processedData = Object.values(countsByDate);

    return { processedData, total };
  };
  // Fetch and listen for updates from Firebase for Today's Data
  useEffect(() => {
    if (getDDMMYYYY(dateRangeFilter[0]) !== getDDMMYYYY(dateRangeFilter[1]) || dateFilter !== null) return;
    let unsub;
    const getData = async () => {
      const dateToday = await fetchDate();
      const formattedDate = getDDMMYYYY(dateToday);

      const filterConditions = [
        where("date", "==", formattedDate),
        selectedFloor ? where("floor", "==", selectedFloor) : null,
      ].filter((condition) => condition !== null);

      const q = query(collection(db, "scannedData"), ...filterConditions, orderBy("modified", "desc"));
      unsub = onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.size) {
          const data = querySnapshot.docs.map((doc) => doc.data());
          setScannedUsers(data);
          setHighlightIndex(0);
          setProcessedData(processDataWithTotal(data));
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
    };
    getData();

    return () => {
      if (unsub) unsub();
    };
  }, [selectedFloor]);


  // Fetch Filtered Data from Firebase
  useEffect(() => {
    const isRange = dateRangeFilter[0].getTime() !== dateRangeFilter[1].getTime();
    if (dateFilter || isRange) {
      setIsPrimaryLoading(true);
      let q = collection(db, "scannedData");
      // const snap = getAggregateFromServer(q)
      // console.log("snap===>", snap.data().count());

      const filterConditions = [
        dateFilter ? where("date", "==", dateFilter) : null,
        isRange ? where("modified", ">=", firebase.firestore.Timestamp.fromDate(dateRangeFilter[0])) : null,
        isRange ? where("modified", "<=", firebase.firestore.Timestamp.fromDate(dateRangeFilter[1])) : null,
        selectedFloor ? where("floor", "==", selectedFloor) : null,
      ].filter((condition) => condition !== null);

      q = query(collection(db, "scannedData"), ...filterConditions, orderBy("modified", "desc"));

      // Fetch the data from Firebase on Date Change only once without snapshot
      getDocs(q).then((querySnapshot) => {
        if (querySnapshot.size) {
          const data = querySnapshot.docs.map((doc) => doc.data());
          setScannedUsers(data);
          setProcessedData(processDataWithTotal(data))
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
    }
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
  }, [dateFilter, selectedFloor, dateRangeFilter]);

  // Highlight the topmost card for 5 seconds
  useEffect(() => {
    const highlightTimeout = setTimeout(() => {
      setHighlightIndex(null);
    }, 5000);

    return () => {
      clearTimeout(highlightTimeout);
    };
  }, [highlightIndex]);

  // Camera Visibility Change
  useEffect(() => {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") setIsCameraOpen(false);
      if (document.visibilityState === "visible") setIsCameraOpen(true);
    });

    return () => {
      document.removeEventListener("visibilitychange", () => {
        setIsCameraOpen(false);
      });
    };
  }, []);

  // // Calculate Div Height for Loader
  // const [qrScannerDiv, setQrScannerDiv] = useState(null);
  // useEffect(() => {
  //   const handleLoad = () => {
  //     const divHeight = qrScannerRef.current?.getBoundingClientRect().height;
  //     if (divHeight >= qrScannerDiv) setQrScannerDiv(divHeight);
  //   };
  //   setTimeout(handleLoad, 1000);
  // }, [qrScannerDiv]);

  const RenderTable = () => {
    const tableRef = useRef(null);

    const styles = {
      header: {
        backgroundColor: "#f2f2f2",
        borderBottom: "1px solid #ddd",
        borderRight: "1px solid #ddd", // Column border
        padding: "8px",
        textAlign: "left",
      },
      dateCell: {
        borderBottom: "1px solid #ddd",
        borderRight: "1px solid #ddd", // Column border
        padding: "8px",
        textAlign: "left",
        fontWeight: "bold", // Make text bold
      },
      cell: {
        borderBottom: "1px solid #ddd",
        borderRight: "1px solid #ddd", // Column border
        padding: "8px",
        textAlign: "left",
      },
      totalRow: {
        backgroundColor: "#e6e6e6",
      },
      totalCell: {
        borderBottom: "1px solid #ddd",
        borderRight: "1px solid #ddd", // Column border
        padding: "8px",
        textAlign: "left",
      },
    };

    const generatePDF = () => {
      const input = tableRef.current;

      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save('table.pdf');
      });
    };
    return (
      <div>
        {
          processedData.processedData ?
            <div>
              <div ref={tableRef} style={{ padding: "25px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between", flexDirection: "column", paddingBottom: "10px" }}>
                  <img src={GatewayLogo} alt="logo" style={{ maxHeight: "110px", maxWidth: "130px", paddingBottom: "10px" }} />
                  <div>
                    <span style={{ fontWeight: "600" }}>
                      From :
                    </span>
                    {" " + getDDMMYYYY(dateRangeFilter[0].getTime()) + " "}
                    <span style={{ fontWeight: "600" }}>
                      To :
                    </span>
                    {" " + getDDMMYYYY(dateRangeFilter[1].getTime())}
                  </div>
                </div>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={styles.header}>Date</th>
                      <th style={styles.header}>Morning</th>
                      <th style={styles.header}>Evening</th>
                      <th style={styles.header}>Snacks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData?.processedData?.map((item, index) => (
                      <tr key={index}>
                        <td style={styles.dateCell}>{item.date}</td>
                        <td style={styles.cell}>{item.isMorning}</td>
                        <td style={styles.cell}>{item.isEvening}</td>
                        <td style={styles.cell}>{item.isSnack}</td>
                      </tr>
                    ))}
                    <tr style={styles.totalRow}>
                      <td style={styles.dateCell}>Total</td>
                      <td style={styles.totalCell}>{processedData?.total?.isMorning}</td>
                      <td style={styles.totalCell}>{processedData?.total?.isEvening}</td>
                      <td style={styles.totalCell}>{processedData?.total?.isSnack}</td>
                    </tr>
                    {/* <tr style={styles.totalRow}>
                      <td style={styles.dateCell}>Amount</td>
                      <td style={styles.totalCell}>{parseInt(processedData?.total?.isMorning) * 20}</td>
                      <td style={styles.totalCell}>{parseInt(processedData?.total?.isEvening) * 20}</td>
                      <td style={styles.totalCell}>{parseInt(processedData?.total?.isSnack) * 30}</td>
                    </tr>
                    <tr style={styles.totalRow}>
                      <td style={{ ...styles.totalCell, fontWeight: "bold" }}>Total Amount</td>
                      <td colSpan={3} style={{ ...styles.totalCell, fontWeight: "bold", textAlign: "center" }}>
                        {(parseInt(processedData?.total?.isMorning) * 20) + (parseInt(processedData?.total?.isEvening) * 20) + (parseInt(processedData?.total?.isSnack) * 30)}
                      </td>
                    </tr> */}
                  </tbody>
                </table>
              </div>
              <Button variant="contained" color="success" sx={{ marginLeft: "20px", borderRadius: "30px" }} onClick={() => generatePDF()} aria-label="download-pdf">
                <DownloadIcon /> Download
              </Button>
            </div>
            : ""
        }
      </div>

    )
  }

  const renderScannedRecords = () => {
    return (
      <div>
        {scannedUsers.length ? (
          scannedUsers.slice(0, 20).map((user, index) => (
            <DetailsCard
              user={user}
              key={index}
              id={index}
              highlightIndex={highlightIndex}
              selectedFloor={selectedFloor}
            />
          ))
        ) : (
          <div className="d-flex justify-content-center align-items-center">
            <h6>No Data Found!</h6>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="container-fluid p-2">
        {/* Tabs */}
        <div className="d-flex">
          <Tabs
            style={{ flexGrow: 1 }}
            variant="fullWidth"
            value={selectedFloor}
            onChange={(a, v) => {
              setSelectedFloor(v);
            }}
          >
            <Tab label="All" value={0} style={{ fontWeight: "bolder" }} />
            <Tab label="Terrace" value={1} style={{ fontWeight: "bolder" }} />
            <Tab label="Ground" value={2} style={{ fontWeight: "bolder" }} />
          </Tabs>
          <MenuButton />
        </div>

        {/* Scanner Section with Counts OR Date Range Selection */}
        <div style={{ position: "relative" }} className="d-flex align-items-center justify-content-center m-3">
          {/* Scanner and Loader */}
          {selectedFloor != 0 ? (
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
              {isCameraOpen && (
                <QrScanner
                  onScan={!isLoading ? handleScanned : null}
                  setSnackbarData={setSnackbarData}
                  isLoading={isLoading}
                // style={{ width: window.screen.width }}
                />
              )}
            </div>
          ) : (
            <>
              <div className="flex-grow-1" style={{ height: "110px", zIndex: "1100" }}>
                <DateRangePicker
                  className="w-100 d-flex justify-content-between align-items-center"
                  onChange={(date) => {
                    setDateRangeFilter(date);
                    setDateFilter(null);
                  }}
                  value={dateRangeFilter}
                  calendarClassName="card"
                  maxDate={new Date()}
                  calendarIcon={<CalendarIcon color="inherit" style={{ color: "#212529" }} />}
                  openCalendarOnFocus={false}
                  clearIcon={null}
                  format="dd-MM-yyyy"
                  rangeDivider=" to  "
                  dayPlaceholder="dd"
                  monthPlaceholder="mm"
                  yearPlaceholder="yyyy"
                />
              </div>
            </>
          )}
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
                  <p className="text-muted text-capitalize" style={{ marginBottom: "-12px" }}>
                    {key}
                  </p>
                </div>
              </Fab>
            ))}
          </div>
        </div>
        <div>
          <RenderTable />

        </div>
        {/* Tab Panels || Detail Cards */}
        <CustomTabPanel value={selectedFloor} index={0}>
          {renderScannedRecords()}
        </CustomTabPanel>
        <CustomTabPanel value={selectedFloor} index={1}>
          {renderScannedRecords()}
        </CustomTabPanel>
        <CustomTabPanel value={selectedFloor} index={2}>
          {renderScannedRecords()}
        </CustomTabPanel>

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
                  open={false}
                  closeOnSelect={true}
                  disableFuture={true}
                  onClose={() => setDatePickerOpen(false)}
                  onAccept={(date) => {
                    setDatePickerOpen(false);
                    setDateFilter(getDDMMYYYY(date));
                    setDateRangeFilter([new Date(date), new Date(date)]);
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

const DetailsCard = ({ user, highlightIndex, id, selectedFloor = 0 }) => {
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
          {/* {selectedFloor === 0 ? <div className="text-secondary">{["Terrace", "Ground"][user.floor-1]}</div> : null} */}
          <div className="text-secondary">
            {selectedFloor === 0 && ["Terrace", "Ground"][user.floor - 1] + " - "}
            {user.modified?.seconds ? getHHMM(user.modified?.seconds * 1000) : getHHMM(new Date())}
          </div>
        </h6>
        <div className="d-flex justify-content-between">
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

const CustomTabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
    </div>
  );
};

const MenuButton = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <div>
      <IconButton id="long-button" aria-describedby="more" onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Popover
        id="more"
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <TodaysSnack />
      </Popover>
    </div>
  );
};

const TodaysSnack = () => {
  const [textValue, setTextValue] = useState("");
  const [todaysSnack, setTodaysSnack] = useState("");
  const [snackData, setSnackData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
        let snackData = null;
        if (querySnapshot.size) {
          snackData = querySnapshot.docs.map((doc) => doc.data())[0];
        }
        setSnackData(snackData);
        setTextValue(snackData?.snack);
        setTodaysSnack(snackData?.snack);
      });
    };
    fetchSnackData();

    return () => {
      if (unsub) unsub();
      setTodaysSnack(null);
    };
  }, []);

  // Function to set today's snack
  const setSnack = async (snack) => {
    console.log("Adding..........");
    const dateToday = await fetchDate();
    const snackData = {
      created: firebase.firestore.FieldValue.serverTimestamp(),
      snack: snack,
    };
    const q = query(
      collection(db, "snacks"),
      where("created", ">=", new Date(dateToday.getFullYear(), dateToday.getMonth(), dateToday.getDate())),
      where("created", "<", new Date(dateToday.getTime() + 86400000))
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.size) {
      querySnapshot.forEach((doc) => {
        setDoc(doc.ref, snackData);
      });
    } else {
      addDoc(collection(db, "snacks"), snackData);
    }
  };

  useEffect(() => {
    if (!isEditing && textValue && textValue !== todaysSnack) setSnack(textValue);
  }, [isEditing]);

  return (
    <Stack direction="column" sx={{ width: 260 }} className="p-3">
      <div className="d-flex justify-content-between">
        <p className="m-0">Today's Snack</p>
        {snackData?.created && <p className="text-muted">{getDDMMYYYY(snackData.created.seconds * 1000)}</p>}
      </div>
      <div className="border m-0 p-2">
        <Input
          fullWidth
          placeholder="Enter Today's Snack"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          disabled={!isEditing}
          endAdornment={
            <InputAdornment position="end">
              <IconButton onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? <CheckIcon /> : <EditIcon />}
              </IconButton>
            </InputAdornment>
          }
        />
      </div>

    </Stack>
  );
};

export default VendorPage;
