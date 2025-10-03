import React, { useState, useEffect } from "react";

export default function TeamModal({ open, onClose, team, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    ciudad: "",
    representante: "",
    año: "",
    escudo: "",
  });

  useEffect(() => {
    if (team) {
      setForm({ ...form, ...team });
    } else {
      setForm({ nombre: "", ciudad: "", representante: "", año: "", escudo: "" });
    }
    // eslint-disable-next-line
  }, [team, open]);

  if (!open) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    console.log("Submit del modal", form);
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 relative">
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <h3 className="text-xl font-bold modal-title mb-4">
            {team ? "Editar Equipo" : "Nuevo Equipo"}
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Equipo</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
            <input
              name="ciudad"
              value={form.ciudad}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Representante</label>
            <input
              name="representante"
              value={form.representante}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button type="submit" className="flex-1 modal-btn bg-[#F89D58] text-white py-2 rounded-lg hover:bg-[#B57849] transition-colors">
              Guardar
            </button>
            <button type="button" className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
        <button
          className="absolute top-4 right-4 modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <span className="text-2xl">×</span>
        </button>
      </div>
    </div>
  );
}