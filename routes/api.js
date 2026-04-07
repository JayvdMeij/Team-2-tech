const express = require('express');
const router = express.Router();

// API route voor het zoeken naar games via RAWG API
router.get('/api/games-search', async (req, res) => {
  try {
    // Haal de zoekquery op uit de request parameters
    const query = (req.query.q || '').trim();

    // Controleer of er een query is en of de API key beschikbaar is
    if (!query || !process.env.RAWG_API_KEY) {
      return res.json([]);
    }

    // Bouw de URL voor de RAWG API zoekopdracht
    const url = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=8`;
    const response = await fetch(url);
    const data = await response.json();

    // Map de resultaten naar een eenvoudig formaat
    const games = (data.results || []).map((game) => ({
      id: game.id,
      name: game.name,
      released: game.released || 'Unknown',
      background_image: game.background_image || ''
    }));

    // Stuur de game resultaten terug als JSON
    res.json(games);
  } catch (error) {
    console.error('RAWG search error:', error);
    res.status(500).json({ error: 'Failed to fetch games.' });
  }
});

// API route voor het ophalen van achtergrond games voor de game wall
router.get('/api/background-games', async (req, res) => {
  try {
    // Controleer of de API key beschikbaar is
    if (!process.env.RAWG_API_KEY) {
      return res.json([]);
    }

    // Bouw de URL voor het ophalen van populaire games met achtergrondafbeeldingen
    const url = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&ordering=-added&page_size=40`;
    const response = await fetch(url);
    const data = await response.json();

    // Filter games die een achtergrondafbeelding hebben en map naar eenvoudig formaat
    const games = (data.results || [])
      .filter((game) => game.background_image)
      .map((game) => ({
        id: game.id,
        name: game.name,
        image: game.background_image
      }));

    // Stuur de achtergrond games terug als JSON
    res.json(games);
  } catch (error) {
    console.error('Background games error:', error);
    res.status(500).json({ error: 'Failed to fetch background games.' });
  }
});

module.exports = router;