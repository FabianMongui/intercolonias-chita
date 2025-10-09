import React from "react";
import { dataCategorias } from "../../data/categorias";

export default function MatchesSection({
  category,
  openModal,
  onGolLocal,
  onGolVisitante,
  onFinalizar,
  onIniciar,
  categoriasYEquipos
}) {
  const datos = dataCategorias[category];

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Partidos ({category})</h2>
        <button
          className="bg-[#F89D58] text-white px-3 py-1 rounded hover:bg-[#B57849] transition-colors"
          onClick={openModal}
        >
          + Nuevo Partido
        </button>
      </div>

      {/* Partidos en Vivo */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-2 flex items-center">
          <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
          Partidos en Vivo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datos.partidosEnVivo.length === 0 ? (
            <p className="text-gray-500">No hay partidos en vivo.</p>
          ) : (
            datos.partidosEnVivo.map((match, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">EN VIVO</span>
                  <span className="text-lg font-bold">{match.minuto}'</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="font-medium">{match.equipoA}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{match.golesA} - {match.golesB}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{match.equipoB}</div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    className="flex-1 bg-green-500 text-white py-2 rounded text-sm hover:bg-green-600"
                    onClick={() => onGolLocal(match)}
                  >
                    Gol Local
                  </button>
                  <button
                    className="flex-1 bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600"
                    onClick={() => onGolVisitante(match)}
                  >
                    Gol Visitante
                  </button>
                  <button
                    className="flex-1 bg-red-500 text-white py-2 rounded text-sm hover:bg-red-600"
                    onClick={() => onFinalizar(match)}
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Partidos Programados */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Partidos Programados</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datos.proximosPartidos.length === 0 ? (
            <p className="text-gray-500">No hay partidos programados.</p>
          ) : (
            datos.proximosPartidos.map((match, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">PROGRAMADO</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{match.equipoA}</div>
                  <div className="text-lg font-medium text-gray-600">VS</div>
                  <div className="font-medium">{match.equipoB}</div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {match.hora} | {match.estado}
                </div>
                <div className="mt-4 text-center">
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    onClick={() => onIniciar(match)}
                  >
                    Iniciar Partido
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}