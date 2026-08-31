import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export const Navbar = ({ activeTab }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Clear stored authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");

    // 2. Redirect back to login page
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-bold text-gray-900">{activeTab}</h1>

      <div className="flex items-center gap-3">
        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all duration-200 active:scale-[0.97] cursor-pointer"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};