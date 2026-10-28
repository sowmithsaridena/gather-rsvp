const db = window.gatherClient;
const inviteCode = new URLSearchParams(window.location.search).get('event');
const form = document.querySelector('#rsvp-form');
const status = document.querySelector('#form-status');

const themeLabel = value => ({
  'indian-wedding': 'with love & joy',
  'halloween-party': 'come in costume',
  'baby-birthday': 'a very happy celebration',
  'baby-shower': 'a little love is on the way'
})[value] || 'a gathering to remember';

async function loadInvite() {
  if (!inviteCode) throw new Error('This RSVP link is incomplete. Please ask your host to send it again.');
  const { data, error } = await db.rpc('get_public_invite', { p_invite_code: inviteCode });
  if (error) throw error;
  const invite = data?.[0];
  if (!invite) throw new Error('We could not find this invitation.');
  document.title = `RSVP to ${invite.title} — Gather`;
  document.querySelector('#event-title').textContent = invite.title;
  document.querySelector('#invite-theme').textContent = themeLabel(invite.theme);
  const date = invite.starts_at ? new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(new Date(invite.starts_at)) : 'Date to be announced';
  document.querySelector('#event-detail').textContent = `${date} · ${invite.location_name || 'Location to be announced'}`;
  document.querySelector('#host-message').textContent = invite.host_message || '';
  form.hidden = false;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = 'Saving your RSVP…';
  const response = new FormData(form).get('response');
  const { error } = await db.rpc('submit_public_rsvp', {
    p_invite_code: inviteCode,
    p_name: document.querySelector('#guest-name').value,
    p_email: document.querySelector('#guest-email').value,
    p_response: response,
    p_party_size: Number(document.querySelector('#party-size').value),
    p_dietary_notes: document.querySelector('#dietary-notes').value,
    p_note_to_host: document.querySelector('#note-to-host').value
  });
  button.disabled = false;
  if (error) { status.textContent = error.message; return; }
  form.reset();
  status.textContent = 'Thank you — your response has been sent to your host.';
});

loadInvite().catch(error => {
  document.querySelector('#event-title').textContent = 'Invitation unavailable';
  document.querySelector('#event-detail').textContent = error.message;
});
