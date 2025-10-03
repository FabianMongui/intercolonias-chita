import React, { useState, useEffect } from "react";

export default function MatchModal({ open, onClose, match, onSave }) {
  const [form, setForm] = useState({
    equipoA: "",
    equipoB: "",
    hora: "",
    estado: "Programado",
    golesA: 0,
    golesB: 0,
    minuto: 0,
  });

  useEffect(() => {
    if (match) {
      setForm({ ...form, ...match });
    } else {
      setForm({
        equipoA: "",
        equipoB: "",
        hora: "",
        estado: "Programado",
        golesA: 0,
        golesB: 0,
        minuto: 0,
      });
    }
    // eslint-disable-next-line
  }, [match, open]);

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
        <h2 className="text-lg font-bold mb-4">{match ? "Editar Partido" : "Agregar Partido"}</h2>
        <div className="mb-2">
          <input name="equipoA" value={form.equipoA} onChange={handleChange} placeholder="Equipo A" className="border p-2 w-full" required />
        </div>
        <div className="mb-2">
          <input name="equipoB" value={form.equipoB} onChange={handleChange} placeholder="Equipo B" className="border p-2 w-full" required />
        </div>
        <div className="mb-2">
          <input name="hora" value={form.hora} onChange={handleChange} placeholder="Hora" className="border p-2 w-full" />
        </div>
        <div className="mb-2">
          <select name="estado" value={form.estado} onChange={handleChange} className="border p-2 w-full">
            <option value="Programado">Programado</option>
            <option value="En Vivo">En Vivo</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>
        <div className="flex gap-2 mb-2">
          <input name="golesA" type="number" value={form.golesA} onChange={handleChange} placeholder="Goles A" className="border p-2 w-1/2" />
          <input name="golesB" type="number" value={form.golesB} onChange={handleChange} placeholder="Goles B" className="border p-2 w-1/2" />
        </div>
        <div className="mb-2">
          <input name="minuto" type="number" value={form.minuto} onChange={handleChange} placeholder="Minuto" className="border p-2 w-full" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{match ? "Guardar" : "Agregar"}</button>
        </div>
      </form>
    </div>
  );
}