

import './App.css';
import React, {lazy, Suspense} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// import ProtectedRoute from './components/ProtectedRoute';
import './index.css';
import ProtectedRoute from './components/protectedRoute';
  
// const Login = lazy(() => import('./pages/auth/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));

function App() {
  return (
    <Router>
      <Suspense fallback={
        <div className="min-h-screen bg-[#0B0F19] text-blue-500 flex flex-col items-center justify-center font-mono text-xs tracking-widest gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
             DEPLOYING WORKSPACE DESKTOP NODE...
        </div>
      }
      >
      <Routes>
         <Route path ="/login" element={<Login/>}/>
         <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'branch admin', 'employee']}>
                <Dashboard />
              </ProtectedRoute>
         } />
          <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
     </Suspense>

    </Router>
  )
}

export default App
