import React from "react";

export default function Header({ onLogin }) {
  return (
    <header className="gradient-bg text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center ml-8 md:ml-0">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <img src={`${process.env.PUBLIC_URL}/assets/logoChita.jpg`} alt="Logo de fútbol" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-[#E2F6F8] font-bold">Intercolonias - Chita</h1>
          </div>
          <button
            className="bg-[#F89D58] text-white-400 text-sm px-2 py-1 rounded-lg font-small hover:bg-[#B57849] transition-colors"
            onClick={onLogin}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </header>
  );
}