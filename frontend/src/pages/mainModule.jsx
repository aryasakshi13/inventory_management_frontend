import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
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
  User,
  FileText,
  X,
  ChevronDown,
  ChevronRight,
  Store,
  Box,
  ScrollText
} from "lucide-react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";

import { DashboardPage } from "../feature/dashboard/pages/DashboardPage";
import { ClientListPage } from "../feature/client/pages/clientPage";
import { ClientDetailPage } from "../feature/client/pages/clientDetailsPage";
import { SalesOrderPage } from "../feature/sales/pages/salesOrderPage";
import { PurchaseListPage } from "../feature/purchase/pages/PurchaseListPage";
import { StorePage } from "../feature/storeItems/pages/storePage";
import { DeliveryList } from "../feature/delivery/pages/DeliveryList";
import { CreateDeliveryPage } from "../feature/delivery/pages/CreateDeliveryPage";
import { MaterialReceiptPage } from "../feature/delivery/pages/MaterialReceiptPage";
import { ChallanListPage } from "../feature/challan/pages/ChallanListPage";
import { CreateChallanPage } from "../feature/challan/pages/CreateChallanPage";
import { PurchaseEntryPage } from "@/feature/purchase/pages/purchaseEntryPage";
import { EmployeeListPage } from "../feature/employee/pages/EmployeeListPage";
import { BrandListPage } from "../feature/brand/pages/BrandListPage";
import { UserProfilePage } from "../feature/employee/pages/UserProfilePage";
import { ProductionListPage } from "../feature/production/pages/ProductionListPage";
import { QuotationListPage } from "../feature/quotation/pages/QuotationListPage";
import BOMMainPage from "../feature/bom/pages/BOMMainPage";
import ProductTab from "../feature/product/Product";

const MainModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ Stores: true });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Auto-close sidebar on route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = [
    {
      name: "Dashboard",
      path: "dashboard",
      icon: LayoutDashboard,
      allowedRoles: ["sales", "store manager", "Admin", "Super Admin", "site engineer"],
    },
    {
      name: "Store",
      path: "store",
      icon: Store,
      allowedRoles: ["sales", "store manager", "Admin", "Super Admin"],
      subItems: [
        {
          name: "Store Master",
          path: "store",
          icon: Package,
        },
        {
          name: "Material Requests",
          path: "store/material-requests",
          icon: ClipboardList,
        },
        {
          name: "Dispatch Logs",
          path: "store/dispatch-history",
          icon: Truck,
        },
        {
          name: "Finished Goods",
          path: "store/finished-goods",
          icon: Box,
        },
        {
          name: "Damage & Returns",
          path: "store/damage-returns",
          icon: FileText,
        },
      ],
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
      name: "Client / Vendor",
      path: "clients",
      icon: Users,
      allowedRoles: ["sales", "store manager", "Admin", "Super Admin"],
    },
    {
      name: "Quotations",
      path: "quotations",
      icon: FileText,
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
      name: "Challan",
      path: "challan",
      icon: ScrollText,
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

  // Keep Store expanded if current path is under store
  useEffect(() => {
    if (currentSubPath.startsWith("store")) {
      setExpandedMenus((prev) => ({ ...prev, Store: true, Stores: true }));
    }
  }, [currentSubPath]);

  const toggleSubMenu = (menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const getActiveTabTitle = () => {
    if (
      location.pathname === "/pages/mainModule" ||
      location.pathname === "/pages/mainModule/"
    ) {
      return "Dashboard";
    }
    if (isProfileActive) return "User Profile";

    if (currentSubPath.startsWith("store")) {
      return "Store";
    }

    for (const item of menuItems) {
      if (item.subItems) {
        const foundSub = item.subItems.find(
          (sub) =>
            currentSubPath === sub.path ||
            (sub.path !== "store" && currentSubPath.startsWith(`${sub.path}`)) ||
            (sub.path === "store" && (currentSubPath === "store" || currentSubPath === "store/store-master"))
        );
        if (foundSub) {
          return item.name;
        }
      }
      if (
        item.path &&
        (currentSubPath === item.path || currentSubPath.startsWith(`${item.path}/`))
      ) {
        return item.name;
      }
    }
    return "Dashboard";
  };

  const activeTab = getActiveTabTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-xs">
      {/* Mobile Drawer Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-64 bg-slate-900 text-white p-3.5 flex flex-col h-screen border-r border-slate-800 shrink-0 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="px-2.5 py-3 mb-2 shrink-0 flex items-center justify-between border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Inventory ERP
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Operations & Sales</p>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1 min-h-0 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSub = Array.isArray(item.subItems) && item.subItems.length > 0;
            const isParentActive =
              currentSubPath === item.path ||
              currentSubPath.startsWith(`${item.path}/`) ||
              (hasSub && item.subItems.some((sub) => currentSubPath === sub.path || currentSubPath.startsWith(`${sub.path}`)));
            const isExpanded = !!expandedMenus[item.name];

            if (hasSub) {
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleSubMenu(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer text-xs font-semibold ${
                      isParentActive
                        ? "bg-slate-800 text-white border-l-2 border-blue-500"
                        : "hover:bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon size={16} className={isParentActive ? "text-blue-400" : "text-slate-400"} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="text-slate-400 p-0.5">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </button>

                  {/* Submenu Items */}
                  {isExpanded && (
                    <div className="ml-3 pl-2.5 border-l border-slate-800 space-y-0.5 animate-in fade-in duration-200">
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon || Package;
                        const isSubActive =
                          sub.path === "store"
                            ? currentSubPath === "store" || currentSubPath === "store/store-master"
                            : currentSubPath === sub.path || currentSubPath.startsWith(`${sub.path}`);

                        return (
                          <button
                            key={sub.name}
                            type="button"
                            onClick={() => {
                              navigate(`/pages/mainModule/${sub.path}`);
                              setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] text-left font-medium ${
                              isSubActive
                                ? "bg-blue-600 text-white font-semibold shadow-xs"
                                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                            }`}
                          >
                            <SubIcon size={13} className={isSubActive ? "text-white" : "text-slate-500"} />
                            <span className="truncate">{sub.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  navigate(`/pages/mainModule/${item.path}`);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer text-xs font-semibold ${
                  isParentActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                    : "hover:bg-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                <Icon size={16} className={isParentActive ? "text-white" : "text-slate-400"} />
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
              onClick={() => {
                navigate("/pages/mainModule/profile");
                setIsSidebarOpen(false);
              }}
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
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-gray-50 text-slate-800">
        {/* Top Header Navbar */}
        <Navbar
          activeTab={activeTab}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Viewport Content */}
        <div className="flex-1 p-3.5 sm:p-5 md:p-6 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />

            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="store" element={<StorePage />} />
            <Route path="store/store-master" element={<StorePage />} />
            <Route path="store/material-requests" element={<StorePage />} />
            <Route path="store/dispatch-history" element={<StorePage />} />
            <Route path="store/finished-goods" element={<StorePage />} />
            <Route path="store/damage-returns" element={<StorePage />} />
            <Route path="store/damage-reports" element={<StorePage />} />
            <Route path="products" element={<ProductTab />} />

            <Route path="clients/:clientId" element={<ClientDetailPage />} />
            <Route path="clients" element={<ClientListPage />} />
            <Route path="quotations" element={<QuotationListPage />} />
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

            <Route
              path="challan"
              element={
                <ChallanListPage
                  onOpenCreate={() => navigate("/pages/mainModule/challan/new")}
                />
              }
            />
            <Route
              path="challan/new"
              element={
                <CreateChallanPage
                  onBack={() => navigate("/pages/mainModule/challan")}
                  onSuccess={() => navigate("/pages/mainModule/challan")}
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