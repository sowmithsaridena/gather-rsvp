const db = window.gatherClient;
let currentUser;
let events = [];
let selectedEventId;

const setText = (selector, value) => document.querySelector(selector).textContent = value;
const prettyTheme = value => ({ 'indian-wedding': 'Indian wedding', 'halloween-party': 'Halloween night', 'baby-birthday': "Baby's birthday", 'baby-shower': 'Baby shower' })[value] || 'Gathering';
const dateText = value => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Date to be announced';
const responseClass = value => value === 'attending' ? 'accepted' : value === 'maybe' ? 'maybe' : 'waiting';
const responseText = value => value === 'attending' ? 'Accepted' : value === 'not_attending' ? 'Declined' : value === 'maybe' ? 'Maybe' : 'Awaiting';

function selectedEvent() { return events.find(event => event.id === selectedEventId); }

function normalizeGuests(event) {
  return (event.guests || []).map(guest => ({ ...guest, rsvp: guest.rsvps?.[0] || null }));
}

function renderEvent() {
  const event = selectedEvent();
  const switcher = document.querySelector('.event-switcher');
  if (!event) {
    switcher.innerHTML = '<a class="add-event" href="index.html#create" aria-label="Create an event">+</a>';
    setText('#event-title', 'Your first gathering starts here.');
    setText('#event-theme', 'No events yet');
    setText('#event-info', 'Create an invitation to begin collecting RSVPs.');
    ['#reply-number', '#guest-number', '#accepted-count', '#maybe-count', '#awaiting-count', '#meal-count', '#unreplied-count'].forEach(id => setText(id, '0'));
    document.querySelector('#guest-rows').innerHTML = '<div class="table-row"><span class="guest-name">No guests yet<small>Create an event, then invite your people.</small></span><span>—</span><span>—</span></div>';
    return;
  }

  const guests = normalizeGuests(event);
  const answered = guests.filter(guest => guest.rsvp);
  const accepted = guests.filter(guest => guest.rsvp?.response === 'attending');
  const maybe = guests.filter(guest => guest.rsvp?.response === 'maybe');
  const waiting = guests.filter(guest => !guest.rsvp);
  const mealNotes = guests.filter(guest => guest.rsvp?.dietary_notes).length;
  switcher.innerHTML = `${events.map(item => `<button class="event-chip ${item.id === event.id ? 'selected' : ''}" data-event-id="${item.id}"><span class="mini-mark">✦</span><p><strong>${item.title}</strong><small>${dateText(item.starts_at)}</small></p><b>${item.guests?.length ? Math.round((item.guests.filter(g => g.rsvps?.length).length / item.guests.length) * 100) : 0}%</b></button>`).join('')}<a class="add-event" href="index.html#create" aria-label="Create an event">+</a>`;
  document.querySelectorAll('[data-event-id]').forEach(button => button.addEventListener('click', () => { selectedEventId = button.dataset.eventId; renderEvent(); }));
  setText('#event-theme', prettyTheme(event.theme));
  setText('#event-title', event.title);
  setText('#event-info', `${dateText(event.starts_at)} · ${event.location_name || 'Location to be announced'}`);
  setText('#deadline', event.starts_at ? dateText(event.starts_at) : 'TBA');
  setText('#deadline-detail', 'RSVPs update live');
  setText('#reply-number', answered.length);
  setText('#guest-number', guests.length);
  setText('#accepted-count', accepted.length);
  setText('#maybe-count', maybe.length);
  setText('#awaiting-count', waiting.length);
  setText('#meal-count', mealNotes);
  setText('#unreplied-count', waiting.length);
  document.querySelector('#progress-line').style.width = `${guests.length ? Math.round(answered.length / guests.length * 100) : 0}%`;
  document.querySelector('#guest-rows').innerHTML = guests.length ? guests.map(guest => {
    const response = responseText(guest.rsvp?.response);
    const detail = guest.rsvp?.dietary_notes || guest.rsvp?.note_to_host || (guest.rsvp ? `Party of ${guest.rsvp.party_size}` : 'Invitation not sent');
    return `<div class="table-row"><span class="guest-name">${guest.name}<small>${guest.email}</small></span><span><b class="rsvp-pill ${responseClass(guest.rsvp?.response)}">${response}</b></span><span>${detail}</span></div>`;
  }).join('') : '<div class="table-row"><span class="guest-name">No guests yet<small>Guest importing is the next step.</small></span><span>—</span><span>—</span></div>';
  setText('#invite-name', event.title);
  setText('#invite-info', dateText(event.starts_at).toUpperCase());
  setText('#invite-location', (event.location_name || 'LOCATION TO BE ANNOUNCED').toUpperCase());
}

async function loadEvents() {
  const { data, error } = await db.from('events').select('id, title, theme, starts_at, location_name, invite_code, guests(id, name, email, rsvps(id, response, party_size, dietary_notes, note_to_host, responded_at))').order('created_at', { ascending: false });
  if (error) throw error;
  events = data || [];
  selectedEventId = events.some(event => event.id === selectedEventId) ? selectedEventId : events[0]?.id;
  renderEvent();
}

async function savePendingEvent() {
  const pending = localStorage.getItem('gather-event-draft');
  if (!pending) return;
  const draft = JSON.parse(pending);
  const { error } = await db.from('events').insert({ ...draft, host_id: currentUser.id });
  if (error) throw error;
  localStorage.removeItem('gather-event-draft');
}

async function bootstrap() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { window.location.href = 'index.html'; return; }
  currentUser = user;
  const name = user.user_metadata?.display_name || user.email.split('@')[0];
  const first = name.split(' ')[0];
  setText('#host-name-display', name);
  setText('#host-first-name', `${first}.`);
  setText('#host-initial', first.charAt(0).toUpperCase());
  try { await savePendingEvent(); await loadEvents(); }
  catch (error) { console.error(error); setText('#event-title', 'We could not load your events.'); }
}

document.querySelector('#copy-link').addEventListener('click', async event => {
  const current = selectedEvent();
  if (!current) return;
  await navigator.clipboard?.writeText(`${window.location.origin}/?event=${current.invite_code}`);
  event.currentTarget.textContent = 'Link copied!';
  setTimeout(() => event.currentTarget.textContent = 'Copy guest link', 1600);
});
const reminder = document.querySelector('#reminder-dialog');
document.querySelector('#open-reminder').addEventListener('click', () => {
  const waiting = normalizeGuests(selectedEvent() || {}).filter(guest => !guest.rsvp).length;
  setText('#reminder-heading', `Nudge ${waiting} guests kindly.`);
  reminder.showModal();
});
document.querySelector('#schedule-reminder').addEventListener('click', async () => {
  const event = selectedEvent();
  const guests = normalizeGuests(event || {}).filter(guest => !guest.rsvp);
  if (!guests.length) { setText('#schedule-status', 'There are no unanswered invitations to remind.'); return; }
  const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await db.from('reminders').insert(guests.map(guest => ({ guest_id: guest.id, scheduled_for: scheduledFor })));
  setText('#schedule-status', error ? error.message : `Reminder scheduled for ${guests.length} guest${guests.length === 1 ? '' : 's'}.`);
});
document.querySelector('#thank-you').addEventListener('click', event => { event.currentTarget.textContent = 'Coming soon'; });
document.querySelector('#view-invite').addEventListener('click', () => document.querySelector('#invite-dialog').showModal());
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelector('#show-all-guests').addEventListener('click', () => document.querySelector('#guests').scrollIntoView({ behavior: 'smooth' }));
document.querySelector('#sign-out').addEventListener('click', async () => { await db.auth.signOut(); window.location.href = 'index.html'; });

bootstrap();
