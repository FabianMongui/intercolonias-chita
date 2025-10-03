import React from "react";

const categorias = ["Única", "Veteranos", "Mujeres"];

export default function CategoryTabs({ activeCategory, setActiveCategory }) {
  return (
    <div className="flex flex-col items-center bg-white py-4 shadow mb-4">
      <span className="text-lg font-semibold text-[#524C4C] mb-2">Categorías</span>
      <div className="flex">
        {categorias.map((cat, idx) => (
          <button
            key={cat}
            className={`px-6 py-2 rounded-t-lg font-semibold text-gray-700 shadow transition-colors border-b-2 ${
              activeCategory === cat
                ? "border-[#F89D58] bg-white"
                : "bg-gray-100"
            } ${idx > 0 ? "ml-2" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}