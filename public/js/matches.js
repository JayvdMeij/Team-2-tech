document.addEventListener("DOMContentLoaded", function () {
    const options = {
        valueNames: ['name', 'bio', 'platform', 'playstyle', 'language', 'games']
    };

    const usersList = new List('matches', options);

    // filter functie
    const filter = document.getElementById('filter');
    filter.addEventListener('change', () => {
        const value = filter.value.toLowerCase();

        // alle gebruikers laten zien bij 'filteren' moet nog veranderd worden (styling)
        if (value === 'all') {
            usersList.filter();
            return;
        }

        // filters
        usersList.filter(item => {
            const platform = (item.values().platform || '').toLowerCase();
            const playstyle = (item.values().playstyle || '').toLowerCase();
            const language = (item.values().language || '').toLowerCase();

            return (
                platform.includes(value) ||
                playstyle.includes(value) ||
                language.includes(value)
            );
        });
    });

    // sorteren
    const sortButton = document.querySelector('.sort');
    sortButton.addEventListener('click', () => {
        usersList.sort('name', { order: 'asc' });
    });

    usersList.sort('name', { order: 'asc' });
});

// add friend button logic
document.querySelectorAll('.btn-add-friend').forEach((btn) => {
    btn.addEventListener('click', async () => {
        const userId = btn.dataset.userid;
        btn.disabled = true;
        btn.textContent = 'Sending...';

        try {
            const res = await fetch(`/api/friend-request/${userId}`, {
                method: 'POST'
            });
            const data = await res.json();

            if (data.success) {
                btn.textContent = 'Request sent';
                btn.classList.remove('btn-add-friend');
                btn.classList.add('btn-disabled');
            } else {
                btn.textContent = data.error || 'Failed';
                setTimeout(() => {
                    btn.textContent = 'Add Friend';
                    btn.disabled = false;
                }, 2000);
            }
        } catch (err) {
            console.error('Friend request error:', err);
            btn.textContent = 'Error, try again';
            setTimeout(() => {
                btn.textContent = 'Add Friend';
                btn.disabled = false;
            }, 2000);
        }
    });
});