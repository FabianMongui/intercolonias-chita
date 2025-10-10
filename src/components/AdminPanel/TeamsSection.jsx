import React from "react";
import { dataCategorias } from "../../data/categorias";

const sampleTeams = [
  { id: 1, nombre: "Real Madrid", ciudad: "Madrid", entrenador: "Carlo Ancelotti", año: 1902, escudo: "👑", jugadores: ["#9 - Karim Benzema Delantero", "#10 - Luka Modrić Centrocampista"] },
  { id: 2, nombre: "FC Barcelona", ciudad: "Barcelona", entrenador: "Xavi Hernández", año: 1899, escudo: "🔵", jugadores: ["#9 - Robert Lewandowski Delantero", "#8 - Pedri González Centrocampista"] },
  { id: 3, nombre: "Atlético Madrid", ciudad: "Madrid", entrenador: "Diego Simeone", año: 1903, escudo: "🔴", jugadores: ["#7 - Antoine Griezmann Delantero", "#6 - Koke Resurrección Centrocampista"] },
  { id: 4, nombre: "Valencia CF", ciudad: "Valencia", entrenador: "Rubén Baraja", año: 1919, escudo: "🦇", jugadores: [] }
];

export default function TeamsSection({ category, openModal, onEdit, onDelete, categorias }) {
  const categoriaSeleccionada = categorias?.find(c => c.nombre === category);
  const equipos = categoriaSeleccionada?.equipos || [];

  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Equipos</h2>
        <button
          className="bg-[#F89D58] text-white px-4 py-2 rounded-lg hover:bg-[#B57849] transition-colors"
          onClick={openModal}
        >
          + Nuevo Equipo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipos.length === 0 ? (
          <p className="text-gray-500">No hay equipos registrados aún para esta categoría.</p>
        ) : (
          equipos.map((team) => (
            <div key={team.id} className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="flex justify-between items-start mb-4">
                <img src={`${team.escudo}`} alt="Chita" className="w-12 h-auto" />
                <div className="flex space-x-2">
                  <button onClick={() => onEdit(team)} className="text-blue-600 hover:text-blue-800">✏️</button>
                  <button onClick={() => onDelete(team)} className="text-red-600 hover:text-red-800">🗑️</button>
                </div>
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">{team.nombre}</h4>
              <div className="space-y-1 text-m text-gray-600">
                <div>👨‍💼 {team.representante}</div>
                <div>📅 {team.grupo ? "Grupo " + team.grupo : "No tiene grupo"}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}