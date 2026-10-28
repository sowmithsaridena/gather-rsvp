const themes = {
  wedding: { label: 'Indian wedding', dbTheme: 'indian-wedding', kicker: 'together with their families', sample: 'Aarav & Meera\'s wedding', decoration: '✦' },
  halloween: { label: 'Halloween night', dbTheme: 'halloween-party', kicker: 'come in costume', sample: 'Mara\'s haunted house', decoration: '☾' },
  birthday: { label: "Baby's birthday", dbTheme: 'baby-birthday', kicker: 'a very happy first birthday', sample: 'Milo turns one!', decoration: '●' },
  shower: { label: 'Baby shower', dbTheme: 'baby-shower', kicker: 'a little love is on the way', sample: 'Baby Patel is on the way', decoration: '♡' }
};

const db = window.gatherClient;
const titleInput = document.querySelector('#event-name');
const dateInput = document.querySelector('#event-date');
const placeInput = document.querySelector('#event-place');
const previewTitle = document.querySelector('#preview-title');
const previewKicker = document.querySelector('#preview-kicker');
const previewDate = document.querySelector('#preview-date');
const previewPlace = document.querySelector('#preview-place');
const liveCard = document.querySelector('#live-card');
const decorations = document.querySelectorAll('.card-decoration');
const rsvpDialog = document.querySelector('#rsvp-dialog');
const accountDialog = document.querySelector('#account-dialog');
const accountNote = document.querySelector('#account-note');
let currentTheme = 'wedding';
let accountMode = 'signup';

function formatTitle(value) {
  const safe = value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
  return safe.replace(/\s(&|and)\s/i, ' <i>&amp;</i> ');
}

function updatePreview() {
  const eventTitle = titleInput.value.trim() || themes[currentTheme].sample;
  previewKicker.textContent = themes[currentTheme].kicker;
  previewTitle.innerHTML = formatTitle(eventTitle);
  previewDate.textContent = (dateInput.value.trim() || 'Date to be announced').toUpperCase();
  previewPlace.textContent = (placeInput.value.trim() || 'Location to be announced').toUpperCase();
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

function draftFromForm() {
  const parsedDate = new Date(dateInput.value);
  return {
    title: titleInput.value.trim() || themes[currentTheme].sample,
    theme: themes[currentTheme].dbTheme,
    starts_at: Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString(),
    location_name: placeInput.value.trim() || null
  };
}

async function saveDraft(draft) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    localStorage.setItem('gather-event-draft', JSON.stringify(draft));
    accountNote.textContent = 'Create an account first, then your invitation will be waiting in your dashboard.';
    accountDialog.showModal();
    return;
  }
  const { error } = await db.from('events').insert({ ...draft, host_id: user.id });
  if (error) throw error;
  window.location.href = 'dashboard.html';
}

document.querySelectorAll('.theme-tile').forEach(tile => tile.addEventListener('click', () => {
  selectTheme(tile.dataset.theme);
  document.querySelector('#create').scrollIntoView({ behavior: 'smooth', block: 'center' });
}));
document.querySelectorAll('.choice').forEach(choice => choice.addEventListener('click', () => selectTheme(choice.dataset.choice)));
[titleInput, dateInput, placeInput].forEach(input => input.addEventListener('input', updatePreview));
document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => document.querySelector(button.dataset.scroll).scrollIntoView({ behavior: 'smooth' })));

document.querySelector('#create-invite').addEventListener('click', async () => {
  const message = document.querySelector('#form-message');
  message.textContent = 'Creating your invitation…';
  try { await saveDraft(draftFromForm()); }
  catch (error) { message.textContent = error.message || 'We could not create that invitation. Please try again.'; }
});

document.querySelector('#rsvp-trigger').addEventListener('click', () => {
  document.querySelector('#dialog-title').textContent = titleInput.value.trim() || themes[currentTheme].sample;
  document.querySelector('#dialog-detail').textContent = `${dateInput.value || 'Date TBA'} · ${placeInput.value || 'Location TBA'}`;
  document.querySelector('#rsvp-confirmation').textContent = 'Guest RSVP links will be ready after you add guests in your dashboard.';
  rsvpDialog.showModal();
});
rsvpDialog.querySelector('.close-dialog').addEventListener('click', () => rsvpDialog.close());
document.querySelectorAll('.attending').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.attending').forEach(option => option.classList.remove('selected'));
  button.classList.add('selected');
}));
document.querySelector('#submit-rsvp').addEventListener('click', () => {
  document.querySelector('#rsvp-confirmation').textContent = 'This sample RSVP is ready — add guests from your host dashboard to collect real responses.';
});

document.querySelector('#host-login').addEventListener('click', async () => {
  const { data: { user } } = await db.auth.getUser();
  if (user) window.location.href = 'dashboard.html';
  else accountDialog.showModal();
});
accountDialog.querySelector('.close-dialog').addEventListener('click', () => accountDialog.close());
document.querySelector('#switch-account-mode').addEventListener('click', () => {
  accountMode = accountMode === 'signup' ? 'signin' : 'signup';
  const isSignIn = accountMode === 'signin';
  document.querySelector('#continue-account').innerHTML = isSignIn ? 'Sign in to my events <span>→</span>' : 'Create my account <span>→</span>';
  document.querySelector('#switch-account-mode').textContent = isSignIn ? 'Need an account? Create one' : 'Already have an account? Sign in';
  document.querySelector('label[for="host-name"]').hidden = isSignIn;
  document.querySelector('#host-name').hidden = isSignIn;
  document.querySelector('#host-password').autocomplete = isSignIn ? 'current-password' : 'new-password';
  accountNote.textContent = isSignIn ? 'Use the email and password you chose for Gather.' : 'We’ll send a confirmation email before your account becomes active.';
});
document.querySelector('#continue-account').addEventListener('click', async () => {
  const name = document.querySelector('#host-name').value.trim();
  const email = document.querySelector('#host-email').value.trim();
  const password = document.querySelector('#host-password').value;
  if (!email.includes('@') || password.length < 6 || (accountMode === 'signup' && !name)) {
    accountNote.textContent = 'Enter your name, a valid email, and a password with at least 6 characters.';
    return;
  }
  const button = document.querySelector('#continue-account');
  button.disabled = true;
  accountNote.textContent = accountMode === 'signup' ? 'Creating your account…' : 'Signing you in…';
  const result = accountMode === 'signup'
    ? await db.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: `${window.location.origin}/dashboard.html` } })
    : await db.auth.signInWithPassword({ email, password });
  button.disabled = false;
  if (result.error) { accountNote.textContent = result.error.message; return; }
  if (accountMode === 'signup' && !result.data.session) {
    accountNote.textContent = 'Account created — check your inbox to confirm your email, then return here to sign in.';
    return;
  }
  window.location.href = 'dashboard.html';
});

updatePreview();
