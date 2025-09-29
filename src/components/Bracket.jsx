import React from "react";

export default function Bracket({ bracket }) {
  if (!bracket) return null;
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-6">
        <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">Fase Final</h3>
        <div className="flex flex-col items-center">
          {/* Final */}
          <div className="flex flex-col items-center mb-12">
            <div className="flex items-center justify-center space-x-12">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center shadow-lg border-4 border-[#B8E2A6]">
                  <img src={bracket.final.equipoA.escudo} alt={bracket.final.equipoA.nombre} className="w-14 h-14 object-contain" />
                </div>
                <span className="mt-2 text-sm text-gray-700 font-semibold">{bracket.final.equipoA.nombre}</span>
              </div>
              <span className="text-gray-600 font-semibold text-center">
                Final<br />
                <span className="text-lg font-bold text-[#F89D58]">{bracket.final.fecha}</span>
              </span>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center shadow-lg border-4 border-[#B8E2A6]">
                  <img src={bracket.final.equipoB.escudo} alt={bracket.final.equipoB.nombre} className="w-14 h-14 object-contain" />
                </div>
                <span className="mt-2 text-sm text-gray-700 font-semibold">{bracket.final.equipoB.nombre}</span>
              </div>
            </div>
            <div className="w-40 h-40 mt-8 bg-gradient-to-tr from-[#B8E2A6] to-[#918a59] rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-[#F89D58]">
              <img src={bracket.campeon.escudo} alt="Campeón" className="w-16 h-16 object-contain mb-2" />
              <span className="text-sm font-bold text-[#524C4C]">Campeón</span>
              <span className="text-sm text-[#524C4C] font-semibold">{bracket.campeon.nombre}</span>
            </div>
          </div>
          {/* 3er y 4to puesto */}
          <div className="flex flex-col items-center">
            <span className="text-gray-600 font-semibold mb-4">3° y 4° puesto</span>
            <div className="flex space-x-12">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center shadow border-2 border-[#B8E2A6]">
                  <img src={bracket.tercerPuesto[0].escudo} alt={bracket.tercerPuesto[0].nombre} className="w-10 h-10 object-contain" />
                </div>
                <span className="mt-1 text-xs text-gray-700 font-semibold">{bracket.tercerPuesto[0].nombre}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center shadow border-2 border-[#B8E2A6]">
                  <img src={bracket.tercerPuesto[1].escudo} alt={bracket.tercerPuesto[1].nombre} className="w-10 h-10 object-contain" />
                </div>
                <span className="mt-1 text-xs text-gray-700 font-semibold">{bracket.tercerPuesto[1].nombre}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}