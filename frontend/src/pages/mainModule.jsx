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


import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useNavigate, Routes, Route } from "react-router-dom";

import { ClientListPage } from "../feature/client/pages/clientPage";
import { ClientDetailPage } from "../feature/client/pages/clientDetailsPage";

const MainModule = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Client Page");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const menuItems = [
    {
      name: "Client Page",
      icon: Users,
      allowedRoles: ["sales", "store manager"],
    },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Sales Module</h2>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => {
                setActiveTab(item.name);
                navigate("/pages/mainModule");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                activeTab === item.name
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
      <div className="flex-1 bg-gray-50 p-6">
        <Routes>
          <Route index element={<ClientListPage />} />

          <Route
            path="clients/:clientId"
            element={<ClientDetailPage />}
          />
        </Routes>
      </div>
    </div>
  );
};

export default MainModule;