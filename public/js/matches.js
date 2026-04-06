document.addEventListener("DOMContentLoaded", function () {
    const options = {
        valueNames: ['name', 'bio', 'platform', 'playstyle', 'language', 'games']
    };

    const usersList = new List('matches', options);

    const filter = document.getElementById('filter');
    const sortSelect = document.getElementById('sortSelect');
    const checkboxes = filter.querySelectorAll('input[type="checkbox"]');

    function getCheckedValues(name) {
        return Array.from(filter.querySelectorAll(`input[name="${name}"]:checked`))
            .map(input => input.value.toLowerCase());
    }

    // Apply filters based on selected checkboxes

    function applyFilters() {
        const selectedPlatforms = getCheckedValues('platform');
        const selectedLanguages = getCheckedValues('language');
        const selectedPlaystyles = getCheckedValues('playstyle');

        usersList.filter(item => {
            const values = item.values();

            const platform = (values.platform || '').toLowerCase();
            const language = (values.language || '').toLowerCase();
            const playstyle = (values.playstyle || '').toLowerCase();

            const matchPlatform =
                selectedPlatforms.length === 0 ||
                selectedPlatforms.some(value => platform.includes(value));

            const matchLanguage =
                selectedLanguages.length === 0 ||
                selectedLanguages.some(value => language.includes(value));

            const matchPlaystyle =
                selectedPlaystyles.length === 0 ||
                selectedPlaystyles.some(value => playstyle.includes(value));

            return matchPlatform && matchLanguage && matchPlaystyle;
        });
    }

    // Apply sorting based on selected option

    function applySort() {
        const selectedSort = sortSelect.value;

        if (selectedSort === 'name-asc') {
            usersList.sort('name', { order: 'asc' });
        }

        if (selectedSort === 'name-desc') {
            usersList.sort('name', { order: 'desc' });
        }
    }

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    sortSelect.addEventListener('change', applySort);

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