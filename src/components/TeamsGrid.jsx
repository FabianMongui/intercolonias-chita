import React from "react";

export default function TeamsGrid({ equipos, onTeam }) {
  return (
    <section className="py-16">
      <div className="container mx-auto px-6">
        <h3 className="text-3xl font-bold text-gray-800 mb-12 text-center">Equipos Participantes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {equipos.map((eq) => (
            <div
              key={eq.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover cursor-pointer"
              onClick={() => onTeam(eq)}
            >
              <div className="h-40 gradient-bg flex items-center justify-center">
                <img src={eq.escudo} alt={`Escudo de ${eq.nombre}`} className="w-20 h-20 object-contain" />
              </div>
              <div className="p-6 text-center">
                <h4 className="text-xl font-bold text-gray-800">{eq.nombre}</h4>
                <button className="w-full mt-4 bg-[#F89D58] text-white py-2 rounded-lg font-medium hover:bg-[#B57849] transition-colors">
                  Ver Jugadores
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}