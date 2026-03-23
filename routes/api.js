const express = require('express');
const router = express.Router();

router.get('/api/games-search', async (req, res) => {
  try {
    const query = (req.query.q || '').trim();

    if (!query || !process.env.RAWG_API_KEY) {
      return res.json([]);
    }

    const url = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=8`;
    const response = await fetch(url);
    const data = await response.json();

    const games = (data.results || []).map((game) => ({
      id: game.id,
      name: game.name,
      released: game.released || 'Unknown',
      background_image: game.background_image || ''
    }));

    res.json(games);
  } catch (error) {
    console.error('RAWG search error:', error);
    res.status(500).json({ error: 'Failed to fetch games.' });
  }
});

router.get('/api/background-games', async (req, res) => {
  try {
    if (!process.env.RAWG_API_KEY) {
      return res.json([]);
    }

    const url = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&page_size=40&ordering=-rating`;
    const response = await fetch(url);
    const data = await response.json();

    const games = (data.results || [])
      .filter((game) => game.background_image)
      .map((game) => ({
        id: game.id,
        name: game.name,
        image: game.background_image
      }));

    res.json(games);
  } catch (error) {
    console.error('Background games error:', error);
    res.status(500).json({ error: 'Failed to fetch background games.' });
  }
});

module.exports = router;