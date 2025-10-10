import React, { useState, useEffect } from "react";
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
import { createClient } from "@supabase/supabase-js";

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState("matches");
  const [activeCategory, setActiveCategory] = useState("Única");
  const [categorias, setCategorias] = useState(initialCategorias);
  const SUPABASE_URL = "https://kewjmzqiuggpdodnzbvp.supabase.co";
  const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtld2ptenFpdWdncGRvZG56YnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTE0NTgsImV4cCI6MjA3NTM2NzQ1OH0.UYU0XM64ciJD8NM4lggSYaQ7zP1tJwgnR7ZyeCIg-XQ"; // reemplaza por tu valor real
  const AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtld2ptenFpdWdncGRvZG56YnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTE0NTgsImV4cCI6MjA3NTM2NzQ1OH0.UYU0XM64ciJD8NM4lggSYaQ7zP1tJwgnR7ZyeCIg-XQ";
  const supabase = createClient(SUPABASE_URL, API_KEY);
  const [categoriasYEquipos, setCategoriasYEquipos] = useState([]);

  // Modales y edición
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getEquipos();
      const dataCategoriasYEquipos = await fetchCategoriasConRelaciones();
      setCategoriasYEquipos(dataCategoriasYEquipos);
      const existeCategoria = dataCategoriasYEquipos.some(c => c.nombre === dataCategoriasYEquipos.nombre);
    if (existeCategoria) {
      setActiveCategory(dataCategoriasYEquipos.nombre);
    } else if (dataCategoriasYEquipos.length > 0) {
      setActiveCategory(dataCategoriasYEquipos[0].nombre);
    }
    })();
  }, []);

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

  const recargarDatos = async () => {
    const categoriaActual = activeCategory;
    const dataActualizada = await fetchCategoriasConRelaciones();
    setCategoriasYEquipos(dataActualizada);
    setCategorias(dataActualizada);
    const existeCategoria = dataActualizada.some(c => c.nombre === categoriaActual);
    if (existeCategoria) {
      setActiveCategory(categoriaActual);
    } else if (dataActualizada.length > 0) {
      setActiveCategory(dataActualizada[0].nombre);
    }
  };

  const deleteEquipo = async (equipo) => {
    Swal.fire({
      title: `¿Quieres eliminar el equipo "${equipo.nombre}"?`,
      text: '',
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await supabase.from("equipos").delete().eq("id", equipo.id);
        if (error) console.error("Error eliminando equipo:", error);
        recargarDatos();
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

  const saveEquipo = async (equipoData, editingEquipoId = null) => {
    if (editingEquipoId) {
      // actualizar
      const { error } = await supabase
        .from("equipos")
        .update(equipoData)
        .eq("id", editingEquipoId);
      if (error) console.error("Error actualizando equipo:", error);
    } else {
      // insertar nuevo
      const payload = { ...equipoData};
      const { error } = await supabase.from("equipos").insert(payload);
      if (error) console.error("Error insertando equipo:", error);
    }
    recargarDatos();
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
  //const equipos = categorias[activeCategory].equipos;
  const equipos = [
      {
        id: 1,
        nombre: "Chita FC",
        escudo: `/assets/Chita.png`,
        jugadores: [
          "#1 Portero - Juan",
          "#5 Defensa - Carlos",
          "#8 Mediocampo - Luis",
          "#10 Delantero - Pedro",
          "#2 Defensa - Diego",
          "#6 Mediocampo - Andrés",
          "#11 Delantero - Manuel"
        ]
      }
    ];

  const getEquipos = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/equipos?select=*`, {
        method: "GET",
        headers: {
          apikey: API_KEY,
          Authorization: `${AUTH_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("🚀 ~ getEquipos ~ data:", data)
      return data;
    } catch (error) {
      console.error("Error obteniendo los equipos:", error);
      return null;
    }
  };

  const fetchCategoriasConRelaciones = async () => {
    const { data, error } = await supabase
      .from("categorias")
      .select(`
        id,
        nombre,
        equipos (
          id,
          nombre,
          representante,
          escudo,
          grupo
        ),
        partidos (
          id,
          equipoa_id,
          equipob_id,
          golesa,
          golesb,
          minuto,
          estado,
          fecha,
          hora
        )
      `)
      .order("id", { ascending: true, foreignTable: "equipos" });

    if (error) {
      console.error("Error cargando categorías:", error);
      return [];
    }

    // ✅ Ya no hacemos ningún setState aquí
    console.log("🚀 ~ fetchCategoriasConRelaciones ~ data:", data);
    return data || [];
  };

  //getEquipos();

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
            categoriasYEquipos={categoriasYEquipos} 
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
            /* onDelete={handleDeleteTeam} */
            onDelete={(team) => deleteEquipo(team)}
            categorias={categoriasYEquipos}
            /* equiposSupa={equiposSupa} */
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
        category={activeCategory}
        open={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        team={editingTeam}
        onSave={(data) => {
          saveEquipo(data, editingTeam?.id);
        }}        
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