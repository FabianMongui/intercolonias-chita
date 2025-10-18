import React, { useState } from "react";
import MatchModal from "../Modals/MatchModal";
import { dataCategorias } from "../../data/categorias";

export default function MatchesSection({
  category,
  openModal,
  onEdit,
  onDelete,
  categoriasYEquipos,
  supabase,
  recargarDatos,
}) {
  const datos = dataCategorias[category];
  const categorias = categoriasYEquipos?.find(c => c.nombre === category);
  const equipos = categorias?.equipos || [];
  const partidos = categorias?.partidos || [];
  const partidosEnVivo = partidos.filter(p => p.estado === "Partido en vivo" || p.estado === "En Vivo");
  const partidosProgramados = partidos.filter(p => p.estado === "Programado");
  const partidosFinalizados = partidos.filter(p => p.estado === "Finalizado"); // 🆕 nuevos
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mostrarTodosFinalizados, setMostrarTodosFinalizados] = useState(false);

  if (!categorias) {
    return <p className="text-gray-500">Cargando datos de la categoría...</p>;
  }

  const getNombreEquipo = (id) => {
    const equipo = equipos.find(e => String(e.id) === String(id));
    return equipo ? equipo.nombre : `Equipo (${id})`;
  };

  const savePartido = async (partidoData, editingPartidoId = null) => {
    setLoading(true);
    try {
      if (!supabase) throw new Error("Supabase no definido. Pasa 'supabase' como prop al componente.");

      let formattedHora = partidoData.hora;
      if (formattedHora instanceof Date) {
        formattedHora = formattedHora.toLocaleTimeString('es-CO', { hour12: false });
      } else if (typeof formattedHora === "string") {
        if (formattedHora.includes("T")) {
          formattedHora = new Date(formattedHora).toLocaleTimeString('es-CO', { hour12: false });
        } else {
          const parts = formattedHora.split(":");
          if (parts.length === 2) formattedHora = `${parts[0].padStart(2,"0")}:${parts[1].padStart(2,"0")}:00`;
        }
      }

      const payload = {
        ...partidoData,
        hora: formattedHora,
      };

      if (editingPartidoId) {
        const { error } = await supabase
          .from("partidos")
          .update(payload)
          .eq("id", editingPartidoId);
        if (error) throw error;
        console.log("✅ Partido actualizado");
      } else {
        const { error } = await supabase.from("partidos").insert(payload);
        if (error) throw error;
        console.log("✅ Partido insertado");
      }

      if (typeof recargarDatos === "function") {
        await recargarDatos();
      }
    } catch (err) {
      console.error("Error en savePartido:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGolLocalInternal = async (match) => {
    const payload = {
      golesa: Number(match.golesa || 0) + 1,
      minuto: Math.min(Number(match.minuto || 0) + 5, 90),
    };
    await savePartido(payload, match.id);
  };

  const handleGolVisitanteInternal = async (match) => {
    const payload = {
      golesb: Number(match.golesb || 0) + 1,
      minuto: Math.min(Number(match.minuto || 0) + 5, 90),
    };
    await savePartido(payload, match.id);
  };

  const handleIniciarInternal = async (match) => {
    const horaInicio = new Date().toISOString();
    const payload = {
      estado: "Partido en vivo",
      minuto: 1,
      golesa: Number(match.golesa || 0),
      golesb: Number(match.golesb || 0),
      hora: horaInicio,
    };
    await savePartido(payload, match.id);
  };

  const handleFinalizarInternal = async (match) => {
    const payload = {
      estado: "Finalizado",
      minuto: 90,
    };
    await savePartido(payload, match.id);
  };

  const onGolLocalClick = async (match) => {
    await handleGolLocalInternal(match);
  };

  const onGolVisitanteClick = async (match) => {
    await handleGolVisitanteInternal(match);
  };

  const onIniciarClick = async (match) => {
    await handleIniciarInternal(match);
  };

  const onFinalizarClick = async (match) => {
    await handleFinalizarInternal(match);
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Partidos</h2>
        <button
          className="bg-[#F89D58] text-white px-3 py-1 rounded hover:bg-[#B57849] transition-colors"
          onClick={() => setMatchModalOpen(true)}
        >
          + Nuevo Partido
        </button>
      </div>

      {/* Partidos en Vivo */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-2 flex items-center">
          <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
          Partidos en Vivo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partidosEnVivo.length === 0 ? (
            <p className="text-gray-500">No hay partidos en vivo.</p>
          ) : (
            partidosEnVivo.map((match, idx) => (
              <div key={match.id ?? idx} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">EN VIVO</span>
                  <span className="text-lg font-bold">{match.minuto}'</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="font-medium">{getNombreEquipo(match.equipoa_id)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{match.golesa} - {match.golesb}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{getNombreEquipo(match.equipob_id)}</div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    className="flex-1 bg-green-500 text-white py-2 rounded text-sm hover:bg-green-600"
                    onClick={() => onGolLocalClick(match)}
                    disabled={loading}
                  >
                    Gol Local
                  </button>
                  <button
                    className="flex-1 bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600"
                    onClick={() => onGolVisitanteClick(match)}
                    disabled={loading}
                  >
                    Gol Visitante
                  </button>
                  <button
                    className="flex-1 bg-red-500 text-white py-2 rounded text-sm hover:bg-red-600"
                    onClick={() => onFinalizarClick(match)}
                    disabled={loading}
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Partidos Programados */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Partidos Programados</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partidosProgramados.length === 0 ? (
            <p className="text-gray-500">No hay partidos programados.</p>
          ) : (
            partidosProgramados.map((match, idx) => (
              <div key={match.id ?? idx} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">PROGRAMADO</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{getNombreEquipo(match.equipoa_id)}</div>
                  <div className="text-lg font-medium text-gray-600">VS</div>
                  <div className="font-medium">{getNombreEquipo(match.equipob_id)}</div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {(match.hora || "").slice(0, 5)} | {match.estado}
                </div>
                <div className="mt-4 text-center">
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    onClick={() => onIniciarClick(match)}
                    disabled={loading}
                  >
                    Iniciar Partido
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Partidos Finalizados */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Partidos Finalizados</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partidosFinalizados.length === 0 ? (
            <p className="text-gray-500">No hay partidos finalizados.</p>
          ) : (
            (mostrarTodosFinalizados
              ? partidosFinalizados
              : partidosFinalizados.slice(0, 3)
            ).map((match, idx) => (
              <div key={match.id ?? idx} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    FINALIZADO
                  </span>
                  <span className="text-sm text-gray-500">{(match.hora || "").slice(0, 5)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{getNombreEquipo(match.equipoa_id)}</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {match.golesa} - {match.golesb}
                  </div>
                  <div className="font-medium">{getNombreEquipo(match.equipob_id)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {partidosFinalizados.length > 3 && (
          <div className="text-center mt-4">
            <button
              className="text-[#F89D58] font-medium hover:underline"
              onClick={() => setMostrarTodosFinalizados(!mostrarTodosFinalizados)}
            >
              {mostrarTodosFinalizados ? "Ver menos" : "Ver más"}
            </button>
          </div>
        )}
      </div>
      <MatchModal
        category={category}
        open={matchModalOpen}
        onClose={() => {
          setEditingMatch(null);
          setMatchModalOpen(false);
        }}
        match={editingMatch}
        onSave={(data) => savePartido(data, editingMatch?.id)}
        categoriasYEquipos={categoriasYEquipos}
      />
    </section>
  );
}
