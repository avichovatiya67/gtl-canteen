import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import UserPage from "./components/UserPage";
import VendorPage from "./components/VendorPage";
import "./index.css";
import AdminCount from "./components/AdminCount";

const router = createBrowserRouter([
  {
    path: "/",
    element: <UserPage />,
  },
  {
    path: "/vendor",
    element: <VendorPage />,
  },
  {
    path: '/admin',
    element: <AdminCount />
  }
]);

function App() {
  return (
    // <React.StrictMode>
      <RouterProvider router={router} />
    // </React.StrictMode>
  );
}

export default App;
