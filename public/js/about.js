const btn = document.getElementById('aboutBtn');
const extraInfo = document.getElementById('extraInfo');

btn.addEventListener('click', () => {
    extraInfo.classList.toggle('show');
});
