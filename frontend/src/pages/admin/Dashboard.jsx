import React, { useState, useEffect } from 'react';
import InventoryItems from '../modules/InventoryItems.jsx';
import ItemsDirectory from '../modules/ItemsDirectory.jsx';
import IssueMaster from '../modules/IssueMaster.jsx';
import BranchMaster from '../modules/BranchMaster.jsx';
import VendorsDirectory from '../modules/VendorDirectory.jsx';
import logoImage from '../../assets/Accuprobe_image.jpg';
import {
    LayoutDashboard,
    Boxes,
    Users,
    GitFork,
    FolderKanban,
    Settings,
    LogOut,
    X,
    ShieldCheck,
    Layers,
    UserPlus,
    Key,
    UserCheck,
    RefreshCw,
    Eye,
    Truck,
    Edit3,
    Menu
    
} from "lucide-react";

const Dashboard = () => {


    const storedUser = localStorage.getItem('user');
    // const user = storedUser ? JSON.parse(storedUser) : { email: "Yogesh.Pandey@satyamicrocapital.com", role: "admin" };

    if (!storedUser) {
        window.location.href = '/login';
        return null;
    }

    const user = JSON.parse(storedUser);


    const userRole = (user?.role || user?.Role || 'employee').toLowerCase();
    const menuItems = [
        // { name: 'Overview', icon: LayoutDashboard, allowedRoles: ['admin', 'branch admin', 'employee']},
        { name: 'Stocks In', icon: Boxes, allowedRoles: ['admin', 'branch admin', 'employee'] },
        //   { name: 'Stock In', icon: Boxes, allowedRoles: ['admin', 'branch admin', 'employee'] },
        { name: 'Item Issue', icon: Users, allowedRoles: ['admin', 'branch admin'] },
        { name: 'Stock Transfers', icon: GitFork, allowedRoles: ['admin', 'branch admin'] },
        { name: 'Branch Master', icon: FolderKanban, allowedRoles: ['admin'] },
        { name: 'Employee Master', icon: Users, allowedRoles: ['admin'] },
        { name: 'Items', icon: Layers, allowedRoles: ['admin', 'branch admin'] },
        { name: 'Vendors Control', icon: Truck, allowedRoles: ['admin'] },
        // { name: 'Analytics Control', icon: TrendingUp, allowedRoles: ['admin']  },
        // { name: 'System Settings', icon: Settings, allowedRoles: ['admin']  },
    ];

    const initialDefaultTab = menuItems.find(item =>
        item.allowedRoles.includes(userRole)
    )?.name || 'Overview';

    const [activeTab, setActiveTab] = useState(initialDefaultTab);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'assign'

    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState(null);

    // Unified Input Form State - using 'empId' consistently
    const [empId, setEmpId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('employee');
    const [status, setStatus] = useState('active');
    const [branch, setBranch] = useState('Main Head Office');
    const [showPassword, setShowPassword] = useState(false);

    const [formMessage, setFormMessage] = useState('');
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false);

    const [employees, setEmployees] = useState([]);
    //  const [fetchLoading, setFetchLoading] = useState(true);

    // Initial table representation rows matching your phpMyAdmin structure
    // const [employees, setEmployees] = useState([
    //     { EmpId: "EMP001", Name: "Kamal Singh", Mail: "kamal@gmail.com", role: "admin" },
    //     { EmpId: "EMP002", Name: "Rahul Sharma", Mail: "rahul@gmail.com", role: "employee" },
    //     { EmpId: "EMP003", Name: "Priya Patel", Mail: "priya@gmail.com", role: "branch admin" }
    // ]);

    //      React.useEffect(() => {
    //     const fetchDatabaseRegistry = async () => {
    //         try {
    //             const response = await fetch('https://inventory-manage-q4yr.onrender.com/api/auth/employees', {
    //                 method: 'GET',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 credentials: 'include' // Attaches session cookies if enforced by backend guards
    //             });

    //             const result = await response.json();

    //             if (result.success) {
    //                 // Map database array results directly into the React display engine
    //                 setEmployees(result.data || []);
    //             } else {
    //                 console.error("Server rejected registry read payload:", result.message);
    //             }
    //         } catch (err) {
    //             console.error("Failed to connect to port 5001 database subsystem:", err);
    //         } finally {
    //             setFetchLoading(false);
    //         }
    //     };

    //     // Fire data synchronization sequence if user role is permitted
    //     if (userRole === 'admin') {
    //         fetchDatabaseRegistry();
    //     } else {
    //         setFetchLoading(false);
    //     }
    // }, [userRole]);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [rowsPerPage] = useState(30);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [offices, setOffices] = useState([]);
    const [selectedOfficeId, setSelectedOfficeId] = useState('');

    useEffect(() => {
        const fetchDatabaseRegistry = async () => {
            try {
                const response = await fetch(`https://inventory-manage-q4yr.onrender.com/api/auth/employees?page=${currentPage}&limit=${rowsPerPage}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                const result = await response.json();

                if (result.success) {
                    setEmployees(result.data || []);
                    setTotalPages(result.pagination?.totalPages || 1);
                }
            } catch (err) {
                console.error("Failed to sync database payload grid matrix:", err);
            }
        };

        if (userRole === 'admin') {
            fetchDatabaseRegistry();
        }
    }, [userRole, currentPage, rowsPerPage]);

    useEffect(() => {
        const fetchOffices = async () => {
            try {
                const res = await fetch('https://inventory-manage-q4yr.onrender.com/api/branch?limit=1000', { credentials: 'include' });
                const result = await res.json();
                if (result.success) setOffices(result.data || []);
            } catch (err) {
                console.error("Failed to load office directory:", err);
            }
        };
        if (userRole === 'admin') fetchOffices();
    }, [userRole]);


    const getVisiblePageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };


    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormMessage('');
        setLoading(true);

        // 🎯 UNIFIED PAYLOAD: Sends 'EmpId' (Capital I) to match your updated backend exactly
        // const payload = {
        //     EmpId: empId.trim(),
        //     name: name.trim(),
        //     email: email.trim(),
        //     password,
        //     role: selectedRole
        // };


        console.log("🔥 [handleFormSubmit] Form submission triggered. Mode:", modalMode, "EmpId:", empId, "Name:", name, "Email:", email, "Role:", selectedRole, "OfficeID:", selectedOfficeId);

        const payload = modalMode === 'add'
            ? {
                name: name.trim(),
                email: email.trim(),
                password,
                role: selectedRole,
                OfficeID: selectedOfficeId || null
            }
            : {
                name: name.trim(),
                EmpId: empId.trim(),
                password,
                role: selectedRole,
                OfficeID: selectedOfficeId || null
            };


        //   console.log("🔥 [handleFormSubmit] Payload being sent to backend:", payload);


        try {
            const endpoint = modalMode === 'add' ? '/api/auth/add-employee' : '/api/auth/update-credentials';

            // const response = await fetch(`https://inventory-manage-q4yr.onrender.com${endpoint}`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload)
            // });
            // const response = await fetch(`http://localhost:5001${endpoint}`, {
            const response = await fetch(`https://inventory-manage-q4yr.onrender.com${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                setFormMessage(data.message);

                if (modalMode === 'add') {
                    // setEmployees([...employees, { EmpId: empId, Name: name, Mail: email, role: selectedRole }]);
                    setCurrentPage(1);
                } else {
                    // setEmployees(employees.map(emp => emp.EmpId === empId ? { ...emp, role: selectedRole } : emp));

                    setEmployees(employees.map(emp => emp.EmpId === empId ? { ...emp, role: selectedRole, OfficeID: selectedOfficeId } : emp));

                }

                setTimeout(() => setIsModalOpen(false), 1200);
            } else {
                setFormError(data.message || 'Operation rejected.');
            }
        } catch (err) {
            setFormError("Server connection lost. Is port 5001 active?");
        } finally {
            setLoading(false);
        }
    };

    // const triggerAddModal = () => {
    //     setModalMode('add');
    //     setEmpId('');
    //     setName('');
    //     setEmail('');
    //     setPassword('');
    //     setSelectedRole('employee');
    //     setIsModalOpen(true);
    // };

    const triggerAddModal = () => {
        setModalMode('add');
        setEmpId('');
        setName('');
        setEmail('');
        setPassword('');
        setSelectedRole('employee');
        setSelectedOfficeId('');
        setIsModalOpen(true);
    };

    // const triggerAssignModal = (employee) => {
    //     setModalMode('assign');
    //     setEmpId(employee.EmpId);
    //     setName(employee.Name);
    //     setEmail(employee.Mail);
    //     setPassword('');
    //     setSelectedRole(employee.role);
    //     setIsModalOpen(true);
    // };


    const triggerAssignModal = (employee) => {

        console.log("🔥 [triggerAssignModal] Employee object received:", employee);

        setModalMode('assign');
        setEmpId(employee.EmpId);
        setName(employee.Name);
        setEmail(employee.Mail);
        setPassword('');
        setSelectedRole(employee.role);
        setSelectedOfficeId(employee.OfficeID || '');
        setIsModalOpen(true);
    };


    const triggerViewModal = (employee) => {
        setSelectedEmp(employee);
        setIsViewOpen(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-white text-black-100 flex antialiased relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
           
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200"
                    >
                        <Menu size={24} color="black" />
                    </button>
                )}

            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/40 z-30"
                />
            )}

            {/* SIDEBAR COMPONENT */}
            {/* <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 backdrop-blur-md hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto"> */}
            <aside
                className={`
                    fixed md:sticky top-0 left-0 z-40
                    w-64 flex-shrink-0
                    bg-white border-r border-gray-200
                    h-screen overflow-y-auto
                    flex flex-col

                    transform transition-transform duration-300 ease-in-out

                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0
                    `}
            >
                <div className="h-16 flex items-center px-6 border-b border-gray-200 gap-3">
                    {/* <Layers className="w-5 h-5 text-blue-400" /> */}

                    <img
                        src={logoImage}
                        alt="Accuprobe Logo"
                        className="w-12 h-12 object-contain rounded-md"
                    />

                    {/* <span className="font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                       Accuprobe <span className="text-blue-500 text-xs font-semibold">Pro</span>
                    </span> */}
                    {/* <span className="font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent text-base">
                        Accuprobe
                    </span> */}

                    <span className="font-bold tracking-tight text-gray-900 text-base">
                        Accuprobe
                    </span>

                      {/* Mobile Close Button */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto md:hidden"
                    >
                        <X size={22}/>
                    </button>

                </div>

                <div className="px-4 py-3 mx-3 my-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
                    <ShieldCheck size={16} className="text-blue-400" />
                    <div className="flex flex-col min-w-0 text-xs">
                        <span className="text-gray-700 font-medium truncate">{user.email || user.Mail}</span>
                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">{user.role} ACCESS</span>
                    </div>
                </div>

                <nav className="px-3 space-y-1 flex-1">
                    {menuItems
                        .filter(item => item.allowedRoles.includes(userRole))
                        .map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.name;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        setActiveTab(item.name)
                                        setSidebarOpen(false);
                                        }}
                                    
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {item.name}
                                </button>
                            );
                        })}
                </nav>

                {/* <div className="p-4 border-t border-[#1E2943]">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                        <LogOut size={15} /> Sign Out Session
                    </button>
                </div> */}
            </aside>

            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 backdrop-blur-sm">
                    <h1 className="text-lg font-bold text-gray-900">{activeTab}</h1>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLogout} // Calls your exact existing logout trigger function natively
                            className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg text-xs font-bold transition-all duration-200 active:scale-[0.97] cursor-pointer"
                        >
                            <LogOut size={13} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </header>

                <main className="p-6 md:p-8 flex-1 overflow-y-auto">

                    {activeTab === 'Stocks In' && (
                        <InventoryItems
                            user={user}
                            userRole={userRole}
                        />

                    )}

                    {activeTab === 'Branch Master' && (
                        <BranchMaster
                            user={user}
                            userRole={userRole}
                        // employees={employees}
                        />

                    )}


                    {activeTab === 'Items' && (
                        <ItemsDirectory userRole={userRole} />
                    )}

                    {activeTab === 'Item Issue' && (
                        <IssueMaster
                            userRole={userRole}
                            userOfficeId={user?.officeId || user?.OfficeID || 1}
                            context="itemIssue"
                        />
                    )}

                    {activeTab === 'Stock Transfers' && (
                        <IssueMaster
                            userRole={userRole}
                            userOfficeId={user?.officeId || user?.OfficeID || 1}
                            forcedInitialTab="branchTransfers" // Configured natively below
                            context="stockTransfers"
                        />
                    )}

                    {activeTab === 'Vendors Control' && <VendorsDirectory userRole={userRole} />}


                    {activeTab === 'Employee Master' && userRole === 'admin' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                                <div>
                                    <h2 className="text-md font-bold text-gray-900">Personnel Directory Registry</h2>
                                    <p className="text-xs text-gray-600  mt-0.5">Activate credential keys or log clean operational profiles directly into the database.</p>
                                </div>
                                <button
                                    onClick={triggerAddModal}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/10"
                                >
                                    <UserPlus size={14} /> Add Employee
                                </button>
                            </div>



                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-gray-200 bg-gray-50  text-gray-700 font-bold text-[11px] tracking-wider grid grid-cols-12 hidden md:grid">

                                    <div className="col-span-2">Employee ID</div>
                                    <div className="col-span-2">Full Name</div>
                                    <div className="col-span-3">Email Id</div>
                                    <div className="col-span-2">Branch</div>
                                    <div className="col-span-1">Role</div>
                                    <div className="col-span-1">Status</div>
                                    <div className="col-span-1 text-right">Actions</div>
                                </div>

                                <div className="divide-y divide-gray-200">
                                    {employees.map((emp) => {

                                        const empRole = (emp.role || emp.Role || 'employee').toLowerCase();

                                        const rawStatus = emp.status !== undefined ? emp.status : emp.Status;
                                        const empStatus = (rawStatus == 1 || String(rawStatus).toLowerCase().trim() === 'active') ? 'active' : 'inactive';

                                        return (
                                            <div key={emp.EmpId} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-0 items-center text-xs hover:bg-gray-50 transition-colors">
                                                <div className="col-span-2 font-mono text-blue-600 font-bold">{emp.EmpId}</div>
                                                <div className="col-span-2 font-semibold text-gray-900 break-words">{emp.Name}</div>
                                                <div className="col-span-3 text-gray-900 break-all">{emp.Mail}</div>

                                                <div className="col-span-2 text-gray-900 truncate">{emp.OfficeName || <span className="italic">Unassigned</span>}</div>


                                                <div className="col-span-1">
                                                    <span className={` inline-block whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${empRole === 'admin' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' :
                                                        empRole === 'branch admin' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                                                            'bg-gray-100 border border-gray-300 text-gray-700'
                                                        }`}>
                                                        {empRole}
                                                    </span>
                                                </div>
                                                <div className="col-span-1 flex items-center justify-center gap-2">
                                                    {/* <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                     emp.status === 'active' || emp.status === undefined
                                                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                                      }`}>
                                                       {emp.status || 'active'}
                                                </span> */}

                                                    {/* <span className={`w-12 text-[10px] font-bold uppercase tracking-wider text-right transition-colors duration-200 ${
                                                    (empStatus === 'active' || empStatus === undefined) ? 'text-emerald-400' : 'text-rose-400'
                                                }`}>
                                                    {(empStatus === 'active' || empStatus === undefined) ? 'Active' : 'Inactive'}
                                                </span> */}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            // Determine what the flipped target status value should be
                                                            // const currentStatus = emp.status || 'active';
                                                            // const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
                                                            const nextDbStatus = empStatus === 'active' ? 0 : 1;
                                                            // Instantly sync the mutation into your React state array memory
                                                            setEmployees(employees.map(e => e.EmpId === emp.EmpId ? { ...e, status: nextDbStatus } : e));

                                                            // console.log(`Live status mutation fired for ID: ${emp.EmpId}. Updated state to: ${nextDbStatus.toUpperCase()}`);
                                                        }}
                                                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 outline-none ${(empStatus === 'active' || empStatus === undefined)
                                                            ? 'bg-emerald-500/20 border border-emerald-500/40'
                                                            : 'bg-rose-500/10 border border-rose-500/30'
                                                            }`}
                                                        title={`Click to toggle status to ${empStatus === 'active' ? 'Inactive' : 'Active'}`}
                                                    >
                                                        {/* Sliding hardware style rounded thumb indicator knob knob */}
                                                        <div
                                                            className={`w-3.5 h-3.5 rounded-full shadow-md transform transition-all duration-300 pointer-events-none ${(empStatus === 'active' || empStatus === undefined)
                                                                ? 'translate-x-5 bg-emerald-400'
                                                                : 'translate-x-0 bg-rose-400'
                                                                }`}
                                                        />
                                                    </button>

                                                </div>

                                                <div className="col-span-1.5 flex items-center justify-end gap-2 ml-auto text-right">

                                                    {/* 👁️ VIEW BUTTON */}
                                                    <button
                                                        onClick={() => triggerViewModal(emp)}
                                                        className="px-1.5 py-1 border border-gray-300 hover:border-emerald-500 bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 rounded-md transition-all flex items-center gap-1 font-medium"
                                                    >
                                                        <Eye size={12} />
                                                    </button>

                                                    {/* ✏️ EDIT BUTTON (Triggers your existing credential modal) */}
                                                    <button
                                                        onClick={() => triggerAssignModal(emp)}
                                                        className="px-1.5 py-1 border border- hover:border-blue-500 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-md transition-all flex items-center gap-1 font-medium"
                                                    >
                                                        <Edit3 size={12} />
                                                    </button>

                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>



                                <div className="p-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-700">
                                    <div>
                                        Page <span className="text-blue-400 font-bold">{currentPage}</span> of <span className="text-gray-900 font-semibold">{totalPages}</span>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                                        <button
                                            type="button"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(1)}
                                            className="px-2.5 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-20 disabled:pointer-events-none transition-colors font-medium"
                                            title="First Page"
                                        >
                                            First
                                        </button>

                                        <button
                                            type="button"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            className="px-3.5 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-all font-semibold active:scale-[0.98]"
                                        >
                                            Prev
                                        </button>

                                        {getVisiblePageNumbers().map((pageNumber) => (
                                            <button
                                                key={pageNumber}
                                                type="button"
                                                onClick={() => setCurrentPage(pageNumber)}
                                                className={`w-8 h-8 rounded-md border text-center transition-all font-semibold ${currentPage === pageNumber
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/10'
                                                    : 'border-[#1E2943] bg-[#0B0F19] hover:bg-[#1E2943] text-slate-300'
                                                    }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            className="px-3.5 py-2 border border-[#1E2943] rounded-lg bg-[#0B0F19] hover:bg-[#1E2943] text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all font-semibold active:scale-[0.98]"
                                        >
                                            Next
                                        </button>

                                        <button
                                            type="button"
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            onClick={() => setCurrentPage(totalPages)}
                                            className="px-2.5 py-1.5 border border-[#1E2943] rounded-md bg-[#0B0F19] hover:bg-[#1E2943] text-slate-300 disabled:opacity-20 disabled:pointer-events-none transition-colors font-medium"
                                            title="Last Page"
                                        >
                                            Last
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )
                    }
                </main>
            </div>

            {/* DYNAMIC FORM MODAL INTERACTION DRAWER */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#131B2E] border border-[#1E2943] rounded-2xl p-6 shadow-2xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#1E2943]">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                {modalMode === 'add' ? <UserPlus size={16} /> : <UserCheck size={16} />}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white capitalize">{modalMode === 'add' ? 'Register New Staff Node' : 'Override Terminal Keys'}</h3>
                                <p className="text-[11px] text-slate-400">{modalMode === 'add' ? 'Directory Database Expansion' : `Targeting User Code: ${empId}`}</p>
                            </div>
                        </div>

                        {formMessage && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-xs font-medium text-center mb-4">{formMessage}</div>}
                        {formError && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg text-xs text-center mb-4">{formError}</div>}

                        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                            {/* <div className="space-y-1.5">
                                <label className="text-slate-400 font-semibold block ml-0.5">Unique Employee ID</label>
                                <input type="text" value={empId} onChange={(e) => setEmpId(e.target.value)} disabled={modalMode === 'assign'} className="w-full h-10 px-3 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-40" required />
                            </div> */}

                            <div className="space-y-1.5">
                                <label className="text-slate-400 font-semibold block ml-0.5">Full Name</label>
                                <input
                                    type="text"
                                    value={name} // 🎯 Automatically shows the actual Name loaded from triggerAssignModal
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={modalMode === 'assign'} // 🔒 Locked down completely in edit mode
                                    className="w-full h-10 px-3 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-40"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-slate-400 font-semibold block ml-0.5">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@company.com"
                                    className="w-full h-10 px-3 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-slate-400 font-semibold block ml-0.5">
                                    {modalMode === 'add' ? 'Temporary Password' : 'Assign New Password Key'}
                                </label>
                                <div className="relative flex items-center w-full">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        // className="w-full h-10 px-3 px-10 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500" 
                                        className="w-full h-10 pl-3 pr-10 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                        required={modalMode === 'add'}

                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        // className='absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors'
                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-slate-500 hover:text-slate-300 transition-colors z-10"
                                    >

                                        <Eye size={14} className={showPassword ? "text-blue-400" : "text-slate-500"} />
                                    </button>
                                </div>
                            </div>

                            {/* {modalMode === 'add' && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-slate-400 font-semibold block ml-0.5">Full Name</label>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full h-10 px-3 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-slate-400 font-semibold block ml-0.5">Email Address</label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" className="w-full h-10 px-3 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500" required />
                                    </div>
                                </>
                            )} */}

                            {/* <div className="space-y-1.5">
                                <label className="text-slate-400 font-semibold block ml-0.5">{modalMode === 'add' ? 'Temporary Password' : 'Assign New Password Key'}</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-10 px-3 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500" required />
                            </div> */}

                            <div className="space-y-1.5">
                                <label className="text-slate-400 font-semibold block ml-0.5">Assigned Facility Branch</label>
                                {/* <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full h-10 px-2 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500">
                                    <option value="Main Head Office">Main Head Office (HQ)</option>
                                    <option value="North Warehousing Hub">North Warehousing Hub</option>
                                    <option value="South Logistics Center">South Logistics Center</option>
                                    <option value="Eastern Distribution Point">Eastern Distribution Point</option>
                                </select> */}

                                <select value={selectedOfficeId} onChange={(e) => setSelectedOfficeId(e.target.value)} className="w-full h-10 px-2 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500">
                                    <option value="">-- Select Branch --</option>
                                    {offices.map(office => (
                                        <option key={office.ID} value={office.ID}>{office.OfficeName}</option>
                                    ))}
                                </select>



                            </div>


                            <div className="space-y-1.5">
                                <label className="text-slate-400 font-semibold block ml-0.5">Select Role</label>
                                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full h-10 px-2 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500">
                                    <option value="employee">Employee Terminal (Standard)</option>
                                    <option value="branch admin">Branch Admin Terminal (Medium Privilege)</option>
                                    <option value="admin">Master Administrator (Full Access)</option>
                                </select>
                            </div>

                            {modalMode === 'assign' && (
                                <div className="space-y-1.5">
                                    <label className="text-slate-400 font-semibold block ml-0.5">Operational System Status</label>
                                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 px-2 bg-[#0B0F19] border border-[#1E2943] text-slate-200 rounded-lg focus:outline-none focus:border-blue-500">
                                        <option value="active">Active (Access Granted)</option>
                                        <option value="inactive">Inactive (Access Suspended)</option>
                                    </select>
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                                {modalMode === 'add' ? 'Log Profile Entry' : 'Apply Security Overrides'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {isViewOpen && selectedEmp && (
                <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-[#131B2E] border border-[#1E2943] rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">

                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

                        <button onClick={() => setIsViewOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                            <X size={18} />
                        </button>

                        {/* Top Profile Summary Header */}
                        <div className="flex flex-col items-center text-center mt-2 border-b border-[#1E2943] pb-5">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-lg font-black shadow-inner mb-3">
                                {selectedEmp.Name.charAt(0)}
                            </div>
                            <h3 className="text-base font-bold text-white tracking-tight">{selectedEmp.Name}</h3>
                            <span className="font-mono text-xs text-blue-400 font-bold mt-1 bg-[#0B0F19] px-2.5 py-0.5 border border-[#1E2943] rounded-full">
                                {selectedEmp.EmpId}
                            </span>
                        </div>

                        {/* Property Details Layout Grid */}
                        <div className="py-4 space-y-3 text-xs">
                            <div className="flex justify-between items-center bg-[#0B0F19]/30 p-2.5 rounded-lg border border-[#1E2943]/40">
                                <span className="text-slate-400 font-medium">Email</span>
                                <span className="text-slate-200 font-semibold truncate max-w-[180px]">{selectedEmp.Mail}</span>
                            </div>

                            <div className="flex justify-between items-center bg-[#0B0F19]/30 p-2.5 rounded-lg border border-[#1E2943]/40">
                                <span className="text-slate-400 font-medium">Assigned Branch</span>
                                <span className="text-slate-200 font-semibold truncate max-w-[180px]">
                                    {/* {selectedEmp.branch || 'Main Head Office'} */}
                                    {selectedEmp.OfficeName || 'Unassigned'}

                                </span>
                            </div>

                            <div className="flex justify-between items-center bg-[#0B0F19]/30 p-2.5 rounded-lg border border-[#1E2943]/40">
                                <span className="text-slate-400 font-medium">Role</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedEmp.role === 'admin' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' :
                                    selectedEmp.role === 'branch admin' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                                        'bg-slate-500/10 border border-slate-500/20 text-slate-400'
                                    }`}>
                                    {selectedEmp.role}
                                </span>
                            </div>

                            <div className="flex justify-between items-center bg-[#0B0F19]/30 p-2.5 rounded-lg border border-[#1E2943]/40">
                                <span className="text-slate-400 font-medium">Status</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    // selectedEmp.status === 'active' || selectedEmp.status === undefined
                                    (Number(selectedEmp.status) === 1 || selectedEmp.status === undefined)
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                    }`}>
                                    {/* {selectedEmp.status || 'active'} */}
                                    {(Number(selectedEmp.status) === 1 || selectedEmp.status === undefined) ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        {/* Close Trigger Button */}
                        {/* <button 
                            onClick={() => setIsViewOpen(false)} 
                            className="w-full h-10 border border-[#1E2943] bg-[#0B0F19]/40 hover:bg-[#1E2943]/60 text-slate-300 font-semibold text-xs rounded-lg transition-colors mt-1 active:scale-[0.99]"
                        >
                            Dismiss Profile Sheet
                        </button> */}
                    </div>
                </div>
            )}


        </div>
    );
};

export default Dashboard;