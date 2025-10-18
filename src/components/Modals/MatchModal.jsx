import React, { useState, useEffect } from "react";

export default function MatchModal({ category, open, onClose, match, onSave, categoriasYEquipos }) {
  const categoriaObj = categoriasYEquipos?.find(c => c.nombre === category);
  const equipos = categoriaObj?.equipos || [];

  const [form, setForm] = useState({
    equipoa_id: "",
    equipob_id: "",
    hora: "",
    estado: "Programado",
    golesa: 0,
    golesb: 0,
    minuto: 0,
  });

  useEffect(() => {
    if (match) {
      setForm({
        equipoa_id: match.equipoa_id || "",
        equipob_id: match.equipob_id || "",
        hora: match.hora || "",
        estado: match.estado || "Programado",
        golesa: match.golesa || 0,
        golesb: match.golesb || 0,
        minuto: match.minuto || 0,
      });
    } else {
      setForm({
        equipoa_id: "",
        equipob_id: "",
        hora: "",
        estado: "Programado",
        golesa: 0,
        golesb: 0,
        minuto: 0,
      });
    }
  }, [match, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // ✅ Convierte la hora en formato válido para columna `time`
  const formatHoraForDB = (hora) => {
    if (!hora) return null;
    if (hora.includes("T")) {
      const date = new Date(hora);
      return date.toTimeString().split(" ")[0];
    }
    if (/^\d{1,2}:\d{2}$/.test(hora)) {
      return `${hora}:00`;
    }
    return hora;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const horaNormalizada = formatHoraForDB(form.hora);

    const partidoData = {
      categoria_id: categoriaObj?.id,
      equipoa_id: Number(form.equipoa_id),
      equipob_id: Number(form.equipob_id),
      golesa: Number(form.golesa),
      golesb: Number(form.golesb),
      minuto: Number(form.minuto),
      estado: form.estado,
      fecha: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      hora: horaNormalizada,
    };

    onSave(partidoData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form className="bg-white p-6 rounded shadow w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold mb-4">{match ? "Editar Partido" : "Agregar Partido"}</h2>

        {/* Equipo A */}
        <div className="mb-2">
          <label className="block mb-1 font-medium">Equipo A</label>
          <select
            name="equipoa_id"
            value={form.equipoa_id}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          >
            <option value="">Seleccionar equipo</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Equipo B */}
        <div className="mb-2">
          <label className="block mb-1 font-medium">Equipo B</label>
          <select
            name="equipob_id"
            value={form.equipob_id}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          >
            <option value="">Seleccionar equipo</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Hora */}
        <div className="mb-2">
          <label className="block mb-1 font-medium">Hora</label>
          <input
            type="time"
            name="hora"
            value={form.hora}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        {/* Estado */}
        <div className="mb-2">
          <label className="block mb-1 font-medium">Estado</label>
          <select
            name="estado"
            value={form.estado}
            onChange={handleChange}
            className="border p-2 w-full"
          >
            <option value="Programado">Programado</option>
            <option value="En Vivo">En Vivo</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>

        {/* Goles */}
        <div className="flex gap-2 mb-2">
          <input
            name="golesa"
            type="number"
            value={form.golesa}
            onChange={handleChange}
            placeholder="Goles A"
            className="border p-2 w-1/2"
          />
          <input
            name="golesb"
            type="number"
            value={form.golesb}
            onChange={handleChange}
            placeholder="Goles B"
            className="border p-2 w-1/2"
          />
        </div>

        {/* Minuto */}
        <div className="mb-2">
          <label className="block mb-1 font-medium">Minuto</label>
          <input
            name="minuto"
            type="number"
            value={form.minuto}
            onChange={handleChange}
            placeholder="Minuto"
            className="border p-2 w-full"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            {match ? "Guardar" : "Agregar"}
          </button>
        </div>
      </form>
    </div>
  );
}
