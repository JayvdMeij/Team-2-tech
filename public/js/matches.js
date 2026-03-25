document.addEventListener("DOMContentLoaded", function() {
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