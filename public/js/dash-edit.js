
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("remove-tag")) {
      const row = e.target.parentElement;
      const container = document.getElementById("tag-fields");

      // voorkom dat alle velden verdwijnen
      if (container.children.length > 1) {
        row.remove();
      } else {
        // laatste veld mag niet weg → maak het gewoon leeg
        row.querySelector("input").value = "";
      }
    }
  });

  // Tag toevoegen
  document.getElementById("add-tag-btn").addEventListener("click", () => {
    const container = document.getElementById("tag-fields");

    const row = document.createElement("div");
    row.classList.add("tag-row");

    row.innerHTML = `
      <input type="text" name="tags[]" placeholder="New tag" />
      <button type="button" class="remove-tag">✖</button>
    `;

    container.appendChild(row);
  });

  document.querySelectorAll('.edit-thumbnail, .edit-avatar').forEach(box => {
  const input = box.querySelector('input[type="file"]');
  const img = box.querySelector('img');

  // Klik op de afbeelding opent de file input
  box.addEventListener('click', () => {
    input.click();
  });

  // Live preview
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) {
      img.src = URL.createObjectURL(file);
    }
  });
});
