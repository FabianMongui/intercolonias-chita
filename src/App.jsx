import React, { useState } from "react";
import './App.css';
import Header from "./components/Header";
import LoginModal from "./components/Modals/LoginModal";
import AppRoutes from "./routes";

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false);

  const handleLogin = () => setLoginOpen(true);
  const handleCloseLogin = () => setLoginOpen(false);

  // Cuando el login es exitoso, redirige a /admin
  const handleLoginSuccess = (user, pass) => {
    // Aquí puedes validar credenciales si quieres
    window.location.href = "/admin";
  };

  return (
    <div className="bg-gray-50 font-inter">
      <Header onLogin={handleLogin} />
      <AppRoutes />
      <LoginModal open={loginOpen} onClose={handleCloseLogin} onLogin={handleLoginSuccess} />
    </div>
  );
}
