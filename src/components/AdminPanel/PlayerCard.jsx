import React from "react";

export default function PlayerCard({ jugador, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded shadow p-4 flex items-center gap-3">
      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
        {jugador.numero}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-800">{jugador.nombre}</h4>
        <div className="text-sm text-gray-600">{jugador.posicion}</div>
        <div className="text-xs text-gray-500 flex items-center">
          <img src={jugador.escudo} alt={jugador.equipo} className="w-5 h-5 mr-1" />
          {jugador.equipo}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <button className="bg-yellow-400 text-white px-2 py-1 rounded text-xs" onClick={onEdit}>Editar1</button>
        <button className="bg-red-500 text-white px-2 py-1 rounded text-xs" onClick={onDelete}>Eliminar</button>
      </div>
    </div>
  );
}