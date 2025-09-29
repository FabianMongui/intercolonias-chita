import React from "react";

export default function LiveMatches({ partidos }) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-6">
        <h3 className="text-3xl font-bold text-[#524C4C] mb-6 text-center">⚽ Partidos en Vivo</h3>
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
                  {p.minuto ? (
                    <>
                      <span className="text-2xl font-bold">{p.golesA} - {p.golesB}</span>
                      <p className="text-sm text-red-600 mt-1">🔴 Min {p.minuto}</p>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-500">{p.hora}</span>
                      <p className="text-sm text-gray-400 mt-1">{p.estado}</p>
                    </>
                  )}
                </div>
                <div className="flex-1 text-center font-bold">{p.equipoB}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400">No hay partidos en vivo.</div>
          )}
        </div>
      </div>
    </section>
  );
}