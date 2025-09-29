import React from "react";

export default function NextMatches({ partidos }) {
  return (
    <section className="py-1">
      <div className="container mx-auto px-6">
        <h5 className="text-2xl font-bold text-[#524C4C] mb-4 text-center">Próximos Partidos</h5>
        <div className="space-y-4">
          {partidos.length ? (
            partidos.map((p, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl shadow-md p-6 flex justify-between items-center ${
                  p.minuto ? "border-l-8 border-red-500" : ""
                }`}
              >
                <div className="flex-1 text-center font-bold">{p.equipoA}</div>
                <div className="flex-1 text-center">
                  <span className="text-gray-500">{p.hora}</span>
                  <p className="text-sm text-gray-400 mt-1">{p.estado}</p>
                </div>
                <div className="flex-1 text-center font-bold">{p.equipoB}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400">No hay próximos partidos.</div>
          )}
        </div>
      </div>
    </section>
  );
}