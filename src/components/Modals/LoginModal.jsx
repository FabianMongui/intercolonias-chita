import React, { useState } from "react";

export default function LoginModal({ open, onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, pass);
    setEmail("");
    setPass("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative shadow-lg">
        {/* Icono y título */}
        <button
          className="absolute top-4 right-4 text-2xl modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#B8E2A6] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h3 className="text-2xl font-bold text-[#524C4C]">¡Bienvenido!</h3>
          <p className="text-gray-600">Inicia sesión para administrar eventos</p>
        </div>
        {/* Formulario */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B8E2A6] focus:border-transparent"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B8E2A6] focus:border-transparent"
              value={pass}
              onChange={e => setPass(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#F89D58] py-3 rounded-lg font-medium text-white hover:bg-[#B57849] transition-colors"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}