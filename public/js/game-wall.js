async function loadGameWall() {
  try {
    const response = await fetch('/api/background-games');
    const games = await response.json();

    if (!Array.isArray(games) || games.length === 0) {
      return;
    }

    const rows = ['row1', 'row2', 'row3', 'row4', 'row5', 'row6']
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    rows.forEach((row) => {
      const shuffled = [...games].sort(() => Math.random() - 0.5);
      const rowGames = shuffled.slice(0, 14);
      const repeated = [...rowGames, ...rowGames];

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

document.addEventListener('DOMContentLoaded', loadGameWall);
