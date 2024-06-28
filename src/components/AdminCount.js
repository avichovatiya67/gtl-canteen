import React, { useEffect, useState } from 'react';
import { db, getMaxCountData } from "../utils/firebase";
import { TextField, Button } from '@mui/material';

export default function AdminCount() {
  const [maxData, setMaxData] = useState({ isMorning: 0, isEvening: 0, isSnacks: 0, morningEndTime: "", eveningStartTime: ""});

  useEffect(() => {
    const fetchData = async () => {
      const data = await getMaxCountData();
      setMaxData(data);
    };
    fetchData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setMaxData((prevState) => ({
      ...prevState,
      [name]: parseInt(value) || 0,
    }));
  };

  const updateMaxCount = async () => {
    try {
      const maxCountCollectionRef = db.collection('config');
      const snapshot = await maxCountCollectionRef.get();
      const docId = snapshot.docs[0].id;

      await maxCountCollectionRef.doc(docId).update(maxData);
    } catch (error) {
      console.error('Error updating max count data:', error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems:"center", justifyContent:"center", height:"100vh", width:"100vw" }}>
      <TextField name='isMorning' label='Max Morning Tea' fullWidth value={maxData.isMorning} onChange={handleChange} sx={{maxWidth:"350px"}}/>
      <TextField name='isEvening' label='Max Evening Tea' fullWidth value={maxData.isEvening} onChange={handleChange} sx={{maxWidth:"350px"}}/>
      <TextField name='isSnacks' label='Max Snacks' fullWidth value={maxData.isSnacks} onChange={handleChange} sx={{maxWidth:"350px"}}/>
      <TextField name='morningEndTime' label='Morning End Time' fullWidth value={maxData.morningEndTime} onChange={handleChange} sx={{maxWidth:"350px"}}/>
      <TextField name='eveningStartTime' label='Evening Start Time' fullWidth value={maxData.eveningStartTime} onChange={handleChange} sx={{maxWidth:"350px"}}/>
      <Button fullWidth variant='contained' onClick={updateMaxCount} sx={{maxWidth:"350px", borderRadius:"30px"}}>Update</Button>
    </div>
  );
}
