import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // const role = user.role?.toLowerCase();


    if (allowedRoles && !allowedRoles.includes(user.role.toLowerCase())) {
        return <Navigate to="/login" replace />; 
    }

//     if (allowedRoles && !allowedRoles.includes(role)) {
//     console.log("Role blocked:", role);
//     return <Navigate to="/login" replace />;
//   }

    //  console.log("Access granted for:", role);
    

    return children;
};

export default ProtectedRoute;



// import React from "react";
// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children, allowedRoles }) => {

//     const storedUser = localStorage.getItem("user");

//     if (!storedUser) {
//         console.log("No user found");
//         return <Navigate to="/login" replace />;
//     }


//     const user = JSON.parse(storedUser);

//     const userRole = user?.role?.toLowerCase()?.trim();


//     const allowed = allowedRoles.map(role =>
//         role.toLowerCase().trim()
//     );


//     console.log("ProtectedRoute Debug:", {
//         userRole,
//         allowedRoles: allowed,
//         matched: allowed.includes(userRole)
//     });


//     if (!allowed.includes(userRole)) {
//         return <Navigate to="/login" replace />;
//     }


//     return children;
// };


// export default ProtectedRoute;