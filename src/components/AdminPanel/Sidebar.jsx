import React from "react";

export default function Sidebar({ activeSection, setActiveSection, isOpen, onClose }) {
  return (
    <aside
      className={`w-64 bg-white shadow-lg admin-sidebar fixed top-16 md:static inset-y-0 left-0 z-50 transition-transform transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:block`}
    >
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Panel Administrador</h2>
        {/* Botón cerrar sidebar en mobile */}
        <button
          className="md:hidden text-2xl text-gray-600"
          aria-label="Cerrar"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
      <nav className="mt-6">
        <button
          className={`admin-nav-btn w-full text-left px-6 py-3 text-gray-700 transition-colors ${
            activeSection === "matches"
              ? "bg-[#F89D58] text-white border-r-2 border-[#F89D58]"
              : ""
          }`}
          onClick={() => setActiveSection("matches")}
          data-section="matches"
        >
          ⚽ Gestión de Partidos
        </button>
        <button
          className={`admin-nav-btn w-full text-left px-6 py-3 text-gray-700 transition-colors ${
            activeSection === "teams"
              ? "bg-[#F89D58] text-white border-r-2 border-[#F89D58]"
              : ""
          }`}
          onClick={() => setActiveSection("teams")}
          data-section="teams"
        >
          🏆 Gestión de Equipos
        </button>
        <button
          className={`admin-nav-btn w-full text-left px-6 py-3 text-gray-700 transition-colors ${
            activeSection === "players"
              ? "bg-[#F89D58] text-white border-r-2 border-[#F89D58]"
              : ""
          }`}
          onClick={() => setActiveSection("players")}
          data-section="players"
        >
          👤 Gestión de Jugadores
        </button>
      </nav>
    </aside>
  );
}