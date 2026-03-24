async function loadGameWall() {
  try {
    const response = await fetch('/api/background-games');
    const games = await response.json();

    if (!Array.isArray(games) || games.length === 0) {
      return;
    }

    const wall = document.querySelector('.auth-page > div:nth-of-type(2)');
    if (!wall) return;

    const rows = Array.from(wall.children);

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
