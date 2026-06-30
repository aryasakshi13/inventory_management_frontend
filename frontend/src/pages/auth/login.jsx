
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldX, Lock, Mail, Loader2, LogOut } from "lucide-react";
// import { LogOut } from "lucide-react";

const Login = () =>{

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
const [successMessage, setSuccessMessage] = useState('');
const [logoutLoading, setLogoutLoading] = useState(false);

const navigate = useNavigate()

    async function handleLogin (e){
     e.preventDefault();
      setError('');
      setSuccessMessage('');3
     setLoading(true);

     try{

        const baseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:5001'
            : 'https://inventory-manage-q4yr.onrender.com';

        // const response = await fetch('https://inventory-manage-q4yr.onrender.com/api/auth/login',{
         const response = await fetch(`${baseUrl}/api/auth/login`,{
            method: 'POST',
            headers:{
                'Content-type': 'application/json' 
            },

            credentials: 'include',
            body: JSON.stringify({
                email:email.trim(),
                password: password
            })
        });

        const data = await response.json();

        console.log("Response data from Backend Login API:", data);
        if(data.success && data.user){


            localStorage.setItem('user', JSON.stringify(data.user));
    
        // 🌟 YEH LOG ADD KAREIN: Dekhein ki token data ke andar aa bhi raha hai ya nahi
      console.log("Token received inside data:", data.token);

            // const extractedRole = data.role || data.Role || data.user?.role || data.user?.Role || 'employee';

            // const userSession = {
            //     email: email.trim(),
            //     // role: data.role || (data.user && data.user.role) || 'admin'
            //     role: extractedRole.toLowerCase(),
            //     officeId: data.user?.officeId || null 
            // };
            localStorage.setItem('user', JSON.stringify(data.user));

            console.log("Token in storage right after saving:", localStorage.getItem('authToken'));
            
           if (data.token) {
                localStorage.setItem('authToken', data.token); // 🌟 Crucial to bypass 401 errors
            }

            setSuccessMessage('LoggedIn Successfully..');
            setLoading(false);
            
            const targetRoute = data.redirecteTo || '/employee/dashboard';

            setTimeout(() => {
                navigate('/admin/dashboard');
                }, 1500);
        }else{
            setError(data.message);
        }
     }catch(err){
        setError("Connection failed...")
     }
     finally{
        setLoading(false);
     }
}

async function handleLogout() {
        setError('');
        setSuccessMessage('');
        setLogoutLoading(true);

        try {
            const response = await fetch('https://inventory-manage-q4yr.onrender.com/api/auth/logout', {
                method: 'POST',
                credentials: 'include' // Sends the secure cookie to the server to be explicitly destroyed
            });

            const data = await response.json();

            if (data.success) {
                localStorage.removeItem('user');
                setSuccessMessage('👋 Admin session cleared. Storage logs closed.');
                setEmail('');
                setPassword('');
            } else {
                setError(data.message || 'Logout cleanup routine rejected.');
            }
        } catch (err) {
            setError("Connection failed. Could not broadcast session termination.");
        } finally {
            setLogoutLoading(false);
        }
    }


 return(
   <div className="flex flex-col justify-center min-h-screen items-center bg-[#0B0F19] px-4 antialiased relative overflow-hidden gap-4">

             {/* Logout button */}
           <div className="absolute top-4 right-4 z-20">
                <Button 
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    variant="ghost" 
                    className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-medium gap-2 border border-[#1E2943] bg-[#131B2E]/60 backdrop-blur-sm px-3 h-9 transition-all"
                >
                    <LogOut size={13} />
                    {logoutLoading ? 'Clearing...' : 'Sign Out'}
                </Button>
            </div> 



            {/* Ambient High-End Glowing Backdrop (Aceternity UI Style) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />
               
            {/* Main Admin Card Context Wrapper */}
            <Card className="w-full max-w-md bg-[#131B2E]/90 border-[#1E2943] text-slate-100 shadow-2xl backdrop-blur-md relative z-10 py-2">
                <CardHeader className="space-y-2 text-center pt-8">
                    <div className="mx-auto bg-amber-500/10 w-12 h-12 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-inner mb-2">
                        <ShieldX className="w-6 h-6 text-amber-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                        IMS Admin Gateway
                    </CardTitle>
                    {/* <CardDescription className="text-slate-400 text-xs max-w-xs mx-auto mb-6 leading-relaxed">
                        Enter administrative access phrases to decrypt system inventories.
                    </CardDescription> */}
                </CardHeader>

                <CardContent className="px-8 pb-6 space-y-5">
                    {/* Green Bouncing Success Notification Banner */}
                    {successMessage && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg mb-5 text-xs font-medium text-center animate-bounce" role="alert">
                            {successMessage}
                        </div>
                    )}

                    {/* Red Error Notification Banner */}
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg mb-5 text-xs text-center" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-slate-300 text-xs font-semibold tracking-wide block ml-1">Admin Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input 
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@company.com"
                                    className="pl-10 !bg-[#0B0F19] border-[#1E2943] !text-slate-100 placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all h-11"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password" className="text-slate-300 text-xs font-semibold tracking-wide block ml-1">Password</Label>
                                {/* Phase 3 Token Hook Link */}
                                {/* <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                    Forgot phrase?
                                </Link> */}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input 
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-10 !bg-[#0B0F19] border-[#1E2943] !text-slate-100 placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all h-11"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-center items-center pt-2">
                            <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-blue-400 transition-colors tracking-wide">
                                Forgot password?
                            </Link>
                        </div>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/10 active:scale-[0.99] disabled:opacity-50 mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2 justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Authorizing Terminal...
                                </span>
                            ) : " Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* 🛠️ TEMPORARY SANDBOX TESTING PANEL: Fire Admin Sign Out Live */}
            {/* <div className="w-full max-w-md bg-[#131B2E]/40 border border-dashed border-[#1E2943] rounded-xl p-4 flex items-center justify-between shadow-sm relative z-10 backdrop-blur-sm">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Sandbox</span>
                    <span className="text-xs text-slate-500">Kill admin token state live</span>
                </div>
                <Button 
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    variant="destructive" 
                    className="flex items-center gap-2 text-xs py-1.5 h-9 bg-rose-950/40 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 transition-all"
                >
                    <LogOut size={14} />
                    {logoutLoading ? 'Clearing...' : 'Force Admin Logout'}
                </Button>
            </div> */}

        </div>
 )

}
export default Login;




// {/* <div className='w-full max-w-md bg-white p-4 rounded-xl shadow-lg border border-slate-200/60'>
        
//         {/* Header */}
//           <div className="text-center mb-8">
//             <h2 className='text-2xl font-bold text-slate-800 tracking-tight'>Portal login </h2>
//             <p className='text-slate-500 mt-2'>Enter your credentials to access your workspace.</p>

//           </div>

//             {successMessage && (
//               <div className='text-emerald-800 text-green-600 bg-emerald-50 border border-emerald-200 p-3 rounded-lg mb-6 text-sm font-medium text-center animate-bounce' role="alert">
//                 {successMessage}
//               </div>
//             )}

//           {error && (
//             <div className='text-red-800 bg-red-50 border border-red-200 p-3 rounded-lg mb-6' role="alert">
//                 {error}
//             </div>
//           )}
//           <form onSubmit={handleLogin} className='space-y-5'>

//             <div>
//                 <label className='block font-semibold text-slate-700 mb-2'>
//                     Email Address
//                 </label>
//                 <input
//                  type="email"
//                  value={email}
//                  onChange={(e) =>setEmail(e.target.value)}
//                  required
//                  autoFocus
//                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus: border-blue-500 transition-colors"
//                  placeholder="admin@company.com"
//                  />
//             </div>
//              <div>
//                 <label className="block font-semibold text-slate-700 mb-2">
//                     Password
//                 </label>
//                 <input
//                  type= "password"
//                  value={password}
//                  onChange={(e) => setPassword(e.target.value)}
//                  required
//                  className='w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors'
//                  placeholder= "Admin@123"
//                 />
//              </div>
//              <button
//                  type="submit"
//                  disabled ={loading}
//                  className=' w-full bg-blue-600 text-white px-4 rounded-lg font-semibold transition-all '
//                  >
//                  {loading? 'Authenticating' : 'SignIn'}
//              </button>
//           </form>
     
//         </div> */}