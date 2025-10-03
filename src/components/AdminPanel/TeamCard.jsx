import React from "react";

export default function TeamCard({ team, players, onEdit, onDelete }) {
  // Calcula el número de jugadores del equipo
  const numJugadores = players ? players.filter(p => p.teamId === team.id).length : (team.jugadores ? team.jugadores.length : 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="text-4xl">
          {/* Si es emoji, muestra directo; si es imagen, usa <img> */}
          {team.logo
            ? team.logo
            : team.escudo
            ? <img src={team.escudo} alt={team.nombre || team.name} className="w-12 h-12" />
            : null}
        </div>
        <div className="flex space-x-2">
          <button onClick={() => onEdit(team)} className="text-blue-600 hover:text-blue-800">✏️</button>
          <button onClick={() => onDelete(team)} className="text-red-600 hover:text-red-800">🗑️</button>
        </div>
      </div>
      <h4 className="text-lg font-bold text-gray-800 mb-2">{team.name || team.nombre}</h4>
      <div className="space-y-1 text-sm text-gray-600">
        <div>📍 {team.city || team.ciudad}</div>
        <div>👨‍💼 {team.coach || team.entrenador}</div>
        <div>📅 Fundado en {team.year || team.año}</div>
        <div>👥 {numJugadores} jugadores</div>
      </div>
    </div>
  );
}