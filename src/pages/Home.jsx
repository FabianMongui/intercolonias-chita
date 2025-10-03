import React, { useState } from "react";
import Hero from "../components/Hero";
import CategoryTabs from "../components/CategoryTabs";
import LiveMatches from "../components/LiveMatches";
import NextMatches from "../components/NextMatches";
import PastResults from "../components/PastResults";
import Bracket from "../components/Bracket";
import TeamsGrid from "../components/TeamsGrid";
import LoginModal from "../components/LoginModal";
import TeamModal from "../components/TeamModal";
import { dataCategorias } from "../data/categorias";

export default function Home() {
  const [categoria, setCategoria] = useState("Única");
  const [loginOpen, setLoginOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const handleTab = (cat) => setCategoria(cat);
  const handleLogin = () => setLoginOpen(true);
  const handleCloseLogin = () => setLoginOpen(false);

  const handleTeam = (team) => {
    setSelectedTeam(team);
    setTeamOpen(true);
  };
  const handleCloseTeam = () => setTeamOpen(false);

  const categoriaData = dataCategorias[categoria];

  return (
    <main>
      <Hero />
      <CategoryTabs categoria={categoria} onTab={handleTab} />
      <LiveMatches partidos={categoriaData.partidosEnVivo} />
      <NextMatches partidos={categoriaData.proximosPartidos} />
      <PastResults resultados={categoriaData.resultadosPasados} />
      <Bracket bracket={categoriaData.bracket} />
      <TeamsGrid equipos={categoriaData.equipos} onTeam={handleTeam} />
      <LoginModal open={loginOpen} onClose={handleCloseLogin} />
      <TeamModal open={teamOpen} onClose={handleCloseTeam} team={selectedTeam} />
    </main>
  );
}