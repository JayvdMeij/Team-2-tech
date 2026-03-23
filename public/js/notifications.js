// Only run if the user is logged in (currentUserId is set in the EJS layout)
if (typeof currentUserId !== 'undefined' && currentUserId) {
  const socket = io();

  // Join a personal room so the server can target this user
  socket.emit('join', currentUserId);

  socket.on('friend-request', (data) => {
    showFriendRequestPopup(data);
  });
}

function showFriendRequestPopup({ fromUsername, fromId, fromAvatar }) {
  // Remove any existing popup
  const existing = document.getElementById('fr-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'fr-popup';
  popup.innerHTML = `
    <div class="fr-popup-content">
      ${fromAvatar
        ? `<img src="/uploads/${fromAvatar}" class="fr-popup-avatar" />`
        : `<div class="fr-popup-avatar-placeholder">👤</div>`
      }
      <div class="fr-popup-text">
        <strong>${fromUsername}</strong> heeft je een vriendschapsverzoek gestuurd!
      </div>
      <a href="/user/${fromId}" class="fr-popup-link">Bekijk profiel</a>
      <button class="fr-popup-close" onclick="document.getElementById('fr-popup').remove()">✕</button>
    </div>
  `;

  document.body.appendChild(popup);

  // Auto-dismiss after 6 seconds
  setTimeout(() => {
    const p = document.getElementById('fr-popup');
    if (p) p.classList.add('fr-popup-hide');
    setTimeout(() => p && p.remove(), 400);
  }, 6000);
}