// import React, { useEffect, useState } from "react";
// import { Users } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { Routes, Route } from "react-router-dom";   

// import { ClientListPage } from "../feature/client/pages/clientPage";
// import { ClientDetailPage } from "../feature/client/pages/clientDetailsPage";

// const MainModule = () => {
//   const navigate = useNavigate();

//   const [activeTab, setActiveTab] = useState("Client Page");

//   useEffect(() => {
//     const token = localStorage.getItem("authToken");
//     const user = JSON.parse(localStorage.getItem("user"));

//     console.log("Token:", token);
//     console.log("User:", user);

//     if (!token || !user) {
//       navigate("/login", { replace: true });
//     }
//   }, [navigate]);

//   const menuItems = [
//     {
//       name: "Client Page",
//       icon: Users,
//       allowedRoles: ["sales", "store manager"],
//     },
//   ];

//  <div className="flex-1 bg-gray-50 p-6">
//     <Routes>
//         <Route index element={<ClientListPage />} />

//         <Route
//             path="clients/:clientId"
//             element={<ClientDetailPage />}
//         />
//     </Routes>
// </div>

//   return (
//     <div className="flex min-h-screen">
//       {/* Sidebar */}
//       <div className="w-64 bg-slate-900 text-white p-4">
//         <h2 className="text-xl font-bold mb-6">Sales Module</h2>

//         {menuItems.map((item) => {
//           const Icon = item.icon;

//           return (
//             <button
//               key={item.name}
//               onClick={() => setActiveTab(item.name)}
//               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
//                 activeTab === item.name
//                   ? "bg-blue-600"
//                   : "hover:bg-slate-800"
//               }`}
//             >
//               <Icon size={18} />
//               <span>{item.name}</span>
//             </button>
//           );
//         })}
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 bg-gray-50 p-6">{renderContent()}</div>
//     </div>
//   );
// };

// export default MainModule;


import { useEffect } from "react";
import { Users, ShoppingBag, ShoppingCart, Package, Truck, UserCheck} from "lucide-react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";


import { ClientListPage } from "../feature/client/pages/clientPage";
import { ClientDetailPage } from "../feature/client/pages/clientDetailsPage";

import { SalesOrderPage } from "../feature/sales/pages/salesOrderPage";

import { PurchaseListPage } from "../feature/purchase/pages/PurchaseListPage";
// import { PurchaseEntryPage } from "../feature/purchase/pages/PurchaseEntryPage";
import { StorePage } from "../feature/storeItems/pages/storePage";
import { DeliveryList } from "../feature/delivery/pages/DeliveryList";
import { CreateDeliveryPage } from "../feature/delivery/pages/CreateDeliveryPage";
import { PurchaseEntryPage } from "@/feature/purchase/pages/purchaseEntryPage";
import { EmployeeListPage } from "../feature/employee/pages/EmployeeListPage";

const MainModule = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // const [activeTab, setActiveTab] = useState("Client Page");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // useEffect(() => {
  //   // Find the item whose path matches the URL (ignoring empty base path "")
  //   const matchedItem = menuItems.find(
  //     (item) => item.path !== "" && location.pathname.includes(item.path)
  //   );

  //   if (matchedItem) {
  //     setActiveTab(matchedItem.name);
  //   } else {
  //     // Fallback to default tab (Client Page)
  //     setActiveTab(menuItems[0].name);
  //   }
  // }, [location.pathname]);

  const menuItems = [

    {
      name: "Store",
      path: "store",
      icon: Package,
      allowedRoles: ["sales", "store manager"],
    },
    {
      name: "Client Page",
      path: "clients",
      icon: Users,
      allowedRoles: ["sales", "store manager"],
    },
    {
      name: "Sales Orders",
      path: "sales-orders", // Navigates to sales orders route
      icon: ShoppingBag,
      allowedRoles: ["sales", "store manager"],
    },
    {
      name: "Purchase",
      path: "purchase",
      icon: ShoppingCart,
      allowedRoles: ["sales", "store manager"],
    },



    {
      name: "Delivery",
      path: "delivery",
      icon: Truck,
      allowedRoles: ["sales", "store manager"],
    },

    {
      name: "Employees",
      path: "employees",
      icon: UserCheck,
      allowedRoles: ["Super Admin", "Admin"],
    },

  ];


 const activeTab =
  location.pathname === "/pages/mainModule" ||
  location.pathname === "/pages/mainModule/"
    ? "Store"
    : menuItems.find(
        (item) =>
          item.path &&
          location.pathname === `/pages/mainModule/${item.path}`
      )?.name || "Store";


  return (
    // <div className="flex h-screen">
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Sales Module</h2>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            // <button
            //   key={item.name}
            //   onClick={() => {
            //     setActiveTab(item.name);
            //     navigate(`/pages/mainModule/${item.path}`);
            //   }}
            //   className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${activeTab === item.name
            //       ? "bg-blue-600"
            //       : "hover:bg-slate-800"
            //     }`}
            // >
            //   <Icon size={18} />
            //   <span>{item.name}</span>
            // </button>

            <button
              key={item.name}
              onClick={() => {
                navigate(`/pages/mainModule/${item.path}`);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${activeTab === item.name
                ? "bg-blue-600"
                : "hover:bg-slate-800"
                }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      {/* <div className="flex-1 bg-gray-50 p-6"> */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-gray-50">
        {/* 1. TOP HEADER BAR */}
        <Navbar activeTab={activeTab} />

        <div className="flex-1  p-6 overflow-y-auto">
          <Routes>
            {/* <Route index element={<ClientListPage />} /> */}

            <Route
              index
              element={<Navigate to="store" replace />}
            />

            <Route
              path="clients/:clientId"
              element={<ClientDetailPage />}
            />
            <Route path="clients" element={<ClientListPage />} />
            <Route path="sales-orders" element={<SalesOrderPage />} />

            {/* <Route path="purchase" element={<PurchaseListPage />} />
          <Route path="purchase/new" element={<PurchaseEntryPage />} /> */}


            <Route
              path="purchase"
              element={
                <PurchaseListPage
                  onOpenCreate={() => navigate("/pages/mainModule/purchase/new")}
                />
              }
            />
            <Route
              path="purchase/new"
              element={
                <PurchaseEntryPage
                  onCancel={() => navigate("/pages/mainModule/purchase")}
                  onSaveSuccess={() => navigate("/pages/mainModule/purchase")}
                />
              }
            />

            <Route
              path="delivery"
              element={
                <DeliveryList
                  onAddNew={() => navigate("/pages/mainModule/delivery/new")}
                />
              }
            />
            <Route
              path="delivery/new"
              element={
                <CreateDeliveryPage
                  onBack={() => navigate("/pages/mainModule/delivery")}
                  onSuccess={() => navigate("/pages/mainModule/delivery")}
                />
              }
            />

            <Route path="store" element={<StorePage />} />

            <Route path="employees" element={<EmployeeListPage />} />

          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MainModule;