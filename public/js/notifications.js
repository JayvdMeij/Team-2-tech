// public/js/notifications.js
// currentUserId is set as a global var in header.ejs

if (typeof currentUserId !== 'undefined' && currentUserId) {
  const socket = io();

  // Join a personal room so the server can target this user
  socket.emit('join', currentUserId);

  // On page load: fetch the pending count from DB for the badge
  fetchPendingCount();

  // Real-time: someone just sent you a friend request
  socket.on('friend-request', (data) => {
    showFriendRequestPopup(data);
    updateBadge(1);
  });

  // Real-time: someone accepted your friend request
  socket.on('friend-accepted', (data) => {
    showAcceptedPopup(data);
  });

  // Real-time: server pushes pending requests when you connect
  // This handles the "offline user logs in" scenario
  socket.on('pending-requests', (requests) => {
    setBadge(requests.length);
    if (requests.length > 0) {
      showPendingCountPopup(requests.length);
    }
  });
}

// ─────────────────────────────────────────
//  Badge helpers — updates ALL .inbox-badge elements
//  (sidebar badge + header badge update together)
// ─────────────────────────────────────────

function fetchPendingCount() {
  fetch('/api/friend-requests/pending-count')
    .then((res) => res.json())
    .then((data) => setBadge(data.count))
    .catch((err) => console.error('Failed to fetch pending count:', err));
}

function setBadge(count) {
  document.querySelectorAll('.inbox-badge').forEach((badge) => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

function updateBadge(change) {
  const badge = document.querySelector('.inbox-badge');
  const current = badge ? parseInt(badge.textContent) || 0 : 0;
  setBadge(Math.max(0, current + change));
}

// ─────────────────────────────────────────
//  Popup: incoming friend request (your existing style)
// ─────────────────────────────────────────

function showFriendRequestPopup({ fromUsername, fromId, fromAvatar }) {
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
      <a href="/inbox" class="fr-popup-link">Bekijk inbox</a>
      <button class="fr-popup-close" onclick="document.getElementById('fr-popup').remove()">✕</button>
    </div>
  `;

  document.body.appendChild(popup);
  autoDismiss('fr-popup');
}

// ─────────────────────────────────────────
//  Popup: friend request accepted
// ─────────────────────────────────────────

function showAcceptedPopup({ byUsername }) {
  const existing = document.getElementById('fa-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'fa-popup';
  popup.innerHTML = `
    <div class="fr-popup-content">
      <div class="fr-popup-text">
        <strong>${byUsername}</strong> heeft je vriendschapsverzoek geaccepteerd!
      </div>
      <button class="fr-popup-close" onclick="document.getElementById('fa-popup').remove()">✕</button>
    </div>
  `;

  document.body.appendChild(popup);
  autoDismiss('fa-popup');
}

// ─────────────────────────────────────────
//  Popup: pending requests on login
// ─────────────────────────────────────────

function showPendingCountPopup(count) {
  const existing = document.getElementById('pending-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'pending-popup';
  popup.innerHTML = `
    <div class="fr-popup-content">
      <div class="fr-popup-text">
        Je hebt <strong>${count}</strong> openstaand${count === 1 ? '' : 'e'} vriendschapsverzoek${count === 1 ? '' : 'en'}!
      </div>
      <a href="/inbox" class="fr-popup-link">Bekijk inbox</a>
      <button class="fr-popup-close" onclick="document.getElementById('pending-popup').remove()">✕</button>
    </div>
  `;

  document.body.appendChild(popup);
  autoDismiss('pending-popup');
}

// ─────────────────────────────────────────
//  Auto-dismiss helper
// ─────────────────────────────────────────

function autoDismiss(id, delay = 6000) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('fr-popup-hide');
      setTimeout(() => el && el.remove(), 400);
    }
  }, delay);
}