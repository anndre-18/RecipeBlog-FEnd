import React from "react";
import { Navigate, Outlet } from "react-router";
import Header from "./Components/Header";
import { useAuth } from "./context/AuthContext";

const MainLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <span className="spinner" aria-hidden="true" />
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

export default MainLayout;
