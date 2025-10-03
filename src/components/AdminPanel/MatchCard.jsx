import React from "react";

export default function MatchCard({ match, type, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded shadow p-4 flex flex-col gap-2">
      {type === "live" && (
        <div className="flex justify-between items-center mb-2">
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">EN VIVO</span>
          <span className="text-lg font-bold">{match.minuto}'</span>
        </div>
      )}
      {type === "scheduled" && (
        <div className="flex items-center justify-between mb-2">
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">PROGRAMADO</span>
        </div>
      )}
      {type === "finished" && (
        <div className="flex justify-between items-center mb-2">
          <span className="bg-gray-300 text-gray-800 px-2 py-1 rounded text-xs font-medium">FINALIZADO</span>
          <span className="text-xs">{match.fecha}</span>
        </div>
      )}

      {/* Info principal */}
      {type === "finished" ? (
        <div className="text-center font-bold">{match.resultado}</div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="font-bold">{match.equipoA}</div>
          <span className="text-2xl font-bold text-purple-600">
            {type === "live" ? `${match.golesA} - ${match.golesB}` : "VS"}
          </span>
          <div className="font-bold">{match.equipoB}</div>
        </div>
      )}

      {/* Hora para programados */}
      {type === "scheduled" && (
        <div className="mt-2 text-sm text-gray-600">
          {match.hora} | {match.estado}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 mt-2">
        <button className="bg-yellow-400 text-white px-2 py-1 rounded text-xs" onClick={onEdit}>Editar</button>
        <button className="bg-red-500 text-white px-2 py-1 rounded text-xs" onClick={onDelete}>Eliminar</button>
      </div>
    </div>
  );
}