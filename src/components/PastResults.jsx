import React from "react";

export default function PastResults({ resultados }) {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-6">
        <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">Resultados Recientes</h3>
        <div className="space-y-3 max-w-2xl mx-auto">
          {resultados.length ? (
            resultados.map((r, i) => (
              <div key={i} className="flex justify-between bg-white rounded-lg shadow p-4">
                <span>{r.resultado}</span>
                <span className="text-gray-500 text-sm">{r.fecha}</span>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400">No hay resultados recientes.</div>
          )}
        </div>
      </div>
    </section>
  );
}