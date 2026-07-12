import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import MainLayout from "./MainLayout.jsx";
import Register from "./Components/Register.jsx";
import AddRecipe from "./Components/AddRecipe.jsx";
import EditRecipe from "./Components/EditRecipe.jsx";
import Home from "./Components/Home.jsx";
import Login from "./Components/Login.jsx";
import VerifyOtp from "./Components/VerifyOtp.jsx";
import ForgotPassword from "./Components/ForgotPassword.jsx";
import ResetPassword from "./Components/ResetPassword.jsx";
import Favorites from "./Components/Favorites.jsx";
import Profile from "./Components/Profile.jsx";
import RecipeDetailsPage from "./Components/RecipeDetailsPage.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/addrecipe" element={<AddRecipe />} />
            <Route path="/edit-recipe/:id" element={<EditRecipe />} />
            <Route path="/recipe/:id" element={<RecipeDetailsPage />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);
