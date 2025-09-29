import React from "react";

const tabs = ["Única", "Veteranos", "Mujeres"];

export default function CategoryTabs({ categoria, onTab }) {
  return (
    <section>
      <div className="flex flex-col items-center my-4">
        <span className="text-lg font-semibold text-[#524C4C] mb-2">Categorías</span>
        <div className="flex">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              className={`tab-btn px-6 py-2 rounded-t-lg font-semibold text-gray-700 shadow transition-colors ${
                categoria === tab
                  ? "bg-white border-b-2 border-[#F89D58]"
                  : "bg-gray-100"
              } ${idx > 0 ? "ml-2" : ""}`}
              onClick={() => onTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}