document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const registerCard = document.getElementById('registerCard');
  const registerStep1 = document.getElementById('registerStep1');
  const registerStep2 = document.getElementById('registerStep2');
  const nextStepBtn = document.getElementById('nextStepBtn');
  const backStepBtn = document.getElementById('backStepBtn');
  const avatarInput = document.getElementById('avatar');
  const avatarLabel = document.getElementById('avatarLabel');
  const avatarPreviewWrap = document.getElementById('avatarPreviewWrap');
  const avatarPreview = document.getElementById('avatarPreview');
  const removeAvatarBtn = document.getElementById('removeAvatarBtn');
  const fileUploadDiv = document.querySelector('.file-upload');
  const gameSearch = document.getElementById('gameSearch');
  const searchResults = document.getElementById('searchResults');
  const selectedGames = document.getElementById('selectedGames');
  const favoriteGamesInput = document.getElementById('favoriteGamesInput');

  const platformSelect = document.getElementById('platform');
  const languageSelect = document.getElementById('language');
  const playstyleSelect = document.getElementById('playstyle');
  const selectedPlatforms = document.getElementById('selectedPlatforms');
  const selectedLanguages = document.getElementById('selectedLanguages');
  const selectedPlaystyles = document.getElementById('selectedPlaystyles');

  let selected = [];
  let debounceTimer;

  function initializeGameSearch() {
    if (!gameSearch || !searchResults || !selectedGames || !favoriteGamesInput) {
      return;
    }

    try {
      selected = favoriteGamesInput.value ? JSON.parse(favoriteGamesInput.value) : [];
      if (!Array.isArray(selected)) {
        selected = [];
      }
    } catch {
      selected = [];
    }

    searchResults.style.display = 'none';

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

    renderSelectedGames();
    updateHiddenInput();

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
  }

  function setupTagSelect(selectElement, outputElement, inputName) {
    if (!selectElement || !outputElement) return;

    const selectedValues = new Set();

    selectElement.addEventListener('change', () => {
      const value = selectElement.value;
      const text = selectElement.options[selectElement.selectedIndex].text;

      if (!value || selectedValues.has(value)) {
        selectElement.value = '';
        return;
      }

      selectedValues.add(value);

      const tag = document.createElement('div');
      tag.innerHTML = `
        <span>${text}</span>
        <button type="button">&times;</button>
        <input type="hidden" name="${inputName}" value="${value}">
      `;

      tag.querySelector('button').addEventListener('click', () => {
        selectedValues.delete(value);
        tag.remove();

        if (outputElement.children.length === 0) {
          outputElement.style.display = 'none';
        }
      });

      outputElement.appendChild(tag);
      outputElement.style.display = 'flex';
      selectElement.value = '';
    });
  }

  setupTagSelect(platformSelect, selectedPlatforms, 'platform[]');
  setupTagSelect(languageSelect, selectedLanguages, 'language[]');
  setupTagSelect(playstyleSelect, selectedPlaystyles, 'playstyle[]');

  initializeGameSearch();

  if (!registerForm || !registerCard || !registerStep1 || !registerStep2 || !avatarInput || !avatarLabel || !avatarPreviewWrap || !avatarPreview || !removeAvatarBtn || !fileUploadDiv || !nextStepBtn || !backStepBtn) {
    return;
  }

  registerStep2.style.display = 'none';
  avatarPreviewWrap.style.display = 'none';

  function showStep(stepNumber) {
    registerStep1.style.display = stepNumber === 1 ? 'flex' : 'none';
    registerStep2.style.display = stepNumber === 2 ? 'flex' : 'none';
    registerCard.classList.toggle('is-step-2', stepNumber === 2);
    registerCard.scrollTop = 0;
  }

  function validateStepOne() {
    const fields = registerStep1.querySelectorAll('input[required]');
    return Array.from(fields).every((field) => field.reportValidity());
  }

  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];

    if (!file) {
      avatarPreview.src = '';
      avatarPreviewWrap.style.display = 'none';
      fileUploadDiv.style.display = 'flex';
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
    fileUploadDiv.style.display = 'none';
  });

  removeAvatarBtn.addEventListener('click', () => {
    avatarInput.value = '';
    avatarPreview.src = '';
    avatarPreviewWrap.style.display = 'none';
    fileUploadDiv.style.display = 'flex';
  });

  showStep(1);

  nextStepBtn.addEventListener('click', () => {
    if (!validateStepOne()) {
      return;
    }

    showStep(2);
  });

  backStepBtn.addEventListener('click', () => {
    showStep(1);
  });

  
  // Prevent form submission on Enter in step 1 inputs and go to next step
  const step1Inputs = registerStep1.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
  step1Inputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nextStepBtn.click();
      }
    });
  });

  var input = document.getElementById("playstyle");
    input.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("myBtn").click();
      }
    });
});
