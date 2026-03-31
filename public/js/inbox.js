// public/js/inbox.js

async function acceptRequest(fromId) {
  try {
    const res = await fetch(`/api/friend-request/${fromId}/accept`, { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      const card = document.getElementById(`request-${fromId}`);
      card.innerHTML = '<p style="color: #4caf50; padding: 1rem;">Request accepted!</p>';
      setTimeout(() => card.remove(), 2000);
      // updateBadge is defined in notifications.js (loaded via footer)
      updateBadge(-1);
      checkEmpty();
    }
  } catch (err) {
    console.error('Accept error:', err);
  }
}

async function declineRequest(fromId) {
  try {
    const res = await fetch(`/api/friend-request/${fromId}/decline`, { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      document.getElementById(`request-${fromId}`).remove();
      updateBadge(-1);
      checkEmpty();
    }
  } catch (err) {
    console.error('Decline error:', err);
  }
}

function checkEmpty() {
  const container = document.querySelector('.inbox-container');
  if (!container.querySelector('.request-card')) {
    const msg = document.createElement('p');
    msg.className = 'empty-inbox';
    msg.textContent = 'No pending friend requests.';
    container.appendChild(msg);
  }
}