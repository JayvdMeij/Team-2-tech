// Wacht tot de DOM volledig geladen is voordat de registratie logica wordt geïnitialiseerd
document.addEventListener('DOMContentLoaded', () => {
  // Haal alle benodigde DOM elementen op voor het registratie formulier
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

  // Array om geselecteerde favoriete games bij te houden
  let selected = [];
  // Timer voor debounce bij zoeken
  let debounceTimer;

  // Functie om de game zoek functionaliteit te initialiseren
  function initializeGameSearch() {
    // Controleer of alle benodigde elementen bestaan
    if (!gameSearch || !searchResults || !selectedGames || !favoriteGamesInput) {
      return;
    }

    // Probeer de bestaande favoriete games te laden uit het hidden input veld
    try {
      selected = favoriteGamesInput.value ? JSON.parse(favoriteGamesInput.value) : [];
      if (!Array.isArray(selected)) {
        selected = [];
      }
    } catch {
      selected = [];
    }

    // Verberg de zoekresultaten initieel
    searchResults.style.display = 'none';

    // Functie om het hidden input veld bij te werken met geselecteerde games
    function updateHiddenInput() {
      favoriteGamesInput.value = JSON.stringify(selected);
    }

    // Functie om de geselecteerde games weer te geven als tags
    function renderSelectedGames() {
      selectedGames.innerHTML = '';

      if (selected.length === 0) {
        selectedGames.style.display = 'none';
        return;
      }

      selectedGames.style.display = 'flex';

      // Maak voor elke geselecteerde game een tag aan
      selected.forEach((game, index) => {
        const tag = document.createElement('div');
        tag.innerHTML = `
          <span>${game.name}</span>
          <button type="button" data-index="${index}">x</button>
        `;
        selectedGames.appendChild(tag);
      });

      // Voeg event listeners toe aan de verwijder knoppen
      selectedGames.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          const index = Number(btn.dataset.index);
          selected.splice(index, 1);
          renderSelectedGames();
          updateHiddenInput();
        });
      });
    }

    // Functie om games te zoeken via de API
    async function searchGames(query) {
      const response = await fetch(`/api/games-search?q=${encodeURIComponent(query)}`);
      const games = await response.json();

      searchResults.innerHTML = '';

      if (!Array.isArray(games) || games.length === 0) {
        searchResults.style.display = 'none';
        return;
      }

      searchResults.style.display = 'flex';

      // Maak voor elke gevonden game een klikbare button
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

        // Voeg click event toe om game toe te voegen aan selectie
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

    // Render de initieel geselecteerde games
    renderSelectedGames();
    updateHiddenInput();

    // Voeg input event listener toe aan het zoekveld met debounce
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

  // Functie om tag select functionaliteit in te stellen voor platform, taal, en playstyle
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

      // Maak een tag element aan
      const tag = document.createElement('div');
      tag.innerHTML = `
        <span>${text}</span>
        <button type="button">&times;</button>
        <input type="hidden" name="${inputName}" value="${value}">
      `;

      // Voeg verwijder event toe aan de tag
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

  // Stel tag select in voor platform, taal, en playstyle
  setupTagSelect(platformSelect, selectedPlatforms, 'platform[]');
  setupTagSelect(languageSelect, selectedLanguages, 'language[]');
  setupTagSelect(playstyleSelect, selectedPlaystyles, 'playstyle[]');

  // Initialiseer de game zoek functionaliteit
  initializeGameSearch();

  // Controleer of alle benodigde elementen bestaan voor de multi-step registratie
  if (!registerForm || !registerCard || !registerStep1 || !registerStep2 || !avatarInput || !avatarLabel || !avatarPreviewWrap || !avatarPreview || !removeAvatarBtn || !fileUploadDiv || !nextStepBtn || !backStepBtn) {
    return;
  }

  // Verberg stap 2 initieel en avatar preview
  registerStep2.style.display = 'none';
  avatarPreviewWrap.style.display = 'none';

  // Functie om tussen stappen te wisselen
  function showStep(stepNumber) {
    registerStep1.style.display = stepNumber === 1 ? 'flex' : 'none';
    registerStep2.style.display = stepNumber === 2 ? 'flex' : 'none';
    registerCard.classList.toggle('is-step-2', stepNumber === 2);
    registerCard.scrollTop = 0;
  }

  // Functie om stap 1 te valideren
  function validateStepOne() {
    const fields = registerStep1.querySelectorAll('input[required]');
    return Array.from(fields).every((field) => field.reportValidity());
  }

  // Event listener voor avatar file input verandering
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

  // Event listener voor avatar verwijderen knop
  removeAvatarBtn.addEventListener('click', () => {
    avatarInput.value = '';
    avatarPreview.src = '';
    avatarPreviewWrap.style.display = 'none';
    fileUploadDiv.style.display = 'flex';
  });

  // Toon stap 1 initieel
  showStep(1);

  // Event listener voor volgende stap knop
  nextStepBtn.addEventListener('click', () => {
    if (!validateStepOne()) {
      return;
    }

    showStep(2);
  });

  // Event listener voor vorige stap knop
  backStepBtn.addEventListener('click', () => {
    showStep(1);
  });

  
  // Voorkom formulier verzending bij Enter in stap 1 inputs en ga naar volgende stap
  const step1Inputs = registerStep1.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
  step1Inputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nextStepBtn.click();
      }
    });
  });

  // Event listener voor Enter in playstyle select om naar volgende stap te gaan
  var input = document.getElementById("playstyle");
    input.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("myBtn").click();
      }
    });
});
