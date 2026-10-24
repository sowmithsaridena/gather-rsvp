const themes = {
  wedding: { label: 'Indian wedding', kicker: 'together with their families', sample: 'Aarav & Meera\'s wedding', title: 'Aarav <i>&amp;</i> Meera', date: 'SUNDAY · OCTOBER 18 · 2026', place: 'THE GARDEN HOUSE · SONOMA, CA', decoration: '✦' },
  halloween: { label: 'Halloween night', kicker: 'come in costume', sample: 'Mara\'s haunted house', title: 'Mara\'s<br><i>after dark</i>', date: 'SATURDAY · OCTOBER 31 · 2026', place: '13 MOONLIGHT LANE · OAKLAND, CA', decoration: '☾' },
  birthday: { label: "Baby's birthday", kicker: 'a very happy first birthday', sample: 'Milo turns one!', title: 'Milo <i>turns one</i>', date: 'SUNDAY · JUNE 14 · 2026', place: 'THE LITTLE HOUSE · BERKELEY, CA', decoration: '●' },
  shower: { label: 'Baby shower', kicker: 'a little love is on the way', sample: 'Baby Patel is on the way', title: 'Baby <i>Patel</i>', date: 'SUNDAY · AUGUST 09 · 2026', place: 'THE GARDEN ROOM · SAN FRANCISCO', decoration: '♡' }
};

const titleInput = document.querySelector('#event-name');
const dateInput = document.querySelector('#event-date');
const placeInput = document.querySelector('#event-place');
const previewTitle = document.querySelector('#preview-title');
const previewKicker = document.querySelector('#preview-kicker');
const previewDate = document.querySelector('#preview-date');
const previewPlace = document.querySelector('#preview-place');
const liveCard = document.querySelector('#live-card');
const decorations = document.querySelectorAll('.card-decoration');
const dialog = document.querySelector('#rsvp-dialog');
let currentTheme = 'wedding';

function formatTitle(value) {
  const safe = value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
  return safe.replace(/\s(&|and)\s/i, ' <i>&amp;</i> ');
}

function updatePreview() {
  const eventTitle = titleInput.value.trim() || themes[currentTheme].sample;
  const date = dateInput.value.trim() || 'Date to be announced';
  const place = placeInput.value.trim() || 'Location to be announced';
  previewKicker.textContent = themes[currentTheme].kicker;
  previewTitle.innerHTML = formatTitle(eventTitle);
  previewDate.textContent = date.toUpperCase();
  previewPlace.textContent = place.toUpperCase();
  liveCard.className = `live-card theme-${currentTheme}`;
  decorations.forEach(node => node.textContent = themes[currentTheme].decoration);
}

function selectTheme(theme) {
  currentTheme = theme;
  document.querySelectorAll('.theme-tile').forEach(tile => {
    const selected = tile.dataset.theme === theme;
    tile.classList.toggle('active', selected);
    tile.setAttribute('aria-pressed', selected);
  });
  document.querySelectorAll('.choice').forEach(choice => {
    const selected = choice.dataset.choice === theme;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-checked', selected);
  });
  titleInput.value = themes[theme].sample;
  updatePreview();
}

document.querySelectorAll('.theme-tile').forEach(tile => tile.addEventListener('click', () => {
  selectTheme(tile.dataset.theme);
  document.querySelector('#create').scrollIntoView({ behavior: 'smooth', block: 'center' });
}));
document.querySelectorAll('.choice').forEach(choice => choice.addEventListener('click', () => selectTheme(choice.dataset.choice)));
[titleInput, dateInput, placeInput].forEach(input => input.addEventListener('input', updatePreview));
document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => document.querySelector(button.dataset.scroll).scrollIntoView({ behavior: 'smooth' })));

document.querySelector('#create-invite').addEventListener('click', () => {
  const message = document.querySelector('#form-message');
  message.textContent = `Your ${themes[currentTheme].label.toLowerCase()} invitation is ready to share.`;
  setTimeout(() => message.textContent = '', 3600);
});

document.querySelector('#rsvp-trigger').addEventListener('click', () => {
  document.querySelector('#dialog-title').textContent = titleInput.value.trim() || themes[currentTheme].sample;
  document.querySelector('#dialog-detail').textContent = `${dateInput.value || 'Date TBA'} · ${placeInput.value || 'Location TBA'}`;
  document.querySelector('#rsvp-confirmation').textContent = '';
  dialog.showModal();
});
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
document.querySelectorAll('.attending').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.attending').forEach(option => option.classList.remove('selected'));
  button.classList.add('selected');
}));
document.querySelector('#submit-rsvp').addEventListener('click', () => {
  document.querySelector('#rsvp-confirmation').textContent = 'Lovely — your response has been saved.';
  setTimeout(() => dialog.close(), 1600);
});
const accountDialog = document.querySelector('#account-dialog');
document.querySelector('#host-login').addEventListener('click', () => accountDialog.showModal());
accountDialog.querySelector('.close-dialog').addEventListener('click', () => accountDialog.close());
document.querySelector('#continue-account').addEventListener('click', () => {
  const name = document.querySelector('#host-name').value.trim();
  const email = document.querySelector('#host-email').value.trim();
  if (!name || !email || !email.includes('@')) {
    document.querySelector('#host-email').focus();
    return;
  }
  localStorage.setItem('gather-host', JSON.stringify({ name, email }));
  window.location.href = 'dashboard.html';
});
updatePreview();
