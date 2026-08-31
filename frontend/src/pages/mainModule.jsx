import React, { useEffect } from "react";
import {
  Users,
  ShoppingBag,
  ShoppingCart,
  Package,
  Truck,
  UserCheck,
  ClipboardList,
  ClipboardCheck,
  Tag,
  Cpu,
  Boxes,
  User
} from "lucide-react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";

import { ClientListPage } from "../feature/client/pages/clientPage";
import { ClientDetailPage } from "../feature/client/pages/clientDetailsPage";
import { SalesOrderPage } from "../feature/sales/pages/salesOrderPage";
import { PurchaseListPage } from "../feature/purchase/pages/PurchaseListPage";
import { StorePage } from "../feature/storeItems/pages/storePage";
import { DeliveryList } from "../feature/delivery/pages/DeliveryList";
import { CreateDeliveryPage } from "../feature/delivery/pages/CreateDeliveryPage";
import { MaterialReceiptPage } from "../feature/delivery/pages/MaterialReceiptPage";
import { PurchaseEntryPage } from "@/feature/purchase/pages/purchaseEntryPage";
import { EmployeeListPage } from "../feature/employee/pages/EmployeeListPage";
import { BrandListPage } from "../feature/brand/pages/BrandListPage";
import { UserProfilePage } from "../feature/employee/pages/UserProfilePage";
import { ProductionListPage } from "../feature/production/pages/ProductionListPage";
import BOMMainPage from "../feature/bom/pages/BOMMainPage";
import ProductTab from "../feature/product/Product";

const MainModule = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const menuItems = [
    {
      name: "Store Items",
      path: "store",
      icon: Package,
      allowedRoles: ["sales", "store manager", "Admin", "Super Admin"],
    },
    {
      name: "Product Master",
      path: "products",
      icon: Boxes,
      allowedRoles: ["sales", "store manager", "Admin", "Super Admin"],
    },
    {
      name: "BOM / BOQ",
      path: "bom",
      icon: ClipboardList,
      allowedRoles: ["sales", "store manager", "Admin", "Super Admin"],
    },
    {
      name: "Production",
      path: "production",
      icon: Cpu,
      allowedRoles: ["sales", "store manager", "Admin", "Super Admin"],
    },
    {
      name: "Client Page",
      path: "clients",
      icon: Users,
      allowedRoles: ["sales", "store manager", "Admin", "Super Admin"],
    },
    {
      name: "Sales Orders",
      path: "sales-orders",
      icon: ShoppingBag,
      allowedRoles: ["sales", "store manager", "Admin", "Super Admin"],
    },
    {
      name: "Purchase",
      path: "purchase",
      icon: ShoppingCart,
      allowedRoles: ["sales", "store manager", "Admin", "Super Admin"],
    },
    {
      name: "Delivery",
      path: "delivery",
      icon: Truck,
      allowedRoles: ["sales", "store manager", "Admin", "Super Admin"],
    },
    {
      name: "Material Receipt",
      path: "material-receipt",
      icon: ClipboardCheck,
      allowedRoles: ["sales", "store manager", "site engineer", "Admin", "Super Admin"],
    },
    {
      name: "Brand & Category",
      path: "brands",
      icon: Tag,
      allowedRoles: ["Super Admin", "Admin", "sales", "store manager"],
    },
    {
      name: "Employees",
      path: "employees",
      icon: UserCheck,
      allowedRoles: ["Super Admin", "Admin"],
    },
  ];

  const currentSubPath = location.pathname.replace(/^\/pages\/mainModule\/?/, "");
  const isProfileActive = currentSubPath === "profile" || location.pathname.endsWith("/profile");

  const activeTab =
    location.pathname === "/pages/mainModule" ||
    location.pathname === "/pages/mainModule/"
      ? "Store Items"
      : isProfileActive
      ? "User Profile"
      : menuItems.find(
          (item) =>
            item.path &&
            (currentSubPath === item.path ||
              currentSubPath.startsWith(`${item.path}/`))
        )?.name || "Store Items";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-xs">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-3.5 flex flex-col h-screen border-r border-slate-800 shrink-0">
        {/* Sidebar Header */}
        <div className="px-2.5 py-3 mb-2 shrink-0 flex items-center justify-between border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Inventory ERP
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Operations & Sales</p>
          </div>
        </div>

        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1 min-h-0 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              activeTab === item.name ||
              currentSubPath === item.path ||
              currentSubPath.startsWith(`${item.path}/`);

            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(`/pages/mainModule/${item.path}`);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer text-xs font-semibold ${
                  isItemActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                    : "hover:bg-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                <Icon size={16} className={isItemActive ? "text-white" : "text-slate-400"} />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Bottom Profile Card */}
        {(() => {
          let currentUser = null;
          try {
            currentUser = JSON.parse(localStorage.getItem("user"));
          } catch (e) {}

          if (!currentUser) return null;

          return (
            <div
              onClick={() => navigate("/pages/mainModule/profile")}
              className={`mt-2 pt-2.5 border-t border-slate-800/80 cursor-pointer p-2 rounded-xl transition-all shrink-0 ${
                isProfileActive
                  ? "bg-blue-600/25 border-blue-500/40 ring-1 ring-blue-500/50"
                  : "hover:bg-slate-800/60"
              }`}
              title="Click to view User Profile"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md ${
                    isProfileActive
                      ? "bg-blue-500 ring-2 ring-white/30"
                      : "bg-gradient-to-br from-blue-500 to-indigo-600"
                  }`}
                >
                  {(currentUser.employee_name || currentUser.name || "U")[0]?.toUpperCase()}
                </div>
                <div className="overflow-hidden space-y-0.5 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentUser.employee_name || currentUser.name || "Employee"}
                  </p>
                  <p className="text-[10px] text-blue-400 font-medium truncate capitalize">
                    {currentUser.role || "User"}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-gray-50 text-slate-800">
        {/* Top Header Navbar */}
        <Navbar activeTab={activeTab} />

        {/* Viewport Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route index element={<Navigate to="store" replace />} />

            <Route path="store" element={<StorePage />} />
            <Route path="products" element={<ProductTab />} />

            <Route path="clients/:clientId" element={<ClientDetailPage />} />
            <Route path="clients" element={<ClientListPage />} />
            <Route path="sales-orders" element={<SalesOrderPage />} />

            <Route path="bom" element={<BOMMainPage />} />

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

            <Route path="material-receipt" element={<MaterialReceiptPage />} />

            <Route path="production" element={<ProductionListPage />} />

            <Route path="brands" element={<BrandListPage />} />
            <Route path="employees" element={<EmployeeListPage />} />

            {/* User Profile Page */}
            <Route path="profile" element={<UserProfilePage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MainModule;