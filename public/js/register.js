document.addEventListener('DOMContentLoaded', () => {
  const avatarInput = document.getElementById('avatar');
  const avatarLabel = document.getElementById('avatarLabel');
  const avatarPreviewWrap = document.getElementById('avatarPreviewWrap');
  const avatarPreview = document.getElementById('avatarPreview');
  const removeAvatarBtn = document.getElementById('removeAvatarBtn');
  const gameSearch = document.getElementById('gameSearch');
  const searchResults = document.getElementById('searchResults');
  const selectedGames = document.getElementById('selectedGames');
  const favoriteGamesInput = document.getElementById('favoriteGamesInput');

  if (!avatarInput || !gameSearch) {
    return;
  }

  let selected = [];
  let debounceTimer;

  avatarPreviewWrap.style.display = 'none';
  searchResults.style.display = 'none';
  selectedGames.style.display = 'none';

  function updateHiddenInput() {
    favoriteGamesInput.value = JSON.stringify(selected);
  }

  function renderSelectedGames() {
    selectedGames.innerHTML = '';

    if (selected.length === 0) {
      selectedGames.style.display = 'none';
      return;
    }

    selectedGames.style.display = 'flex';

    selected.forEach((game, index) => {
      const tag = document.createElement('div');
      tag.innerHTML = `
        <span>${game.name}</span>
        <button type="button" data-index="${index}">x</button>
      `;
      selectedGames.appendChild(tag);
    });

    selectedGames.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.index);
        selected.splice(index, 1);
        renderSelectedGames();
        updateHiddenInput();
      });
    });
  }

  async function searchGames(query) {
    const response = await fetch(`/api/games-search?q=${encodeURIComponent(query)}`);
    const games = await response.json();

    searchResults.innerHTML = '';

    if (!Array.isArray(games) || games.length === 0) {
      searchResults.style.display = 'none';
      return;
    }

    searchResults.style.display = 'flex';

    games.forEach((game) => {
      const alreadyAdded = selected.some((g) => g.id === game.id);
      const item = document.createElement('button');
      item.type = 'button';
      item.disabled = alreadyAdded;
      item.innerHTML = `
        <div>
          ${game.background_image ? `<img src="${game.background_image}" alt="${game.name}">` : ''}
          <div><strong>${game.name}</strong></div>
        </div>
      `;

      item.addEventListener('click', () => {
        if (!selected.some((g) => g.id === game.id)) {
          selected.push({ id: game.id, name: game.name });
          renderSelectedGames();
          updateHiddenInput();
          searchResults.innerHTML = '';
          searchResults.style.display = 'none';
          gameSearch.value = '';
        }
      });

      searchResults.appendChild(item);
    });
  }

  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];

    if (!file) {
      avatarPreview.src = '';
      avatarPreviewWrap.style.display = 'none';
      avatarInput.style.display = 'block';
      avatarLabel.style.display = 'block';
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      avatarInput.value = '';
      avatarPreview.src = '';
      avatarPreviewWrap.style.display = 'none';
      return;
    }

    avatarPreview.src = URL.createObjectURL(file);
    avatarPreviewWrap.style.display = 'flex';
    avatarInput.style.display = 'none';
    avatarLabel.style.display = 'none';
  });

  removeAvatarBtn.addEventListener('click', () => {
    avatarInput.value = '';
    avatarPreview.src = '';
    avatarPreviewWrap.style.display = 'none';
    avatarInput.style.display = 'block';
    avatarLabel.style.display = 'block';
  });

  gameSearch.addEventListener('input', () => {
    const query = gameSearch.value.trim();
    clearTimeout(debounceTimer);

    if (query.length < 2) {
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(() => {
      searchGames(query);
    }, 300);
  });
});
