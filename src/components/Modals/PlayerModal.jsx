import React, { useState, useEffect } from "react";

export default function PlayerModal({ open, onClose, player, onSave, teams }) {
  const [form, setForm] = useState({
    nombre: "",
    numero: "",
    posicion: "",
    equipo: "",
  });

  useEffect(() => {
    if (player) {
      setForm({ ...form, ...player });
    } else {
      setForm({ nombre: "", numero: "", posicion: "", equipo: "" });
    }
    // eslint-disable-next-line
  }, [player, open]);

  if (!open) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form className="bg-white p-6 rounded shadow w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold mb-4">{player ? "Editar Jugador" : "Agregar Jugador"}</h2>
        <div className="mb-2">
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre del jugador" className="border p-2 w-full" required />
        </div>
        <div className="mb-2">
          <input name="numero" value={form.numero} onChange={handleChange} placeholder="Número" className="border p-2 w-full" />
        </div>
        <div className="mb-2">
          <input name="posicion" value={form.posicion} onChange={handleChange} placeholder="Posición" className="border p-2 w-full" />
        </div>
        <div className="mb-2">
          <select
            name="equipo"
            value={form.equipo}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          >
            <option value="">Selecciona el equipo</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="submit" className="flex-1 bg-[#F89D58] text-white py-2 rounded-lg hover:bg-[#B57849] transition-colors">{player ? "Guardar" : "Guardar"}</button>
          <button type="button" className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}