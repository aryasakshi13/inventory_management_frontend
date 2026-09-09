import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, X, AlertCircle } from "lucide-react";

export const Navbar = ({ activeTab, onToggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    // 1. Clear stored authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");

    // 2. Redirect back to login page
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-gray-200 bg-white flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile Sidebar Toggle Hamburger */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">
              {activeTab}
            </h1>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              ERP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sign Out Button */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all duration-200 active:scale-[0.97] cursor-pointer"
            title="Sign Out of ERP"
          >
            <LogOut size={14} className="shrink-0" />
            <span className="hidden xs:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* 🌟 Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden p-6 space-y-4 text-xs animate-in zoom-in-95 duration-150">
            {/* Header Icon & Title */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
                <LogOut size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Confirm Sign Out</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Are you sure you want to log out of your session? You will need your login credentials to access the system again.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer border border-gray-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Yes, Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};