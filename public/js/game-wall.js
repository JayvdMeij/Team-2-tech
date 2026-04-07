// Functie om de game wall te laden met achtergrondafbeeldingen van games
async function loadGameWall() {
  try {
    // Haal de lijst met achtergrondspellen op van de API
    const response = await fetch('/api/background-games');
    const games = await response.json();

    // Controleer of er games zijn ontvangen
    if (!Array.isArray(games) || games.length === 0) {
      return;
    }

    // Vind het element waar de game wall wordt weergegeven
    const wall = document.querySelector('.auth-page > div:nth-of-type(2)');
    if (!wall) return;

    // Haal de rijen op uit de wall
    const rows = Array.from(wall.children);

    // Voor elke rij, vul deze met willekeurige games
    rows.forEach((row) => {
      // Shuffle de games voor variatie
      const shuffled = [...games].sort(() => Math.random() - 0.5);
      // Neem de eerste 14 games
      const rowGames = shuffled.slice(0, 14);
      // Herhaal de games om de rij te vullen
      const repeated = [...rowGames, ...rowGames];

      // Genereer HTML voor elke game in de rij
      row.innerHTML = repeated.map((game) => `
        <div>
          <img src="${game.image}" alt="${game.name}">
        </div>
      `).join('');
    });
  } catch (error) {
    console.error('Failed to load game wall:', error);
  }
}

// Laad de game wall wanneer de pagina volledig is geladen
document.addEventListener('DOMContentLoaded', loadGameWall);
