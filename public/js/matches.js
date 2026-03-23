const options = {
  valueNames: ['name', 'bio', 'platform', 'playstyle', 'language', 'games']
};

const usersList = new List('matches', options);

const filter = document.getElementById('filter');

filter.addEventListener('change', () => {
  const value = filter.value.toLowerCase();

  if (value === 'all') {
    usersList.filter();
    return;
  }

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

usersList.sort('name', { order: 'asc' });