import React, { useState, useEffect } from "react";
import Header from "./Components/Header";
import { Outlet, useLocation } from 'react-router';
import Login from "./Components/Login";

const MainLayout = () => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const location = useLocation();

    // Check for token on route change
    useEffect(() => {
        setToken(localStorage.getItem("token"));
    }, [location]);

    // If no token exists, force render ONLY the Login module
    if (!token) {
        return (
            <div style={{minHeight: '100vh', display: 'flex', background: 'var(--bg-color)'}}>
                {/* Passing empty onClose to prevent closing the modal manually */}
                <Login onClose={() => {}} />
            </div>
        );
    }

    // Authenticated state
    return (
        <>
            <Header/>
            <Outlet/>
        </>
    );
}

export default MainLayout;