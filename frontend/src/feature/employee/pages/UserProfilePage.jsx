import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  KeyRound,
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const UserProfilePage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUserData(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Error reading stored user:", err);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  };

  const user = userData || {};
  const employeeName = user.employee_name || user.name || "Employee";
  const email = user.email_id || user.email || "N/A";
  const role = user.role || "User";
  const empCode = user.employee_code || user.empId || (user.id ? `EMP${String(user.id).padStart(3, '0')}` : "N/A");
  const mobile = user.mobile_number || user.mobile || "N/A";
  const department = user.department || "N/A";
  const designation = user.designation || role || "N/A";
  const branch = user.location_branch || "N/A";
  const status = user.employee_status || user.status || "Active";

  // Initials for avatar
  const initials = employeeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "EP";

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">

      {/* 🌟 1. PROFILE BANNER / HERO CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 md:p-8 shadow-xl border border-blue-900/40">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-lg border-2 border-white/20 shrink-0">
              {initials}
            </div>

            {/* Title Details */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {employeeName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {role}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {status}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">{email}</span>
              </p>

              <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-blue-300 font-semibold">{empCode}</span>
                <span>•</span>
                <span>{designation}</span>
              </p>
            </div>
          </div>

          {/* Quick Sign Out Action */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full md:w-auto bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-300 border-white/20 hover:border-rose-400/40 text-xs font-semibold gap-2 transition-all shrink-0 cursor-pointer justify-center"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* 🌟 2. UNIFIED DETAIL CARD */}
      <Card className="bg-white shadow-sm border-gray-200">
        <CardHeader className="pb-4 border-b border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base font-semibold text-gray-900">
              Profile & Organization Details
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-500">
            Account identity, assigned role, organizational unit and contact details
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* 1. Account & System Identity */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Account & System Identity
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  <p className="text-xs text-gray-500 font-medium">Email Address</p>
                  <p className="text-sm font-semibold text-gray-900 truncate" title={email}>
                    {email}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 font-medium">Assigned Role</p>
                  <p className="text-sm font-semibold text-indigo-700 font-mono">
                    {role}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 font-medium">Employee Code</p>
                  <p className="text-sm font-bold text-gray-900 font-mono">
                    {empCode}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 font-medium">Account Status</p>
                  <p className="text-sm font-semibold text-emerald-700 capitalize">
                    {status}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* 2. Department & Location Details */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Department & Placement Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 font-medium">Department</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {department}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 font-medium">Designation</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {designation}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 font-medium">Branch / Location</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {branch}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 font-medium">Contact Number</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {mobile}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
