import React, { useEffect, useState } from 'react';
import { db } from '../firebase';

const VendorPage = () => {
  const [scannedUsers, setScannedUsers] = useState([]);

  useEffect(() => {
    // Fetch and listen for updates from Firebase
    const unsubscribe = db.collection('scannedUsers').onSnapshot((snapshot) => {
      const users = snapshot.docs.map((doc) => doc.data());
      setScannedUsers(users);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1>Vendor Page</h1>
      <ul>
        {scannedUsers.map((user, index) => (
          <li key={index}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default VendorPage;
