import React, { useState } from "react";

export default function PlayersSection({ teams = [], players = [], openModal, onEdit, onDelete }) {
  const [teamFilter, setTeamFilter] = useState("");

  // Filtra jugadores por equipo si hay filtro
  const filteredPlayers = teamFilter
    ? players.filter(p => String(p.teamId) === String(teamFilter))
    : players;
    console.log("🚀 ~ PlayersSection ~ teams:", teams)


  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Gestión de Jugadores</h2>
        <button
          className="bg-[#F89D58] text-white px-4 py-2 rounded hover:bg-[#B57849] transition-colors"
          onClick={openModal}
        >
          + Nuevo Jugador
        </button>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <select
          id="teamFilter"
          className="border rounded px-3 py-2"
          value={teamFilter}
          onChange={e => setTeamFilter(e.target.value)}
        >
          <option value="">Todos los equipos</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>{team.name || team.nombre}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlayers.length === 0 ? (
          <p className="text-gray-500">No hay jugadores registrados aún.</p>
        ) : (
          filteredPlayers.map(player => {
            const team = teams.find(t => t.id === player.teamId);
            return (
              <div key={player.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600 text-xl">
                      {player.number}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{player.name}</h4>
                      <div className="text-sm font-bold text-purple-600">{player.position}</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => onEdit(player)} className="text-[#B57849] hover:text-[#F89D58] text-xl" title="Editar">
                      <span role="img" aria-label="edit">✏️</span>
                    </button>
                    <button onClick={() => onDelete(player)} className="text-gray-400 hover:text-red-500 text-xl" title="Eliminar">
                      <span role="img" aria-label="delete">🗑️</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600 pl-2">
                  <div>🏆 {team ? (team.name || team.nombre) : 'Sin equipo'}</div>
                  {player.age && <div>📅 {player.age} años</div>}
                  {player.nationality && <div>🌍 {player.nationality}</div>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}