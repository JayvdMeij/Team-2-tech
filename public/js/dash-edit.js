// PLATFORM SELECTOR
const platformBtn = document.getElementById("add-platform-btn");
const platformOptions = document.getElementById("platform-options");
const platformList = document.getElementById("platform-list");

platformBtn.addEventListener("click", () => {
  platformOptions.classList.toggle("hidden");
});

platformOptions.addEventListener("click", (e) => {
  if (!e.target.classList.contains("tag-option")) return;

  const value = e.target.dataset.value;

  const row = document.createElement("div");
  row.classList.add("tag-pill");
  row.innerHTML = `
    <span>${value}</span>
    <input type="hidden" name="platform[]" value="${value}">
    <button type="button" class="remove-tag">✖</button>
  `;

  platformList.appendChild(row);
  e.target.remove(); // remove from options
});


// LANGUAGE SELECTOR
const languageBtn = document.getElementById("add-language-btn");
const languageOptions = document.getElementById("language-options");
const languageList = document.getElementById("language-list");

languageBtn.addEventListener("click", () => {
  languageOptions.classList.toggle("hidden");
});

languageOptions.addEventListener("click", (e) => {
  if (!e.target.classList.contains("tag-option")) return;

  const value = e.target.dataset.value;

  const row = document.createElement("div");
  row.classList.add("tag-pill");
  row.innerHTML = `
    <span>${value}</span>
    <input type="hidden" name="language[]" value="${value}">
    <button type="button" class="remove-tag">✖</button>
  `;

  languageList.appendChild(row);
  e.target.remove(); // remove from options
});

// PLAYSTYLE SELECTOR
const playstyleBtn = document.getElementById("add-playstyle-btn");
const playstyleOptions = document.getElementById("playstyle-options");
const playstyleList = document.getElementById("playstyle-list");

playstyleBtn.addEventListener("click", () => {
  playstyleOptions.classList.toggle("hidden");
});

playstyleOptions.addEventListener("click", (e) => {
  if (!e.target.classList.contains("tag-option")) return;

  const value = e.target.dataset.value;

  const row = document.createElement("div");
  row.classList.add("tag-pill");
  row.innerHTML = `
    <span>${value}</span>
    <input type="hidden" name="playstyle[]" value="${value}">
    <button type="button" class="remove-tag">✖</button>
  `;

  playstyleList.appendChild(row);
  e.target.remove(); // remove from options   
});

// CUSTOM TAGS
const customTagInput = document.getElementById("custom-tag-input");
const customTagBtn = document.getElementById("add-custom-tag-btn");
const customTagList = document.getElementById("custom-tag-list");

customTagBtn.addEventListener("click", () => {
  const value = customTagInput.value.trim();
  if (!value) return;

  const row = document.createElement("div");
  row.classList.add("tag-pill");
  row.innerHTML = `
    <span>${value}</span>
    <input type="hidden" name="customTag[]" value="${value}">
    <button type="button" class="remove-tag">✖</button>
  `;

  customTagList.appendChild(row);
  customTagInput.value = ""; // clear input
});

// REMOVE TAGS
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("remove-tag")) return;

  const row = e.target.closest(".tag-pill");
  const value = row.querySelector("input").value;
  const type = row.querySelector("input").name; // platform[], language[], playstyle[], customTag[]

  // Add back to options if it's a predefined tag
  if (type === "platform[]") {
    const option = document.createElement("div");
    option.classList.add("tag-option");
    option.dataset.value = value;
    option.textContent = value;
    document.getElementById("platform-options").appendChild(option);
  } else if (type === "language[]") {
    const option = document.createElement("div");
    option.classList.add("tag-option");
    option.dataset.value = value;
    option.textContent = value;
    document.getElementById("language-options").appendChild(option);
  } else if (type === "playstyle[]") {
    const option = document.createElement("div");
    option.classList.add("tag-option");
    option.dataset.value = value;
    option.textContent = value;
    document.getElementById("playstyle-options").appendChild(option);
  }
  else if (type === "customTag[]") {}

  row.remove(); // remove from list
});
