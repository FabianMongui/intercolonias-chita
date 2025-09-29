import React from "react";

export default function TeamModal({ open, onClose, team }) {
  if (!open || !team) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
        <div>
          <div className="h-48 gradient-bg flex items-center justify-center">
            <img src={team.escudo} alt={`Escudo de ${team.nombre}`} className="w-24 h-24 object-contain" />
          </div>
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{team.nombre}</h2>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Plantilla</h3>
            <ul className="space-y-2">
              {team.jugadores.map((j, i) => (
                <li key={i} className="bg-gray-50 px-4 py-2 rounded-lg">{j}</li>
              ))}
            </ul>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center">
          <span className="text-xl">×</span>
        </button>
      </div>
    </div>
  );
}