const host = JSON.parse(localStorage.getItem('gather-host') || '{"name":"Meera Patel","email":"meera@example.com"}');
const events = {
  wedding: { theme:'Indian wedding', title:'Aarav & Meera', info:'Sunday, October 18 · The Garden House, Sonoma', deadline:'Sep 27', deadlineDetail:'in 28 days', replied:84, total:100, accepted:67, maybe:7, awaiting:16, meals:19, guests:[['Priya Shah','priya@example.com','Accepted','Vegetarian meal'],['Jordan Lee','jordan@example.com','Accepted','+1, no meal note'],['Nina Patel','nina@example.com','Maybe','Will confirm Friday'],['Ethan Brooks','ethan@example.com','Awaiting','Invitation sent Sep 1']] },
  halloween: { theme:'Halloween night', title:"Mara's haunted house", info:'Saturday, October 31 · 13 Moonlight Lane, Oakland', deadline:'Oct 22', deadlineDetail:'in 53 days', replied:42, total:64, accepted:21, maybe:6, awaiting:37, meals:0, guests:[['Noah Kim','noah@example.com','Accepted','Coming in costume'],['Lena Ortiz','lena@example.com','Maybe','Checking childcare'],['Amir Jones','amir@example.com','Awaiting','Invitation sent Sep 2'],['Rory Chen','rory@example.com','Accepted','+1']] }
};
let selected = 'wedding';
const setText = (id, value) => document.querySelector(id).textContent = value;
function responseClass(response){return response === 'Accepted' ? 'accepted' : response === 'Maybe' ? 'maybe' : 'waiting';}
function renderEvent(){
  const event = events[selected];
  document.querySelectorAll('.event-chip').forEach(button => button.classList.toggle('selected', button.dataset.event === selected));
  setText('#event-theme', event.theme); setText('#event-title', event.title); setText('#event-info', event.info); setText('#deadline', event.deadline); setText('#deadline-detail', event.deadlineDetail); setText('#reply-number', event.replied); setText('#guest-number', event.total); setText('#accepted-count', event.accepted); setText('#maybe-count', event.maybe); setText('#awaiting-count', event.awaiting); setText('#meal-count', event.meals); setText('#unreplied-count', event.awaiting);
  document.querySelector('#progress-line').style.width = `${Math.round(event.replied / event.total * 100)}%`;
  document.querySelector('#guest-rows').innerHTML = event.guests.map(([name,email,response,detail]) => `<div class="table-row"><span class="guest-name">${name}<small>${email}</small></span><span><b class="rsvp-pill ${responseClass(response)}">${response}</b></span><span>${detail}</span></div>`).join('');
  setText('#invite-name', event.title); setText('#invite-info', event.info.split(' · ')[0].toUpperCase()); setText('#invite-location', (event.info.split(' · ')[1] || '').toUpperCase());
}
const firstName = host.name.split(' ')[0]; setText('#host-name-display', host.name); setText('#host-first-name', `${firstName}.`); setText('#host-initial', firstName.charAt(0).toUpperCase());
document.querySelectorAll('.event-chip').forEach(button => button.addEventListener('click', () => { selected = button.dataset.event; renderEvent(); }));
document.querySelector('#copy-link').addEventListener('click', event => { navigator.clipboard?.writeText(`https://gather.page/${selected}/rsvp`); event.currentTarget.textContent = 'Link copied!'; setTimeout(() => event.currentTarget.textContent = 'Copy guest link', 1600); });
const reminder = document.querySelector('#reminder-dialog');
document.querySelector('#open-reminder').addEventListener('click', () => { setText('#reminder-heading', `Nudge ${events[selected].awaiting} guests kindly.`); reminder.showModal(); });
document.querySelector('#thank-you').addEventListener('click', event => { event.currentTarget.textContent = 'Draft created!'; setTimeout(() => event.currentTarget.textContent = 'Draft note →', 1700); });
document.querySelector('#schedule-reminder').addEventListener('click', () => { setText('#schedule-status', `Reminder scheduled for ${document.querySelector('#reminder-date').value}.`); });
document.querySelector('#view-invite').addEventListener('click', () => document.querySelector('#invite-dialog').showModal());
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelector('#show-all-guests').addEventListener('click', () => document.querySelector('#guests').scrollIntoView({behavior:'smooth'}));
document.querySelector('#sign-out').addEventListener('click', () => { localStorage.removeItem('gather-host'); window.location.href = 'index.html'; });
renderEvent();
