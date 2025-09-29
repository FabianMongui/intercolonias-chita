export const dataCategorias = {
  "Única": {
    equipos: [
      {
        id: 1,
        nombre: "Chita FC",
        escudo: "assets/Chita.png",
        jugadores: [
          "#1 Portero - Juan",
          "#5 Defensa - Carlos",
          "#8 Mediocampo - Luis",
          "#10 Delantero - Pedro",
          "#2 Defensa - Diego",
          "#6 Mediocampo - Andrés",
          "#11 Delantero - Manuel"
        ]
      },
      {
        id: 2,
        nombre: "Tunja FC",
        escudo: "assets/Tunja.png",
        jugadores: [
          "#1 Portero - Miguel",
          "#3 Defensa - Andrés",
          "#7 Mediocampo - Felipe",
          "#9 Delantero - Mateo",
          "#4 Defensa - Jorge",
          "#6 Mediocampo - Kevin",
          "#10 Delantero - Samuel"
        ]
      },
      {
        id: 3,
        nombre: "Bogotá FC",
        escudo: "assets/Bogota.png",
        jugadores: [
          "#1 Portero - Jorge",
          "#4 Defensa - Camilo",
          "#6 Mediocampo - Julián",
          "#11 Delantero - Esteban",
          "#2 Defensa - Iván",
          "#7 Mediocampo - Nicolás",
          "#9 Delantero - Santiago"
        ]
      },
      {
        id: 4,
        nombre: "Llanera FC",
        escudo: "assets/Llanera.png",
        jugadores: [
          "#1 Portero - David",
          "#2 Defensa - Sebastián",
          "#8 Mediocampo - Óscar",
          "#10 Delantero - Martín",
          "#3 Defensa - Fernando",
          "#5 Mediocampo - Pablo",
          "#9 Delantero - Ricardo"
        ]
      }
    ],
    partidosEnVivo: [
      { equipoA: "Chita FC", golesA: 2, equipoB: "Tunja FC", golesB: 1, minuto: 75 }
    ],
    proximosPartidos: [
      { equipoA: "Bogotá FC", equipoB: "Llanera FC", hora: "11:00", estado: "Programado" },
      { equipoA: "Tunja FC", equipoB: "Bogotá FC", hora: "2:00", estado: "Programado" },
      { equipoA: "Llanera FC", equipoB: "Chita FC", hora: "4:00", estado: "Programado" }
    ],
    resultadosPasados: [
      { resultado: "Chita FC 1 - 2 Bogotá FC", fecha: "1 Nov 2025" },
      { resultado: "Tunja FC 2 - 2 Llanera FC", fecha: "2 Nov 2025" }
    ],
    bracket: {
      final: {
        equipoA: { nombre: "Chita FC", escudo: "assets/Chita.png" },
        equipoB: { nombre: "Tunja FC", escudo: "assets/Tunja.png" },
        fecha: "2/11 - 3 pm"
      },
      campeon: { nombre: "Chita FC", escudo: "assets/Chita.png" },
      tercerPuesto: [
        { nombre: "Bogotá FC", escudo: "assets/Bogota.png" },
        { nombre: "Llanera FC", escudo: "assets/Llanera.png" }
      ]
    }
  },
  "Veteranos": {
    equipos: [
      {
        id: 1,
        nombre: "Chita FC",
        escudo: "assets/Chita.png",
        jugadores: [
          "#1 Portero - Juan",
          "#5 Defensa - Carlos",
          "#8 Mediocampo - Luis",
          "#10 Delantero - Pedro",
          "#2 Defensa - Diego",
          "#6 Mediocampo - Andrés",
          "#11 Delantero - Manuel"
        ]
      },
      {
        id: 2,
        nombre: "Tunja FC",
        escudo: "assets/Tunja.png",
        jugadores: [
          "#1 Portero - Miguel",
          "#3 Defensa - Andrés",
          "#7 Mediocampo - Felipe",
          "#9 Delantero - Mateo",
          "#4 Defensa - Jorge",
          "#6 Mediocampo - Kevin",
          "#10 Delantero - Samuel"
        ]
      },
      {
        id: 3,
        nombre: "Bogotá FC",
        escudo: "assets/Bogota.png",
        jugadores: [
          "#1 Portero - Jorge",
          "#4 Defensa - Camilo",
          "#6 Mediocampo - Julián",
          "#11 Delantero - Esteban",
          "#2 Defensa - Iván",
          "#7 Mediocampo - Nicolás",
          "#9 Delantero - Santiago"
        ]
      },
      {
        id: 4,
        nombre: "Llanera FC",
        escudo: "assets/Llanera.png",
        jugadores: [
          "#1 Portero - David",
          "#2 Defensa - Sebastián",
          "#8 Mediocampo - Óscar",
          "#10 Delantero - Martín",
          "#3 Defensa - Fernando",
          "#5 Mediocampo - Pablo",
          "#9 Delantero - Ricardo"
        ]
      }
    ],
    partidosEnVivo: [
      { equipoA: "Tunja FC", golesA: 0, equipoB: "Bogotá FC", golesB: 0, minuto: 60 }
    ],
    proximosPartidos: [
      { equipoA: "Chita FC", equipoB: "Llanera FC", hora: "12:00", estado: "Programado" }
    ],
    resultadosPasados: [
      { resultado: "Llanera FC 0 - 1 Tunja FC", fecha: "3 Nov 2025" }
    ],
    bracket: {
      final: {
        equipoA: { nombre: "Tunja FC", escudo: "assets/Tunja.png" },
        equipoB: { nombre: "Llanera FC", escudo: "assets/Llanera.png" },
        fecha: "2/11 - 5 pm"
      },
      campeon: { nombre: "Tunja FC", escudo: "assets/Tunja.png" },
      tercerPuesto: [
        { nombre: "Chita FC", escudo: "assets/Chita.png" },
        { nombre: "Bogotá FC", escudo: "assets/Bogota.png" }
      ]
    }
  },
  "Mujeres": {
    equipos: [
      {
        id: 1,
        nombre: "Chita FC",
        escudo: "assets/Chita.png",
        jugadores: [
          "#1 Portera - Ana",
          "#5 Defensa - Laura",
          "#8 Mediocampo - Paula",
          "#10 Delantera - Sofía",
          "#2 Defensa - Diana",
          "#6 Mediocampo - Andrea",
          "#11 Delantera - Mariana"
        ]
      },
      {
        id: 2,
        nombre: "Tunja FC",
        escudo: "assets/Tunja.png",
        jugadores: [
          "#1 Portera - Camila",
          "#3 Defensa - Valeria",
          "#7 Mediocampo - Daniela",
          "#9 Delantera - Juliana",
          "#4 Defensa - Gabriela",
          "#6 Mediocampo - Karen",
          "#10 Delantera - Sara"
        ]
      },
      {
        id: 3,
        nombre: "Bogotá FC",
        escudo: "assets/Bogota.png",
        jugadores: [
          "#1 Portera - Natalia",
          "#4 Defensa - Mónica",
          "#6 Mediocampo - Lucía",
          "#11 Delantera - Estefanía",
          "#2 Defensa - Viviana",
          "#7 Mediocampo - Nicole",
          "#9 Delantera - Susana"
        ]
      },
      {
        id: 4,
        nombre: "Llanera FC",
        escudo: "assets/Llanera.png",
        jugadores: [
          "#1 Portera - Patricia",
          "#2 Defensa - Sandra",
          "#8 Mediocampo - Olga",
          "#10 Delantera - Marta",
          "#3 Defensa - Fernanda",
          "#5 Mediocampo - Pilar",
          "#9 Delantera - Rosa"
        ]
      }
    ],
    partidosEnVivo: [
      { equipoA: "Chita FC", golesA: 1, equipoB: "Llanera FC", golesB: 1, minuto: 50 }
    ],
    proximosPartidos: [
      { equipoA: "Bogotá FC", equipoB: "Tunja FC", hora: "10:00", estado: "Programado" }
    ],
    resultadosPasados: [
      { resultado: "Tunja FC 2 - 0 Chita FC", fecha: "4 Nov 2025" }
    ],
    bracket: {
      final: {
        equipoA: { nombre: "Bogotá FC", escudo: "assets/Bogota.png" },
        equipoB: { nombre: "Chita FC", escudo: "assets/Chita.png" },
        fecha: "2/11 - 7 pmh"
      },
      campeon: { nombre: "Bogotá FC", escudo: "assets/Bogota.png" },
      tercerPuesto: [
        { nombre: "Tunja FC", escudo: "assets/Tunja.png" },
        { nombre: "Llanera FC", escudo: "assets/Llanera.png" }
      ]
    }
  }
};