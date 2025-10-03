import React, { useState } from "react";
import Sidebar from "./Sidebar";
import CategoryTabs from "./CategoryTabs";
import MatchesSection from "./MatchesSection";
import TeamsSection from "./TeamsSection";
import PlayersSection from "./PlayersSection";
import MatchModal from "../Modals/MatchModal";
import TeamModal from "../Modals/TeamModal";
import PlayerModal from "../Modals/PlayerModal";
import { dataCategorias as initialCategorias } from "../../data/categorias";
import Swal from 'sweetalert2';

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState("matches");
  const [activeCategory, setActiveCategory] = useState("Única");
  const [categorias, setCategorias] = useState(initialCategorias);

  // Modales y edición
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- CRUD MATCH ---
  const handleEditMatch = (match) => {
    setEditingMatch(match);
    setMatchModalOpen(true);
  };
  const handleDeleteMatch = (match, type) => {
    setCategorias((prev) => {
      const cat = { ...prev[activeCategory] };
      if (type === "live") {
        cat.partidosEnVivo = cat.partidosEnVivo.filter((m) => m !== match);
      } else if (type === "scheduled") {
        cat.proximosPartidos = cat.proximosPartidos.filter((m) => m !== match);
      } else if (type === "finished") {
        cat.resultadosPasados = cat.resultadosPasados.filter((m) => m !== match);
      }
      return { ...prev, [activeCategory]: cat };
    });
  };
  const handleSaveMatch = (data) => {
    setCategorias((prev) => {
      const cat = { ...prev[activeCategory] };
      if (editingMatch) {
        // Editar
        if (data.estado === "En Vivo") {
          cat.partidosEnVivo = cat.partidosEnVivo.map((m) => (m === editingMatch ? data : m));
        } else if (data.estado === "Programado") {
          cat.proximosPartidos = cat.proximosPartidos.map((m) => (m === editingMatch ? data : m));
        } else if (data.estado === "Finalizado") {
          cat.resultadosPasados = cat.resultadosPasados.map((m) => (m === editingMatch ? data : m));
        }
      } else {
        // Agregar
        if (data.estado === "En Vivo") {
          cat.partidosEnVivo.push(data);
        } else if (data.estado === "Programado") {
          cat.proximosPartidos.push(data);
        } else if (data.estado === "Finalizado") {
          cat.resultadosPasados.push(data);
        }
      }
      return { ...prev, [activeCategory]: cat };
    });
    setEditingMatch(null);
  };

  // --- CRUD TEAM ---
  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setTeamModalOpen(true);
  };

  const handleDeleteTeam = (team) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el equipo "${team.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700',
        cancelButton: 'bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setCategorias((prev) => {
          const cat = { ...prev[activeCategory] };
          cat.equipos = cat.equipos.filter((t) => t !== team);
          return { ...prev, [activeCategory]: cat };
        });

        Swal.fire({
          title: 'Eliminado',
          text: 'El equipo ha sido eliminado correctamente.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleSaveTeam = (data) => {
    console.log("handleSaveTeam called with data:", data);
    setCategorias((prev) => {
      const cat = { ...prev[activeCategory] };
      if (editingTeam) {
        cat.equipos = cat.equipos.map((t) => (t === editingTeam ? { ...editingTeam, ...data } : t));
      } else {
        const nextId = cat.equipos.length + 1;
        if (!cat.equipos.some(t => t.nombre === data.nombre)) {
          cat.equipos.push({ ...data, id: nextId, jugadores: [] });
        } else {
          console.warn("⚠️ Equipo duplicado no agregado:", data.nombre);
        }
      }
      console.log("Nuevo estado cat.equipos:", cat.equipos);
      return { ...prev, [activeCategory]: cat };
    });
    setEditingTeam(null);
  };

  // --- CRUD PLAYER ---
  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setPlayerModalOpen(true);
  };
  const handleDeletePlayer = (player) => {
    setCategorias((prev) => {
      const cat = { ...prev[activeCategory] };
      cat.equipos = cat.equipos.map((team) => {
        if (team.nombre === player.equipo) {
          return {
            ...team,
            jugadores: team.jugadores.filter((j) => {
              const partes = j.split(" - ");
              const nombre = partes[1]?.split(" ").slice(0, -1).join(" ");
              return nombre !== player.nombre;
            }),
          };
        }
        return team;
      });
      return { ...prev, [activeCategory]: cat };
    });
  };
  const handleSavePlayer = (data) => {
    setCategorias((prev) => {
      const cat = { ...prev[activeCategory] };
      cat.equipos = cat.equipos.map((team) => {
        if (team.nombre === data.equipo) {
          if (editingPlayer) {
            // Editar jugador
            return {
              ...team,
              jugadores: team.jugadores.map((j) => {
                const partes = j.split(" - ");
                const nombre = partes[1]?.split(" ").slice(0, -1).join(" ");
                return nombre === editingPlayer.nombre
                  ? `#${data.numero} ${data.posicion} - ${data.nombre}`
                  : j;
              }),
            };
          } else {
            // Agregar jugador
            return {
              ...team,
              jugadores: [...team.jugadores, `#${data.numero} ${data.posicion} - ${data.nombre}`],
            };
          }
        }
        return team;
      });
      return { ...prev, [activeCategory]: cat };
    });
    setEditingPlayer(null);
  };

  // --- Goles y estado del partido ---
  const handleGolLocal = (match) => {
    setCategorias((prev) => {
      const cat = { ...prev[activeCategory] };
      cat.partidosEnVivo = cat.partidosEnVivo.map((m) =>
        m === match ? { ...m, golesA: m.golesA + 1, minuto: Math.min(m.minuto + 5, 90) } : m
      );
      return { ...prev, [activeCategory]: cat };
    });
  };
  const handleGolVisitante = (match) => {
    setCategorias((prev) => {
      const cat = { ...prev[activeCategory] };
      cat.partidosEnVivo = cat.partidosEnVivo.map((m) =>
        m === match ? { ...m, golesB: m.golesB + 1, minuto: Math.min(m.minuto + 5, 90) } : m
      );
      return { ...prev, [activeCategory]: cat };
    });
  };
  const handleFinalizar = (match) => {
    setCategorias((prev) => {
      const cat = { ...prev[activeCategory] };
      cat.partidosEnVivo = cat.partidosEnVivo.filter((m) => m !== match);
      cat.resultadosPasados = [
        ...cat.resultadosPasados,
        {
          resultado: `${match.equipoA} ${match.golesA} - ${match.golesB} ${match.equipoB}`,
          fecha: new Date().toLocaleDateString(),
        },
      ];
      return { ...prev, [activeCategory]: cat };
    });
  };
  const handleIniciar = (match) => {
    setCategorias((prev) => {
      const cat = { ...prev[activeCategory] };
      cat.proximosPartidos = cat.proximosPartidos.filter((m) => m !== match);
      cat.partidosEnVivo = [
        ...cat.partidosEnVivo,
        { ...match, golesA: 0, golesB: 0, minuto: 1 },
      ];
      return { ...prev, [activeCategory]: cat };
    });
  };

  // Extrae jugadores de la categoría activa y los transforma en objetos completos
  const equipos = categorias[activeCategory].equipos;

  const jugadores = equipos.flatMap((eq, teamIdx) =>
    eq.jugadores.map((jug, idx) => {
      // Ejemplo: "#1 Portero - Juan"
      const partes = jug.split(" - ");
      const numeroPos = partes[0].split(" ");
      const numero = numeroPos[0].replace("#", "");
      const posicion = numeroPos.slice(1).join(" ");
      const nombre = partes[1] || "";
      // Si tienes edad y nacionalidad, agrégalas aquí (puedes pedirlas en el modal)
      return {
        id: `${eq.id}-${idx}`,
        name: nombre,
        number: numero,
        position: posicion,
        teamId: eq.id,
        age: "", // Completa en el modal
        nationality: "" // Completa en el modal
      };
    })
  );

  // --- Render ---
  return (
    <div className="flex min-h-screen">
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-[#598059] text-white p-2 rounded shadow"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menú"
      >
        ☰
      </button>
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 p-4">
        <CategoryTabs activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        {activeSection === "matches" && (
          <MatchesSection
            category={activeCategory}
            openModal={() => {
              setEditingMatch(null);
              setMatchModalOpen(true);
            }}
            onEdit={handleEditMatch}
            onDelete={handleDeleteMatch}
            onGolLocal={handleGolLocal}
            onGolVisitante={handleGolVisitante}
            onFinalizar={handleFinalizar}
            onIniciar={handleIniciar}
            categorias={categorias}
          />
        )}
        {activeSection === "teams" && (
          <TeamsSection
            category={activeCategory}
            openModal={() => {
              setEditingTeam(null);
              setTeamModalOpen(true);
            }}
            onEdit={handleEditTeam}
            onDelete={handleDeleteTeam}
            categorias={categorias}
          />
        )}
        {activeSection === "players" && (
          <PlayersSection
            category={activeCategory}
            openModal={() => {
              setEditingPlayer(null);
              setPlayerModalOpen(true);
            }}
            onEdit={handleEditPlayer}
            onDelete={handleDeletePlayer}
            categorias={categorias}
            teams={equipos}
            players={jugadores}
          />
        )}
      </main>
      <MatchModal
        open={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        match={editingMatch}
        onSave={handleSaveMatch}
      />
      <TeamModal
        open={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        team={editingTeam}
        onSave={handleSaveTeam}
      />
      <PlayerModal
        open={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
        player={editingPlayer}
        onSave={handleSavePlayer}
        teams={equipos}
      />
    </div>
  );
}