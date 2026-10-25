// 04 Before you land · 05 Landing and your driver · 06 Walking to the bay
// 07 Meet, board and ride · 08 Arriving home and getting help
// One live trip in the store moves through phases; openTrip() always lands on the right screen.

import * as store from './store.js';
import * as router from './router.js';
import { icon, ROUTE_SVG } from './icons.js';
import {
  el, rupees, button, iconButton, link, header, screen, actionBar, card, iconCircle, row, badge, wipBadge,
  spinner, textField, checkbox, toggle, chipGroup, illustration, sheet, toast, comingSoon, announce,
  dialog, pushBanner, simulate, avatar, plate, systemAlert,
} from './components.js';
import { flightStatusBadge } from './screens.js';

const { data } = store;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ═══════════════════════ Phase routing ═══════════════════════ */

const PHASE_ROUTE = {
  scheduled: 'ride',
  landed: 'welcomeMumbai',
  hold: 'bagsHold',
  finding: 'finding',
  driver: 'driver',
  noCars: 'noCars',
  walking: 'walk',
  meet: 'meet',
  onTrip: 'onTrip',
  sos: 'sos',
  arrived: 'arrived',
  rate: 'rate',
  assigned: 'yourCar',
  queueEmpty: 'queueEmpty',
};

export function openTrip() {
  const t = store.get().trip;
  if (!t) { router.reset('home'); return; }
  router.go(PHASE_ROUTE[t.phase] || 'ride', {});
}

// Move the trip to a new phase and show it with Home underneath (so Back goes Home)
export function toPhase(phase, params = {}, transition = 'forward') {
  store.patchTrip({ phase });
  router.resetTo([{ name: 'home' }, { name: PHASE_ROUTE[phase], params }], { transition });
}

function trip() {
  return store.get().trip;
}

// Everything a live screen needs, for booked and instant trips alike
function info(t = trip()) {
  const f = t.flightKey ? store.findFlight(t.flightKey) : null;
  const d = store.driver(t.driverId);
  const bayNo = t.bay || (f ? store.bay(f.terminal).number : data.QUEUE.bay);
  const walk = data.WALKS[bayNo] || data.WALKS[12];
  const r = store.ride(t.rideId) || store.ride('cab');
  return {
    f,
    d,
    r,
    bayNo,
    bayLabel: t.instant ? `Queue Bay ${data.QUEUE.bay}` : `Bay ${bayNo}`,
    walk,
    belt: f ? f.belt : null,
    drop: store.address(t.dropId),
    fare: t.fare,
    bags: t.bags || { cabin: 1, checkin: 1, people: 1 },
    isPool: r.id === 'pool' && t.pool !== 'solo',
    landsAt: f ? (t.delayed ? '11:20 pm' : (f.status === 'delayed' ? f.delayedTo : f.arrivalShort)) : '',
    contact: store.get().contacts.find((c) => c.id === t.sharingWith) || null,
  };
}

function bagsText(b) {
  return `${b.cabin} cabin, ${b.checkin} check-in`;
}

function dropName(addr) {
  if (!addr) return 'your drop';
  const home = store.get().home;
  return home && home.addressId === addr.id ? home.label : addr.short;
}

function methodLabel(id) {
  const m = data.PAYMENT_METHODS.find((p) => p.id === id) || data.PAYMENT_METHODS[0];
  return `${m.label} · ${m.detail}`;
}

function kv(pairs) {
  return el('dl', { class: 'kv' }, pairs.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', {}, v)]));
}

function banner({ tone = 'info', iconName, title, text, action = null }) {
  return el('div', { class: `live-banner live-banner--${tone}`, role: 'status' }, [
    el('span', { class: 'live-banner__icon' }, icon(iconName, { size: 'sm', fill: true })),
    el('div', { class: 'live-banner__body' }, [el('p', { class: 'live-banner__title', text: title }), text ? el('p', { class: 'live-banner__text', text }) : null, action]),
  ]);
}

function cleanup(node, ...fns) {
  node._cleanup = () => fns.forEach((f) => f());
}

/* ═══════════════════════ Guarantee (B3g) — also used by booking ═══════════════════════ */

export function guaranteeSheet() {
  const sh = sheet({
    title: 'How the ride guarantee works',
    body: [el('div', { class: 'rule-list' }, data.GUARANTEE_RULES.map((r) => row({ lead: iconCircle(r.icon, { tone: 'success' }), title: r.title, sub: r.text })))],
    foot: [button({ label: 'Got it', variant: 'secondary', block: true, onClick: () => sh.close() })],
  });
}

/* ═══════════════════════ B4l Locking your ride ═══════════════════════ */

export function locking() {
  const node = el('main', { class: 'screen screen--center', 'aria-label': 'Locking your ride' }, [
    el('div', { class: 'center-state' }, [
      el('span', { class: 'lock-spin', 'aria-hidden': 'true' }, [spinner(true), icon('lock', { fill: true })]),
      el('h1', { class: 'screen__title', text: 'Locking your ride' }),
      el('p', { class: 'screen__lead', text: 'Confirming your payment. Please keep the app open.' }),
    ]),
  ]);
  const t = setTimeout(() => router.resetTo([{ name: 'home' }, { name: 'locked' }], { transition: 'fade' }), 1600);
  cleanup(node, () => clearTimeout(t));
  return node;
}

/* ═══════════════════════ B5 Ride locked ═══════════════════════ */

export function locked() {
  const t = trip();
  if (!t) return gone();
  const i = info(t);
  return screen({
    name: 'locked',
    label: 'Ride locked',
    head: header({ onBack: () => router.backTo('home') }),
    body: [
      el('div', { class: 'center-state center-state--top stagger' }, [
        el('span', { class: 'success-ring', 'aria-hidden': 'true' }, icon('lock', { size: 'lg', fill: true })),
        el('h1', { class: 'screen__title screen__title--display', text: 'Your ride is locked' }),
        el('p', { class: 'screen__lead', text: 'We assign your driver when you land and you tap “I have my bags”. Relax on the flight.' }),
        card(kv([
          ['Flight', `${i.f.number} · ${i.landsAt}`],
          ['Pickup', `${i.f.terminal} · ${i.bayLabel}`],
          ['Bags', bagsText(i.bags)],
          ['Paid', `${rupees(t.fare)}, all-in`],
        ]), { cls: 'kv-card kv-card--full' }),
        card(row({ lead: iconCircle('share'), title: 'Let someone know', sub: 'Share your flight and ride with a trusted contact', trail: icon('chevron_right'), onClick: () => shareSheet() }), { cls: 'share-card share-card--full' }),
      ]),
    ],
    foot: actionBar(button({ label: 'See my ride', block: true, onClick: () => router.go('ride', {}, { replace: true }) })),
  });
}

function gone() {
  setTimeout(() => router.reset('home'), 0);
  return el('main', { class: 'screen' });
}

/* ═══════════════════════ SH1 / SH2 Share ═══════════════════════ */

export function shareSheet() {
  const t = trip();
  const s = store.get();
  if (t && t.sharingWith) { sharingOnSheet(); return; }
  let pick = s.contacts[0] ? s.contacts[0].id : null;
  let always = s.autoShare;

  if (!s.contacts.length) {
    const sh = sheet({
      title: 'Share your ride',
      body: [el('p', { class: 'sheet-text', text: 'Add someone you trust. They see your flight, driver, car and live trip until you reach home.' })],
      foot: [button({ label: 'Add a trusted contact', block: true, onClick: () => { sh.close(); router.go('contacts'); } })],
    });
    return;
  }

  const name = () => s.contacts.find((c) => c.id === pick).name.split(' ')[0];
  const alwaysLabel = el('p', { class: 'row__title' });
  const shareBtn = button({ label: '', block: true, onClick: () => {
    store.set({ autoShare: always });
    if (t) store.patchTrip({ sharingWith: pick });
    sh.close();
    toast(`Sharing with ${name()}. They get a text with a live link.`, { type: 'success', iconName: 'share' });
    if (t) setTimeout(sharingOnSheet, 300);
  } });
  const sync = () => { alwaysLabel.textContent = `Share every airport ride with ${name()}`; shareBtn.setLabel(`Share with ${name()}`); };

  const sh = sheet({
    title: 'Share your ride',
    sub: 'They will see your flight, driver, car and live trip. The link stops when you reach home.',
    body: [
      el('div', { class: 'contact-pick', role: 'radiogroup', 'aria-label': 'Contacts' }, s.contacts.map((c) => {
        const b = el('button', { type: 'button', class: 'contact-pick__item', role: 'radio', 'aria-checked': String(c.id === pick) }, [
          avatar(c.name, { size: 'sm', tone: 'accent' }),
          el('span', { class: 'row__body' }, [el('span', { class: 'row__title', text: c.name }), el('span', { class: 'row__sub', text: c.phone })]),
          el('span', { class: 'radio-row__dot', 'aria-hidden': 'true' }),
        ]);
        b.addEventListener('click', () => {
          pick = c.id;
          b.parentElement.querySelectorAll('[role=radio]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
          sync();
        });
        return b;
      })),
      row({ lead: iconCircle('person_add'), title: 'Add from contacts', cls: 'list-row', onClick: () => { sh.close(); router.go('contacts'); } }),
      card(el('div', { class: 'toggle-row' }, [
        el('div', { class: 'row__body' }, [alwaysLabel, el('p', { class: 'row__sub', text: 'You can turn this off in Profile.' })]),
        toggle({ checked: always, label: 'Share every airport ride', onChange: (v) => { always = v; } }),
      ]), { sunken: true, cls: 'tip-card' }),
    ],
    foot: [shareBtn],
  });
  sync();
}

function sharingOnSheet() {
  const i = info();
  if (!i.contact) return;
  const first = i.contact.name.split(' ')[0];
  const sh = sheet({
    title: `${first} will get updates`,
    body: [el('ul', { class: 'update-list' }, [
      ['flight_land', 'When you land'],
      ['badge', 'When your driver is assigned', 'Name, photo, car and plate'],
      ['share_location', 'Live trip link'],
      ['home', 'When you reach home'],
    ].map(([ic, t, sub]) => el('li', {}, row({ lead: iconCircle(ic, { tone: 'success' }), title: t, sub }))))],
    foot: [
      button({ label: 'Done', block: true, onClick: () => sh.close() }),
      button({ label: 'Stop sharing', variant: 'ghost', block: true, onClick: () => { store.patchTrip({ sharingWith: null }); sh.close(); toast(`Stopped sharing with ${first}`); router.refresh(); } }),
    ],
  });
}

/* ═══════════════════════ R4 Your ride (scheduled, with live states) ═══════════════════════ */

export function ride(params = {}) {
  const t = trip();
  if (!t) return gone();
  if (t.phase && t.phase !== 'scheduled') { setTimeout(openTrip, 0); return el('main', { class: 'screen' }); }
  const i = info(t);
  const s = store.get();
  let minsAgo = 2;
  const updated = el('span', { class: 'flight-hero__updated', text: `Live flight status · updated ${minsAgo} min ago` });
  const timers = [
    setInterval(() => { minsAgo += 1; updated.textContent = `Live flight status · updated ${minsAgo} min ago`; }, 20000),
    setInterval(() => {
      updated.classList.add('is-refreshing');
      updated.textContent = 'Live flight status · checking…';
      setTimeout(() => { minsAgo = 0; updated.classList.remove('is-refreshing'); updated.textContent = 'Live flight status · updated just now'; }, 900);
    }, 45000),
  ];

  const delayed = t.delayed || i.f.status === 'delayed';
  const statusBadge = t.delayed ? badge('Delayed 40 min', 'warning') : flightStatusBadge(i.f);

  const banners = [];
  if (t.delayed) banners.push(banner({ tone: 'warning', iconName: 'schedule', title: `Delayed to ${i.landsAt}. Your ride moved.`, text: 'Fare unchanged. No action needed.' }));
  if (t.rideId === 'pool' && t.pool === 'joined') {
    const others = s.poolWomenOnly ? data.POOL.womenRiders : data.POOL.riders;
    banners.push(banner({ tone: 'success', iconName: 'groups', title: `Pool joined · ${others.length + 1} of ${others.length + 1}`, text: `You will see ${others.map((o) => o.name).join(' and ')} at the bay. Drop order: ${others.map((o) => o.name).join(', ')}, then you.` }));
  }
  if (t.rideId === 'pool' && t.pool === 'solo') banners.push(banner({ tone: 'info', iconName: 'local_taxi', title: 'No pool formed. Switched to solo.', text: `You still pay ${rupees(t.fare)}. Same bay, same time.` }));

  const alertsOn = s.permissions.notifications === 'granted';
  const steps = [
    { title: 'Ride locked', sub: `${rupees(t.fare)} paid, all-in`, done: true },
    { title: 'Plane lands', sub: alertsOn ? 'We will notify you' : 'Alerts are off, so open the app when you land' },
    { title: 'Tap “I have my bags”', sub: 'Your driver is assigned then' },
    { title: `Walk to ${i.bayLabel}`, sub: `About ${i.walk.mins} min from belt ${i.belt}` },
    { title: 'Ride home', sub: 'Fare stays locked' },
  ];

  const sims = [
    { label: 'Plane lands', icon: 'flight_land', onClick: land },
    !t.delayed ? { label: 'Flight delayed', icon: 'schedule', onClick: delay } : null,
    { label: 'Flight cancelled', icon: 'cancel', onClick: () => { store.patchTrip({ cancelReason: 'flight' }); router.resetTo([{ name: 'home' }, { name: 'flightCancelled' }], { transition: 'fade' }); } },
    t.rideId === 'pool' && t.pool === 'joined' ? { label: 'Pool does not fill', icon: 'group_remove', onClick: () => { store.patchTrip({ pool: 'solo' }); router.refresh(); toast('No pool this time. You are in a solo cab, same fare.'); } } : null,
  ].filter(Boolean);

  function delay() {
    pushBanner({ title: `${i.f.number} delayed to 11:20 pm`, text: 'Your ride has moved to the new time. Fare unchanged.', onTap: () => router.refresh() });
    store.patchTrip({ delayed: true });
    router.refresh();
  }

  function land() {
    pushBanner({ title: 'Welcome to Mumbai', text: `${i.f.number} has landed at ${i.f.terminal}. Tap “I have my bags” when you have them.`, onTap: () => {} });
    store.patchTrip({ landedAt: Date.now() });
    toPhase('landed', {}, 'fade');
  }

  const node = screen({
    name: 'ride',
    label: 'Your ride',
    head: header({ title: 'Your ride', onBack: () => router.backTo('home'), right: simulate(sims) }),
    body: [
      el('div', { class: 'ride stagger' }, [
        el('section', { class: 'flight-hero', 'aria-label': 'Flight status' }, [
          el('div', { class: 'flight-hero__top' }, [
            el('span', { class: 'flight-hero__flight' }, [icon('flight', { size: 'xs' }), `${i.f.number} · ${i.f.from} to ${i.f.to}`]),
            statusBadge,
          ]),
          el('p', { class: 'flight-hero__title', text: `Lands ${i.landsAt} at ${i.f.terminal}` }),
          el('p', { class: 'flight-hero__meta' }, [el('span', { class: 'live-dot', 'aria-hidden': 'true' }), updated]),
        ]),
        ...banners,
        el('ol', { class: 'timeline', 'aria-label': 'What happens next' }, steps.map((st, idx) => el('li', {
          class: ['timeline__step', st.done ? 'is-done' : '', idx === 1 ? 'is-next' : ''].filter(Boolean).join(' '),
          'aria-current': idx === 1 ? 'step' : null,
        }, [el('span', { class: 'timeline__dot', 'aria-hidden': 'true' }), el('div', {}, [el('p', { class: 'timeline__title', text: st.title }), el('p', { class: 'timeline__sub', text: st.sub })])]))),
        card(kv([
          ['Pickup', `${i.f.terminal} · ${i.bayLabel}`],
          ['Ride', t.rideId === 'pool' ? (t.pool === 'solo' ? 'Cab, solo' : 'Pool, all joined') : `${i.r.name}, solo`],
          ['Drop', dropName(i.drop)],
        ]), { cls: 'kv-card' }),
        i.contact ? el('p', { class: 'paid-line' }, [icon('share', { size: 'sm' }), `Sharing with ${i.contact.name.split(' ')[0]}`]) : null,
        el('div', { class: 'ride__actions' }, [
          button({ label: i.contact ? 'Sharing on' : 'Share trip', variant: 'secondary', iconLeft: i.contact ? 'check' : null, onClick: shareSheet }),
          button({ label: 'Cancel ride', variant: 'secondary', onClick: () => cancelSheet() }),
        ]),
        delayed && !t.delayed ? el('p', { class: 'fine-print', text: 'Your flight was already late when you booked. Your car is timed for the new landing.' }) : null,
      ]),
    ],
  });
  cleanup(node, () => timers.forEach(clearInterval));
  return node;
}

/* ═══════════════════════ R4c Cancel ride → R4cd ═══════════════════════ */

export function cancelSheet({ free = true } = {}) {
  const t = trip();
  let reason = null;
  const fee = free ? 0 : 50;
  const sh = sheet({
    title: 'Cancel this ride?',
    body: [
      banner({ tone: free ? 'success' : 'warning', iconName: free ? 'check_circle' : 'info', title: free ? 'Free to cancel now' : `A ${rupees(fee)} fee applies`, text: free ? `No driver is assigned yet, so you get the full ${rupees(t.fare)} back.` : `Your driver is already on the way. You get ${rupees(t.fare - fee)} back.` }),
      el('p', { class: 'overline overline--section', text: 'What changed? (optional)' }),
      chipGroup({ label: 'Reason', value: null, options: data.CANCEL_REASONS.map((r) => ({ value: r, label: r })), onChange: (v) => { reason = v; } }),
    ],
    foot: [
      button({ label: 'Cancel ride', variant: 'destructive', block: true, onClick: () => { sh.close(); finishCancel({ refund: t.fare - fee, reason }); } }),
      button({ label: 'Keep my ride', variant: 'ghost', block: true, onClick: () => sh.close() }),
    ],
  });
}

function archive(t, extra) {
  const s = store.get();
  const entry = { ...t, ...extra, endedAt: Date.now() };
  store.set({ history: [entry, ...s.history], trip: null });
  return entry;
}

function finishCancel({ refund, reason, noFee = false }) {
  const t = trip();
  const entry = archive(t, { status: 'cancelled', refund, reason });
  router.resetTo([{ name: 'home' }, { name: 'rideCancelled', params: { id: entry.id, refund, method: t.method, noFee } }], { transition: 'fade' });
}

export function rideCancelled(params = {}) {
  return screen({
    name: 'cancelled',
    label: 'Ride cancelled',
    head: header({ onBack: () => router.reset('home', {}, { transition: 'back' }) }),
    body: [
      el('div', { class: 'center-state center-state--top stagger' }, [
        illustration('ride-cancelled.png', 'A parked car with a calm cancelled tag', { width: 200, height: 160, cls: 'state-art' }),
        el('h1', { class: 'screen__title', text: 'Ride cancelled' }),
        el('p', { class: 'screen__lead', text: `${rupees(params.refund)} will be back in your ${params.method === 'upi' || !params.method ? 'UPI account' : 'account'} in 2 to 3 working days.${params.noFee ? ' No fee. The delay was on us.' : ''}` }),
        card(kv([['Refund', rupees(params.refund)], ['To', methodLabel(params.method)], ['Reference', `SF-RF-${String(params.id || '').slice(-5)}`]]), { cls: 'kv-card kv-card--full' }),
      ]),
    ],
    foot: actionBar([
      button({ label: 'Back to home', block: true, onClick: () => router.reset('home', {}, { transition: 'back' }) }),
    ]),
  });
}

/* ═══════════════════════ R4x Flight cancelled ═══════════════════════ */

export function flightCancelled() {
  const t = trip();
  if (!t) return gone();
  const i = info(t);
  const entry = { ...t };
  return screen({
    name: 'flight-cancelled',
    label: 'Flight cancelled',
    head: header({ title: 'Your ride', onBack: () => done('home') }),
    body: [
      el('div', { class: 'center-state center-state--top stagger' }, [
        illustration('flight-cancelled.png', 'A departures board showing a cancelled flight', { width: 200, height: 160, cls: 'state-art' }),
        el('h1', { class: 'screen__title', text: `${i.f.number} was cancelled` }),
        el('p', { class: 'screen__lead', text: `We have cancelled your ride. ${rupees(t.fare)} is on its way back, no fee.` }),
        card(kv([['Refund', rupees(t.fare)], ['To', methodLabel(t.method)], ['Reference', `SF-RF-${t.id.slice(-5)}`]]), { cls: 'kv-card kv-card--full' }),
      ]),
    ],
    foot: actionBar([
      button({ label: 'Add your new flight', block: true, onClick: () => done('home') }),
      button({ label: 'Get help', variant: 'ghost', block: true, onClick: () => done('help') }),
    ]),
  });
  function done(to) {
    archive(entry, { status: 'cancelled', refund: entry.fare, reason: 'Flight cancelled' });
    router.reset(to, {}, { transition: 'back' });
  }
}

/* ═══════════════════════ R5 Welcome to Mumbai ═══════════════════════ */

export function welcomeMumbai() {
  const t = trip();
  if (!t) return gone();
  const i = info(t);
  const landed = new Date(t.landedAt || Date.now());
  const fmt = (d) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase();

  function bagsDelayed() {
    const until = new Date(landed.getTime() + 45 * 60000);
    const sh = sheet({
      title: 'Bags taking a while?',
      body: [
        illustration('bags-waiting.png', 'A suitcase waiting on a baggage belt', { width: 160, height: 120, cls: 'state-art state-art--sm' }),
        el('p', { class: 'sheet-text', text: 'We will hold your car request. Nothing is charged while you wait.' }),
        card(row({ lead: iconCircle('timer'), title: `Landed ${fmt(landed)} · held until ${fmt(until)}`, sub: '45 minutes of free hold' }), { sunken: true, cls: 'tip-card' }),
        el('p', { class: 'fine-print', text: 'Lost bag? Report it at the airline desk next to belt 9 before you leave the hall.' }),
      ],
      foot: [
        button({ label: 'Hold my car request', block: true, onClick: () => { sh.close(); store.patchTrip({ holdStart: Date.now() }); toPhase('hold'); } }),
        button({ label: 'My bags are here', variant: 'ghost', block: true, onClick: () => { sh.close(); toPhase('finding'); } }),
      ],
    });
  }

  return screen({
    name: 'welcome-mumbai',
    label: 'Welcome to Mumbai',
    head: header({ onBack: () => router.backTo('home') }),
    body: [
      el('div', { class: 'stagger' }, [
        el('p', { class: 'overline', text: `${i.f.number} · landed ${fmt(landed)}` }),
        el('h1', { class: 'screen__title screen__title--display', text: 'Welcome to Mumbai' }),
        el('p', { class: 'screen__lead', text: `Collect your bags from belt ${i.belt}. We call your car only when you tap “I have my bags”, so no one waits and no one leaves.` }),
        card(kv([['Pickup', `${i.bayLabel} · about ${i.walk.mins} min walk`], ['Fare', `${rupees(t.fare)}, locked`], ['Bags', bagsText(i.bags)]]), { cls: 'kv-card kv-card--full' }),
        el('h2', { class: 'overline overline--section', text: `On your way to ${i.bayLabel}` }),
        el('ul', { class: 'amenities' }, data.AMENITIES.map((a) => el('li', {}, row({ lead: iconCircle(a.icon), title: a.label, sub: a.dist.replace('belt', `belt ${i.belt}`) })))),
        link({ label: 'Bags delayed?', body: true, iconRight: 'chevron_right', onClick: bagsDelayed }),
      ]),
    ],
    foot: actionBar(el('div', { class: 'pulse-wrap' }, button({ label: 'I have my bags', iconLeft: 'luggage', block: true, onClick: () => toPhase('finding') }))),
  });
}

/* ═══════════════════════ R5h Car request on hold ═══════════════════════ */

export function bagsHold() {
  const t = trip();
  if (!t) return gone();
  const start = t.holdStart || Date.now();
  const used = el('p', { class: 'hold__used' });
  const fill = el('span', { class: 'progress__fill' });
  const paint = () => {
    // 1 real second = 1 prototype minute, starting from 12 min used
    const mins = Math.min(45, 12 + Math.floor((Date.now() - start) / 1000));
    used.textContent = `${mins} of 45 min`;
    fill.style.setProperty('--p', mins / 45);
  };
  paint();
  const timer = setInterval(paint, 1000);

  const node = screen({
    name: 'hold',
    label: 'Car request on hold',
    head: header({ title: 'Waiting for bags', onBack: () => router.backTo('home') }),
    body: [
      el('div', { class: 'center-state center-state--top stagger' }, [
        illustration('bags-waiting.png', 'A suitcase waiting on a baggage belt', { width: 200, height: 150, cls: 'state-art' }),
        el('h1', { class: 'screen__title', text: 'Car request on hold' }),
        el('p', { class: 'screen__lead', text: 'Tap when your bags arrive. We will find your driver then.' }),
        card([
          el('div', { class: 'hold__row' }, [el('p', { class: 'row__title', text: 'Free hold used' }), used]),
          el('span', { class: 'progress', role: 'progressbar', 'aria-label': 'Free hold used' }, fill),
        ], { cls: 'kv-card kv-card--full' }),
        card(row({ lead: el('span', { class: 'tip-icon' }, icon('info')), title: 'Past 45 min?', sub: 'Your ride stays booked and the fare holds. We just ask you to confirm you still need it.' }), { sunken: true, cls: 'tip-card' }),
      ]),
    ],
    foot: actionBar(button({ label: 'I have my bags', iconLeft: 'luggage', block: true, onClick: () => toPhase('finding') })),
  });
  cleanup(node, () => clearInterval(timer));
  return node;
}

/* ═══════════════════════ L1 / L1b Finding your driver ═══════════════════════ */

export function finding(params = {}) {
  const t = trip();
  if (!t) return gone();
  const again = !!params.again;
  let timer = setTimeout(() => {
    store.patchTrip({ driverId: again ? 'imran' : (t.driverId || 'santosh') });
    toPhase('driver', { swapped: again }, 'fade');
  }, 2800);
  const sims = [{ label: 'No cars right now', icon: 'car_crash', onClick: () => { clearTimeout(timer); toPhase('noCars', {}, 'fade'); } }];
  const node = el('main', { class: 'screen screen--center', 'aria-label': 'Finding your driver' }, [
    header({ onBack: () => router.backTo('home'), right: again ? null : simulate(sims) }),
    el('div', { class: 'center-state' }, [
      illustration('finding-driver.png', 'A car pulling out of the airport taxi queue', { width: 200, height: 150, cls: 'state-art' }),
      el('h1', { class: 'screen__title', text: again ? 'Finding another driver' : 'Finding your driver' }),
      el('p', { class: 'screen__lead', text: `Matching the next car in the ${info(t).f ? info(t).f.terminal : 'T2'} queue that fits your bags.` }),
      el('span', { class: 'progress progress--indeterminate', role: 'progressbar', 'aria-label': 'Finding a driver' }, el('span', { class: 'progress__fill' })),
      el('p', { class: 'fine-print', text: 'Usually under a minute' }),
    ]),
  ]);
  cleanup(node, () => clearTimeout(timer));
  return node;
}

/* ═══════════════════════ R6 / R6b / R6c Your driver ═══════════════════════ */

function driverCard(d) {
  return card([
    el('div', { class: 'driver-head' }, [
      avatar(d.name, { size: 'lg' }),
      el('div', { class: 'row__body' }, [
        el('p', { class: 'driver-head__name', text: d.name }),
        el('p', { class: 'row__sub' }, [icon('star', { size: 'xs', fill: true }), ` ${d.rating} rating · ${d.trips} trips`]),
      ]),
    ]),
    el('div', { class: 'driver-car' }, [el('p', { class: 'row__sub', text: d.car }), plate(d.plate)]),
    el('div', { class: 'chips chips--static' }, d.tags.map((tg) => badge(tg, 'brand'))),
  ], { cls: 'driver-card' });
}

function hubRecord(d, line) {
  return card([
    el('p', { class: 'overline', text: 'Hub record' }),
    row({ lead: iconCircle('verified', { tone: 'success' }), title: line || `Checked in at the T2 queue · ${d.checkedIn}`, sub: d.record }),
  ], { cls: 'tip-card tip-card--stack hub-card' });
}

export function driver(params = {}) {
  const t = trip();
  if (!t) return gone();
  const i = info(t);
  const d = i.d;

  function swap() {
    dialog({
      title: 'Choose another driver?',
      text: 'You can do this once. Your place, fare and bay stay the same.',
      actions: [
        { label: 'Choose another driver', onClick: () => { store.patchTrip({ swapUsed: true }); toPhase('finding', { again: true }, 'fade'); } },
        { label: `Keep ${d.first}`, variant: 'ghost' },
      ],
    });
  }

  const shareRow = i.contact
    ? card(row({ lead: iconCircle('share', { tone: 'success' }), title: `Shared with ${i.contact.name.split(' ')[0]}`, sub: 'Name, photo, car and plate', trail: icon('check_circle', { fill: true }) }), { cls: 'share-card' })
    : card(row({ lead: iconCircle('share'), title: store.get().contacts[0] ? `Share with ${store.get().contacts[0].name.split(' ')[0]}` : 'Share with someone you trust', sub: 'Name, photo, car and plate', trail: icon('chevron_right'), onClick: shareSheet }), { cls: 'share-card' });

  return screen({
    name: 'driver',
    label: 'Your driver',
    head: header({ title: params.replaced ? 'Your new driver' : 'Your driver', onBack: () => router.backTo('home') }),
    body: [
      el('div', { class: 'ride stagger' }, [
        params.replaced ? banner({ tone: 'success', iconName: 'verified_user', title: 'New driver, same fare', text: `${rupees(data.GUARANTEE_CREDIT)} credit added for the cancellation` }) : null,
        driverCard(d),
        hubRecord(d),
        card(kv([['Meet at', `${i.bayLabel} · ${i.walk.mins} min walk`], ['Fare', `${rupees(t.fare)}, locked`]]), { cls: 'kv-card' }),
        shareRow,
      ]),
    ],
    foot: actionBar([
      button({ label: `Walk to ${i.bayLabel}`, iconLeft: 'directions_walk', block: true, onClick: () => { store.patchTrip({ walkState: 'walking', walkStart: Date.now() }); toPhase('walking'); } }),
      !t.swapUsed && !params.replaced ? button({ label: 'Choose another driver', variant: 'ghost', block: true, onClick: swap }) : null,
    ]),
  });
}

/* ═══════════════════════ R6e No cars right now ═══════════════════════ */

export function noCars() {
  const t = trip();
  if (!t) return gone();
  const i = info(t);
  return screen({
    name: 'no-cars',
    label: 'No cars right now',
    head: header({ title: 'Your ride', onBack: () => router.backTo('home') }),
    body: [
      el('div', { class: 'stagger' }, [
        illustration('no-cars-queue.png', 'An empty taxi queue lane', { width: 200, height: 150, cls: 'state-art' }),
        el('h1', { class: 'screen__title', text: `No cars in the ${i.f ? i.f.terminal : 'T2'} queue right now` }),
        el('p', { class: 'screen__lead', text: 'This is rare. Here is what we know.' }),
        card(kv([['Next car expected', 'about 12 min'], ['Cars on the way to T2', '4'], ['Your fare', `${rupees(t.fare)}, unchanged`]]), { cls: 'kv-card kv-card--full' }),
        card(row({ lead: iconCircle('shield_person', { tone: 'success' }), title: 'Wait at the safe waiting point', sub: `Lit and staffed, next to ${i.bayLabel} · ${i.walk.mins} min walk` }), { cls: 'share-card' }),
      ]),
    ],
    foot: actionBar([
      button({ label: 'Keep waiting', block: true, onClick: () => { toast('We will match the first car that arrives.', { iconName: 'schedule' }); toPhase('finding', {}, 'fade'); } }),
      button({
        label: 'Cancel and get refund',
        variant: 'ghost',
        block: true,
        onClick: () => dialog({
          title: `Cancel and get ${rupees(t.fare)} back?`,
          text: 'No fee. The delay is on us, not you.',
          actions: [
            { label: 'Cancel and refund', variant: 'destructive', onClick: () => finishCancel({ refund: t.fare, reason: 'No cars', noFee: true }) },
            { label: 'Keep waiting', variant: 'ghost' },
          ],
        }),
      }),
    ]),
  });
}

/* ═══════════════════════ R7 Walk to the bay (+ all its states) ═══════════════════════ */

export function walk() {
  const t = trip();
  if (!t) return gone();
  const i = info(t);
  const d = i.d;
  const state = t.walkState || 'walking';
  const timers = [];

  const statusText = {
    walking: 'On the way · 3 min',
    atBay: `At ${i.bayLabel}`,
    paidWait: `At ${i.bayLabel}`,
    noSignal: 'Last seen · 2 min ago',
    cannotFind: `At ${i.bayLabel}`,
  }[state];

  function setState(next, patch = {}) {
    store.patchTrip({ walkState: next, ...patch });
    router.refresh();
  }

  // Banner per state
  let stateBanner = null;
  if (state === 'atBay') {
    const left = el('span', { class: 'countdown' });
    const until = t.freeUntil || (Date.now() + 4 * 60000);
    if (!t.freeUntil) store.patchTrip({ freeUntil: until });
    const paint = () => {
      const sec = Math.max(0, Math.round((until - Date.now()) / 1000));
      left.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
      if (sec === 0 && !left.dataset.done) { left.dataset.done = '1'; setTimeout(() => setState('paidWait', { paidSince: until }), 0); }
    };
    paint();
    timers.push(setInterval(paint, 1000));
    stateBanner = el('div', { class: 'live-banner live-banner--success live-banner--count', role: 'status' }, [
      el('div', { class: 'live-banner__body' }, [
        el('p', { class: 'live-banner__title', text: `${d.first} is at ${i.bayLabel}` }),
        el('p', { class: 'live-banner__text', text: 'Free waiting left. Take your time.' }),
      ]),
      left,
    ]);
  } else if (state === 'paidWait') {
    const since = new Date(t.paidSince || Date.now()).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    stateBanner = banner({ tone: 'warning', iconName: 'payments', title: 'Free waiting is over', text: `₹2 per min since ${since}, paid to ${d.first} from your app balance. Never in cash.` });
  } else if (state === 'noSignal') {
    stateBanner = banner({ tone: 'info', iconName: 'signal_cellular_off', title: 'No signal down here', text: 'Directions, car and plate are saved on your phone. Keep walking, we will reconnect.', action: link({ label: 'Signal is back', onClick: () => setState('walking') }) });
  } else if (state === 'cannotFind') {
    stateBanner = banner({ tone: 'warning', iconName: 'person_search', title: `${d.first} cannot see you`, text: 'Send a photo of where you are standing, or call him.', action: link({ label: 'Send a photo', onClick: photoSheet }) });
  }
  if (t.bayChanged && state === 'walking') {
    stateBanner = banner({ tone: 'warning', iconName: 'swap_horiz', title: `Bay changed to Bay ${i.bayNo}`, text: `Bay 12 is blocked. ${d.first} has the same update.` });
  }

  // Driver shows up at the bay on their own a little while after you start walking
  if (state === 'walking' && !t.bayChanged) {
    timers.push(setTimeout(() => {
      pushBanner({ title: `${d.first} is at ${i.bayLabel}`, text: '4 min of free waiting starts now.', onTap: () => {} });
      setState('atBay');
    }, 14000));
  }

  const steps = state === 'atBay' || state === 'paidWait' || state === 'cannotFind' ? i.walk.steps.slice(-2) : i.walk.steps;

  function callSheet() {
    const sh = sheet({
      title: `Call ${d.first}`,
      sub: 'Calls go through Safarnaama. Neither of you sees the other’s number.',
      body: [card(row({ lead: avatar(d.name, { size: 'sm' }), title: d.name, sub: d.plate }), { cls: 'tip-card' })],
      foot: [
        button({ label: 'Call', iconLeft: 'call', block: true, onClick: () => { sh.close(); toast(`Connecting you to ${d.first} on a masked line…`, { iconName: 'call' }); } }),
        button({ label: 'Cancel', variant: 'ghost', block: true, onClick: () => sh.close() }),
      ],
    });
  }

  function photoSheet() {
    const sh = sheet({
      title: `Show ${d.first} where you are`,
      sub: 'Tip: include a pillar number or a sign.',
      body: [el('div', { class: 'camera-mock', role: 'img', 'aria-label': 'Camera preview' }, [icon('photo_camera', { size: 'xl' }), el('span', { text: 'Pillar C4 · Bay 12 sign' })])],
      foot: [
        button({ label: 'Take and send photo', iconLeft: 'photo_camera', block: true, onClick: async (e) => {
          const b = e.currentTarget;
          b.setLoading(true, 'Sending');
          await wait(900);
          sh.close();
          toast(`Photo sent to ${d.first}. He is walking over.`, { type: 'success' });
          if (state === 'cannotFind') setState('atBay');
        } }),
        button({ label: 'Cancel', variant: 'ghost', block: true, onClick: () => sh.close() }),
      ],
    });
  }

  function driverCancels() {
    const sh = sheet({
      title: `${d.first} cancelled`,
      sub: `That is on him, not you. We have added ${rupees(data.GUARANTEE_CREDIT)} credit.`,
      dismissible: false,
      body: [card(kv([
        ['New driver', 'Imran · MH 03 CK 5521'],
        ['Fare', `${rupees(t.fare)}, same`],
        ['Bay', `${i.bayLabel}, same`],
        ['Credit added', rupees(data.GUARANTEE_CREDIT)],
      ]), { cls: 'kv-card' })],
      foot: [button({ label: 'See your new driver', block: true, onClick: () => {
        sh.close();
        store.set({ credit: store.get().credit + data.GUARANTEE_CREDIT });
        store.patchTrip({ driverId: 'imran', walkState: 'walking', freeUntil: null, driverCancelled: true });
        toPhase('driver', { replaced: true }, 'fade');
      } })],
    });
  }

  const sims = [
    { label: 'Driver at the bay', icon: 'local_taxi', onClick: () => setState('atBay') },
    state === 'atBay' ? { label: 'Free time runs out', icon: 'timer_off', onClick: () => setState('paidWait', { paidSince: Date.now() }) } : null,
    { label: 'No signal in the basement', icon: 'signal_cellular_off', onClick: () => setState('noSignal') },
    !t.bayChanged ? { label: 'Bay changed', icon: 'swap_horiz', onClick: () => { store.patchTrip({ bay: 14, bayChanged: true, walkState: 'walking' }); pushBanner({ title: 'Bay changed to Bay 14', text: 'Bay 12 is blocked. Your driver has the same update.' }); router.refresh(); } } : null,
    !t.driverCancelled ? { label: 'Driver cancels', icon: 'person_cancel', onClick: driverCancels } : null,
    { label: 'Cannot find each other', icon: 'person_search', onClick: () => setState('cannotFind', { freeUntil: t.freeUntil || Date.now() + 4 * 60000 }) },
  ].filter(Boolean);

  const node = screen({
    name: 'walk',
    label: `Walk to ${i.bayLabel}`,
    head: header({ onBack: () => router.backTo('home'), right: simulate(sims) }),
    body: [
      el('div', { class: 'walk stagger' }, [
        el('h1', { class: 'walk__bay', text: i.bayLabel }),
        card([
          el('div', { class: 'walk-driver' }, [
            avatar(d.name, { size: 'sm' }),
            el('div', { class: 'row__body' }, [el('p', { class: 'row__title', text: d.first }), plate(d.plate)]),
            badge(statusText, state === 'noSignal' ? '' : state === 'walking' ? 'brand' : 'success'),
          ]),
          el('div', { class: 'walk-actions' }, [
            el('button', { type: 'button', class: 'walk-action', onClick: callSheet }, [icon('call'), 'Call']),
            el('button', { type: 'button', class: 'walk-action', onClick: () => router.go('chat') }, [icon('chat'), 'Chat']),
            el('button', { type: 'button', class: 'walk-action', onClick: photoSheet }, [icon('photo_camera'), 'Photo']),
          ]),
        ], { cls: 'walk-card' }),
        stateBanner,
        el('h2', { class: 'overline overline--section overline--tight', text: `Belt ${i.belt || 7} to ${i.bayLabel} · about ${i.walk.mins} min` }),
        state === 'atBay' ? el('p', { class: 'walk__near', text: 'You are about 2 min away' }) : null,
        el('ol', { class: 'walk-steps' }, steps.map((st, idx) => el('li', { class: 'walk-step' }, [
          el('span', { class: 'walk-step__num', text: idx + 1 }),
          el('div', { class: 'row__body' }, [el('p', { class: 'row__title', text: st.title }), el('p', { class: 'row__sub', text: st.sub })]),
          el('span', { class: 'walk-step__icon' }, icon(st.icon)),
        ]))),
        el('div', { class: 'chips chips--static' }, [badge('Water 40 m', '', 'water_drop'), badge('WC 60 m', '', 'wc'), badge('Safe point', 'success', 'shield_person')]),
      ]),
    ],
    foot: actionBar(el('div', { class: 'pulse-wrap' }, button({ label: 'I’m at the bay', iconLeft: 'where_to_vote', block: true, onClick: () => toPhase('meet') }))),
  });
  cleanup(node, () => timers.forEach((x) => { clearTimeout(x); clearInterval(x); }));
  return node;
}

/* ═══════════════════════ R7chat Chat with driver ═══════════════════════ */

export function chat() {
  const t = trip();
  if (!t) return gone();
  const d = info(t).d;
  if (!t.chat) store.patchTrip({ chat: [{ me: false, text: `I am at ${info(t).bayLabel}. ${d.car.split(' ')[0]} ${d.car.split(' ').slice(-1)[0]}, hazard lights on.` }] });
  const log = el('div', { class: 'chat-log', role: 'log', 'aria-live': 'polite' });
  const paint = () => {
    log.replaceChildren(...trip().chat.map((m) => el('p', { class: `bubble ${m.me ? 'bubble--me' : ''}`, text: m.text })));
    log.scrollTop = log.scrollHeight;
  };
  const replies = { 'I am at the bay': 'Okay madam, I can see you. Coming.', '2 min away': 'Okay madam, no hurry.', 'Cannot find you': 'I am next to pillar C4, hazard lights on.', 'Please wait': 'Okay, waiting.' };
  let replyTimer = null;
  function send(text) {
    const msg = text.trim();
    if (!msg) return;
    store.patchTrip({ chat: [...trip().chat, { me: true, text: msg }] });
    paint();
    field.control.value = '';
    clearTimeout(replyTimer);
    replyTimer = setTimeout(() => {
      if (!trip()) return;
      store.patchTrip({ chat: [...trip().chat, { me: false, text: replies[msg] || 'Okay madam.' }] });
      if (log.isConnected) paint();
    }, 1600);
  }
  const field = textField({ placeholder: 'Message', onEnter: send });
  field.control.setAttribute('aria-label', 'Message');
  paint();
  const node = screen({
    name: 'chat',
    label: `Chat with ${d.first}`,
    head: header({ title: `${d.first} · ${d.plate}`, onBack: () => router.back() }),
    body: [el('p', { class: 'fine-print chat-note', text: 'Messages stay in the app. Your number is never shared.' }), log],
    foot: el('footer', { class: 'chat-foot' }, [
      el('div', { class: 'chips' }, data.CHAT_QUICK.map((q) => el('button', { type: 'button', class: 'chip', onClick: () => send(q) }, q))),
      el('div', { class: 'chat-input' }, [field, iconButton({ name: 'send', label: 'Send', fill: true, onClick: () => send(field.control.value) })]),
    ]),
  });
  cleanup(node, () => clearTimeout(replyTimer));
  return node;
}

/* ═══════════════════════ R8 Meet and board ═══════════════════════ */

export function meet() {
  const t = trip();
  if (!t) return gone();
  const i = info(t);
  const d = i.d;
  const auto = setTimeout(start, 15000);

  function start() {
    clearTimeout(auto);
    store.patchTrip({ startedAt: Date.now() });
    toast(`${d.first} entered your code. Trip started.`, { type: 'success', iconName: 'verified' });
    toPhase('onTrip', {}, 'fade');
  }

  function notMyCar() {
    const sh = sheet({
      title: 'Do not get in',
      sub: `Stay at ${i.bayLabel}, where staff can see you.`,
      body: [
        row({ lead: iconCircle('flag', { tone: 'error' }), title: 'Report this car', sub: 'We alert hub staff and log the plate', cls: 'list-row', onClick: () => { sh.close(); addCase('Wrong car at the bay'); toast('Reported. Hub staff are on their way to you.', { type: 'success' }); } }),
        row({ lead: iconCircle('support_agent'), title: 'Call Safarnaama safety', sub: '24x7, answers in under a minute', cls: 'list-row', onClick: () => { sh.close(); toast('Calling Safarnaama safety…', { iconName: 'call' }); } }),
        row({ lead: iconCircle('emergency', { tone: 'error' }), title: 'Call 112', sub: 'Police emergency', cls: 'list-row', onClick: () => { sh.close(); sosDialog(); } }),
      ],
    });
  }

  function bagsProblem() {
    const sh = sheet({
      title: 'Problem with your bags?',
      sub: `Your car was matched to fit ${bagsText(i.bags)}.`,
      body: [
        row({ lead: iconCircle('luggage'), title: 'Driver says they will not fit', sub: 'We send a bigger car at the same fare', cls: 'list-row', onClick: () => { sh.close(); store.patchTrip({ rideId: 'suv' }); toPhase('finding', { again: true }, 'fade'); toast('Sending a Cab XL, same fare.', { type: 'success' }); } }),
        row({ lead: iconCircle('money_off'), title: 'Driver asks extra for bags', sub: 'You owe nothing more. Luggage is in your fare.', cls: 'list-row', onClick: () => { sh.close(); extraSheet(); } }),
        row({ lead: iconCircle('add'), title: 'I have more bags than I declared', sub: 'Update now. Fare may change before the trip starts.', cls: 'list-row', onClick: () => { sh.close(); comingSoon('Updating bags at the bay'); } }),
      ],
    });
  }

  const node = screen({
    name: 'meet',
    label: 'Meet your driver',
    head: header({ title: 'Meet your driver', onBack: () => router.backTo('home'), right: simulate([{ label: 'Driver enters code', icon: 'pin', onClick: start }]) }),
    body: [
      el('div', { class: 'meet stagger' }, [
        el('p', { class: 'meet__check', text: 'Check the plate before you get in' }),
        plate(d.plate, 'xl'),
        el('p', { class: 'meet__car', text: d.car }),
        el('p', { class: 'row__sub meet__driver' }, [avatar(d.name, { size: 'sm' }), `${d.name} · ${d.rating}`, icon('star', { size: 'xs', fill: true })]),
        card([
          el('p', { class: 'overline', text: `Tell ${d.first} this code` }),
          el('p', { class: 'start-code', 'aria-label': `Code ${data.START_CODE.split('').join(' ')}`, text: data.START_CODE.split('').join(' ') }),
          el('p', { class: 'row__sub', text: 'The trip starts only when he enters it.' }),
        ], { cls: 'code-card' }),
        el('p', { class: 'overline overline--section overline--tight', text: 'Bags, as declared' }),
        el('ul', { class: 'bag-list' }, [
          ...Array.from({ length: i.bags.cabin }, () => el('li', {}, [icon('work'), 'Cabin bag'])),
          ...Array.from({ length: i.bags.checkin }, () => el('li', {}, [icon('luggage'), 'Check-in bag'])),
        ]),
        el('div', { class: 'book__links' }, [
          link({ label: 'This is not my car', body: true, onClick: notMyCar }),
          link({ label: 'Problem with bags?', body: true, onClick: bagsProblem }),
        ]),
      ]),
    ],
  });
  cleanup(node, () => clearTimeout(auto));
  return node;
}

/* ═══════════════════════ Extra money (R9m / R9m2) ═══════════════════════ */

function addCase(title, extra = {}) {
  const id = `SF-${20400 + Math.floor(Math.random() * 99)}`;
  const c = { id, title, status: 'In progress', at: Date.now(), ...extra };
  store.set({ cases: [c, ...store.get().cases] });
  return c;
}

export function extraSheet() {
  const t = trip() || store.get().history[0];
  const fare = t ? t.fare : 0;
  const d = t ? store.driver(t.driverId) : data.DRIVERS[0];
  let reason = null;
  const err = el('p', { class: 'field__error', 'aria-live': 'polite' });
  const sh = sheet({
    title: 'You owe nothing more',
    sub: `Your ${rupees(fare)} is paid, including tolls and airport fees.`,
    body: [
      el('p', { class: 'overline overline--section', text: 'What did he ask for? (helps us follow up)' }),
      chipGroup({ label: 'What was asked', value: null, options: data.EXTRA_ASK_REASONS.map((r) => ({ value: r, label: r })), onChange: (v) => { reason = v; err.textContent = ''; } }),
      err,
      el('p', { class: 'fine-print', text: 'We log this on his record and support contacts him. You do not have to argue.' }),
    ],
    foot: [
      button({ label: 'Report it', block: true, onClick: () => {
        if (!reason) { err.textContent = 'Pick what he asked for, so we can follow up.'; return; }
        const c = addCase('Driver asked for extra money', { detail: reason });
        sh.close();
        const s2 = sheet({
          title: 'Reported. Your trip continues.',
          body: [
            card(kv([['Case', c.id], ['Handled by', 'Safarnaama support'], ['Fare', `${rupees(fare)}, locked`]]), { cls: 'kv-card' }),
            el('p', { class: 'show-driver', text: `${d.first}, this ride is fully paid in the app. No cash, tolls or parking on top.` }),
            el('p', { class: 'fine-print', text: 'If he insists, show him this screen.' }),
          ],
          foot: [button({ label: 'Done', block: true, onClick: () => s2.close() })],
        });
      } }),
    ],
  });
}

/* ═══════════════════════ SOS (R9s → R9s2) ═══════════════════════ */

export function sosDialog() {
  let n = 5;
  const num = el('span', { class: 'sos-count', text: n });
  const titleEl = el('span', { text: `Calling 112 in ${n} s` });
  const tick = setInterval(() => {
    n -= 1;
    num.textContent = n;
    titleEl.textContent = `Calling 112 in ${n} s`;
    if (n <= 0) { clearInterval(tick); dlg.close(); goSos(); }
  }, 1000);
  const dlg = dialog({
    title: '',
    art: el('div', { class: 'sos-art' }, [num, el('p', { class: 'app-dialog__title' }, titleEl)]),
    text: 'Your live location and trip details go to the police, our safety team and your trusted contact.',
    actions: [
      { label: 'Call now', variant: 'destructive', onClick: () => { clearInterval(tick); goSos(); } },
      { label: 'Cancel, I’m okay', variant: 'ghost', onClick: () => clearInterval(tick) },
    ],
    onClose: () => clearInterval(tick),
  });
  dlg.node.querySelector('.app-dialog__title:empty')?.remove();
}

function goSos() {
  if (trip()) toPhase('sos', {}, 'fade');
  else router.go('sos');
}

export function sos() {
  const t = trip();
  const i = t ? info(t) : null;
  const contact = i && i.contact ? i.contact.name.split(' ')[0] : (store.get().contacts[0] ? store.get().contacts[0].name.split(' ')[0] : null);
  const node = screen({
    name: 'sos',
    label: 'SOS active',
    body: [
      el('div', { class: 'sos stagger' }, [
        el('span', { class: 'sos__ring', 'aria-hidden': 'true' }, icon('emergency', { size: 'xl', fill: true })),
        el('h1', { class: 'screen__title screen__title--display', text: 'Calling 112' }),
        el('p', { class: 'screen__lead', text: 'Stay on the line. Help is on the way.' }),
        el('ul', { class: 'update-list' }, [
          contact ? ['share_location', `Live location shared with ${contact}`] : ['share_location', 'Live location shared with the police'],
          ['support_agent', 'Safety team alerted, they will call you in a minute'],
          i ? ['directions_car', `Car details sent: ${i.d.plate}, ${i.d.first}`] : null,
        ].filter(Boolean).map(([ic, tx]) => el('li', {}, row({ lead: iconCircle(ic, { tone: 'error' }), title: tx, trail: icon('check_circle', { fill: true }) })))),
      ]),
    ],
    foot: actionBar([
      button({ label: 'I am safe now', block: true, onClick: () => {
        dialog({
          title: 'End SOS?',
          text: 'Our safety team will still call you to check in.',
          actions: [
            { label: 'Yes, I am safe', onClick: () => { addCase('SOS raised during trip'); if (trip()) toPhase('onTrip', {}, 'fade'); else router.back(); toast('SOS ended. A case is open in Help.', { type: 'success' }); } },
            { label: 'Stay on SOS', variant: 'ghost' },
          ],
        });
      } }),
    ]),
  });
  node.dataset.status = 'light';
  return node;
}

/* ═══════════════════════ R9 On the trip ═══════════════════════ */

export function onTrip() {
  const t = trip();
  if (!t) return gone();
  const i = info(t);
  const d = i.d;
  const eta = new Date((t.startedAt || Date.now()) + 38 * 60000);
  const etaText = eta.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  let mins = Math.max(1, 38 - Math.floor((Date.now() - (t.startedAt || Date.now())) / 60000));
  const minsEl = el('span', { class: 'eta__mins', text: `${mins} min` });
  const timers = [setInterval(() => { mins = Math.max(1, mins - 1); minsEl.textContent = `${mins} min`; }, 15000)];

  function routeChanged() {
    dialog({
      title: 'Your car has left the usual route',
      text: 'It may be traffic. Are you okay?',
      art: iconCircle('alt_route', { tone: 'accent', size: 'lg' }),
      actions: [
        { label: 'I’m okay', onClick: () => toast('Thanks. We are keeping an eye on the route.') },
        { label: 'Get help', variant: 'destructive', onClick: sosDialog },
      ],
    });
  }

  function endEarly() {
    dialog({
      title: `${d.first} wants to end the trip here`,
      text: `You are 1.2 km from ${dropName(i.drop)}. Door drop is included in your fare.`,
      art: iconCircle('wrong_location', { tone: 'accent', size: 'lg' }),
      actions: [
        { label: 'Ask him to continue', onClick: () => toast(`We have told ${d.first} to drop you at the door.`, { type: 'success' }) },
        { label: 'End here', variant: 'ghost', onClick: arrive },
      ],
    });
  }

  function arrive() {
    if (i.contact) pushBanner({ title: 'You are home', text: `${i.contact.name.split(' ')[0]} has been told you reached home.` });
    toPhase('arrived', {}, 'fade');
  }

  const node = el('main', { class: 'screen screen--trip', 'aria-label': 'On the trip' }, [
    el('div', { class: 'trip-map', role: 'img', 'aria-label': 'Map of your route home' }, [
      el('div', { class: 'trip-map__svg', html: ROUTE_SVG }),
      el('button', { type: 'button', class: 'sos-btn', onClick: sosDialog, 'aria-label': 'SOS, call for help' }, [icon('emergency', { size: 'sm', fill: true }), 'SOS']),
      el('div', { class: 'trip-map__right' }, simulate([
        { label: 'Route changes', icon: 'alt_route', onClick: routeChanged },
        { label: 'Driver wants to end early', icon: 'wrong_location', onClick: endEarly },
        { label: 'Arrive home', icon: 'home', onClick: arrive },
      ])),
      i.contact
        ? el('span', { class: 'share-pill' }, [el('span', { class: 'live-dot', 'aria-hidden': 'true' }), `Sharing live with ${i.contact.name.split(' ')[0]}`])
        : el('button', { type: 'button', class: 'share-pill share-pill--off', onClick: shareSheet }, [icon('share', { size: 'xs' }), 'Share live trip']),
    ]),
    el('section', { class: 'trip-panel stagger' }, [
      el('div', { class: 'eta' }, [el('p', { class: 'eta__title', text: `${dropName(i.drop)} by ${etaText}` }), minsEl]),
      row({ lead: avatar(d.name, { size: 'sm' }), title: `${d.first} · ${d.plate}`, sub: d.car, trail: iconButton({ name: 'call', label: `Call ${d.first}`, onClick: () => toast(`Connecting you to ${d.first} on a masked line…`, { iconName: 'call' }) }) }),
      card(row({ lead: iconCircle('lock', { tone: 'success' }), title: `Fare locked · ${rupees(t.fare)}`, sub: 'Tolls and airport fees included. Nothing more to pay.' }), { sunken: true, cls: 'tip-card' }),
      link({ label: 'Driver asked for extra money', body: true, iconRight: 'chevron_right', onClick: extraSheet }),
    ]),
  ]);
  cleanup(node, () => timers.forEach(clearInterval));
  return node;
}

/* ═══════════════════════ R10 You have arrived ═══════════════════════ */

export function arrived() {
  const t = trip();
  if (!t) return gone();
  const i = info(t);
  const d = i.d;
  const bags = [
    ...Array.from({ length: i.bags.cabin }, (_, n) => `Cabin bag${i.bags.cabin > 1 ? ` ${n + 1}` : ''}`),
    ...Array.from({ length: i.bags.checkin }, (_, n) => `Check-in bag${i.bags.checkin > 1 ? ` ${n + 1}` : ''}`),
  ];
  const out = new Set();
  const counter = el('p', { class: 'overline overline--section' });
  const allOut = button({ label: 'All bags are out', block: true, onClick: () => toPhase('rate', {}, 'forward') });
  const sync = () => {
    counter.textContent = `Are all your bags out? ${out.size} of ${bags.length}`;
    allOut.disabled = out.size < bags.length && bags.length > 0;
  };

  function leftBag() {
    const sh = sheet({
      title: `We have asked ${d.first} to stop`,
      body: [
        illustration('bag-left-behind.png', 'A bag left on the back seat of a car', { width: 200, height: 150, cls: 'state-art state-art--sm' }),
        el('p', { class: 'sheet-text', text: 'He has been told a bag is still in the car and to wait where he is.' }),
        row({ lead: iconCircle('call'), title: `Call ${d.first}`, sub: 'Masked call', cls: 'list-row', onClick: () => { sh.close(); toast(`Connecting you to ${d.first}…`, { iconName: 'call' }); } }),
        row({ lead: iconCircle('report'), title: 'Report a left bag', sub: 'We follow up with a named person', cls: 'list-row', onClick: () => { sh.close(); router.go('report', { topic: 'bag', fromTrip: true }); } }),
      ],
      foot: [button({ label: 'Got it back', variant: 'secondary', block: true, onClick: () => { sh.close(); bags.forEach((b) => out.add(b)); router.refresh(); toast('Glad you have everything.', { type: 'success' }); } })],
    });
  }

  sync();
  return screen({
    name: 'arrived',
    label: 'You are home',
    body: [
      el('div', { class: 'stagger' }, [
        illustration('you-are-home.png', 'A front door with warm light, a suitcase beside it', { width: 280, height: 210, cls: 'state-art state-art--hero' }),
        el('h1', { class: 'screen__title screen__title--display', text: `You are ${dropName(i.drop) === 'Home' ? 'home' : 'here'}` }),
        el('p', { class: 'screen__lead', text: `Before ${d.first} leaves, check your bags.` }),
        counter,
        el('div', { class: 'check-list' }, bags.map((b) => checkbox({ label: b, onChange: (on) => { if (on) out.add(b); else out.delete(b); sync(); } }))),
        card(kv([['Paid', rupees(t.fare)], ['Cash to driver', rupees(0)]]), { cls: 'kv-card kv-card--full' }),
      ]),
    ],
    foot: actionBar([allOut, button({ label: 'A bag is still in the car', variant: 'ghost', block: true, onClick: leftBag })]),
  });
}

/* ═══════════════════════ R10r Rate your ride ═══════════════════════ */

export function rate() {
  const t = trip();
  if (!t) return gone();
  const d = info(t).d;
  let stars = 0;
  const tags = new Set();
  const starsEl = el('div', { class: 'stars', role: 'radiogroup', 'aria-label': 'Rating' });
  const tagWrap = el('div', { class: 'chips' });
  const comment = el('textarea', { class: 'textarea', rows: '3', placeholder: 'Anything we should know', 'aria-label': 'Add a comment (optional)' });
  const submit = button({ label: 'Submit', block: true, disabled: true, onClick: () => finish(true) });

  function paint() {
    starsEl.replaceChildren(...[1, 2, 3, 4, 5].map((n) => {
      const b = el('button', { type: 'button', class: `star ${n <= stars ? 'is-on' : ''}`, role: 'radio', 'aria-checked': String(n === stars), 'aria-label': `${n} star${n > 1 ? 's' : ''}` }, icon('star', { size: 'xl', fill: n <= stars }));
      b.addEventListener('click', () => { stars = n; tags.clear(); paint(); });
      return b;
    }));
    const list = stars === 0 ? [] : stars >= 4 ? data.RATING_TAGS.good : [...data.RATING_TAGS.bad, ...data.RATING_TAGS.good.slice(0, 2)];
    tagWrap.replaceChildren(...list.map((tg) => {
      const c = el('button', { type: 'button', class: 'chip', role: 'checkbox', 'aria-checked': String(tags.has(tg)) }, tg);
      c.addEventListener('click', () => { if (tags.has(tg)) tags.delete(tg); else tags.add(tg); c.setAttribute('aria-checked', String(tags.has(tg))); });
      return c;
    }));
    submit.disabled = stars === 0;
  }

  function finish(rated) {
    const cur = trip();
    const entry = archive(cur, { status: 'completed', rating: rated ? stars : null, tags: [...tags], comment: comment.value.trim() });
    if (rated && (tags.has('Felt unsafe') || tags.has('Asked for extra'))) addCase(tags.has('Felt unsafe') ? 'Felt unsafe on a trip' : 'Driver asked for extra money', { tripId: entry.id });
    router.resetTo([{ name: 'home' }, { name: 'tripDone', params: { id: entry.id } }], { transition: 'fade' });
  }

  paint();
  return screen({
    name: 'rate',
    label: 'Rate your ride',
    head: header({ right: link({ label: 'Skip', underline: true, body: true, muted: true, onClick: () => finish(false) }) }),
    body: [
      el('div', { class: 'stagger' }, [
        el('h1', { class: 'screen__title', text: 'Rate your ride' }),
        el('p', { class: 'screen__lead', text: `How was your ride with ${d.first}?` }),
        starsEl,
        el('p', { class: 'overline overline--section', text: 'What stood out?' }),
        tagWrap,
        el('label', { class: 'field__label field__label--section', text: 'Add a comment (optional)' }),
        comment,
      ]),
    ],
    foot: actionBar(submit),
  });
}

/* ═══════════════════════ R10d Trip complete ═══════════════════════ */

export function tripDone(params = {}) {
  const entry = store.get().history.find((h) => h.id === params.id) || store.get().history[0];
  if (!entry) return gone();
  const d = store.driver(entry.driverId);
  const drop = store.address(entry.dropId);
  const contact = store.get().contacts.find((c) => c.id === entry.sharingWith);
  const n = store.firstName();
  return screen({
    name: 'trip-done',
    label: 'Trip complete',
    body: [
      el('div', { class: 'center-state center-state--top stagger' }, [
        illustration('trip-complete.png', 'A happy traveller at home with her suitcase', { width: 240, height: 190, cls: 'state-art state-art--hero' }),
        el('h1', { class: 'screen__title screen__title--display', text: n ? `Thanks, ${n}` : 'Thanks for riding' }),
        el('p', { class: 'screen__lead', text: contact ? `${contact.name.split(' ')[0]} has been told you reached home.` : 'Your receipt is in Trips.' }),
        card(kv([
          ['Trip', `${entry.instant ? 'T2 exit' : 'T2'} to ${dropName(drop)} · ${drop ? drop.km : 18} km`],
          ['Driver', `${d.first} · ${d.plate}`],
          ['Paid by', (data.PAYMENT_METHODS.find((m) => m.id === entry.method) || data.PAYMENT_METHODS[0]).label],
          ['Extra charged', rupees(0)],
          ['Total', rupees(entry.fare)],
        ]), { cls: 'kv-card kv-card--full' }),
        link({ label: 'Get help with this trip', body: true, iconRight: 'chevron_right', onClick: () => router.reset('help', {}, { transition: 'none' }) }),
      ]),
    ],
    foot: actionBar(button({ label: 'Done', block: true, onClick: () => router.reset('home', {}, { transition: 'back' }) })),
  });
}

/* ═══════════════════════ R11f Report (left bag and other topics) → R11s ═══════════════════════ */

export function report(params = {}) {
  const topic = data.HELP_TOPICS.find((h) => h.id === params.topic) || data.HELP_TOPICS[0];
  const last = store.get().trip || store.get().history[0];
  const d = last ? store.driver(last.driverId) : null;
  const isBag = topic.id === 'bag';
  let reach = 'Call me';
  const what = textField({ label: isBag ? 'What did you leave?' : 'What happened?', placeholder: isBag ? 'Black laptop bag' : 'Tell us in a line or two', onInput: () => what.setError('') });
  const detail = isBag ? textField({ label: 'Anything that helps identify it', placeholder: 'For example, a sticker or tag' }) : null;

  function submit(e) {
    if (!what.control.value.trim()) { what.setError(isBag ? 'Tell us what you left so the driver can find it' : 'Tell us what happened so we can help'); what.control.focus(); return; }
    const btn = e.currentTarget;
    btn.setLoading(true, 'Sending');
    setTimeout(() => {
      const c = addCase(isBag ? 'Left a bag' : topic.label, { detail: what.control.value.trim(), reach, topic: topic.id, driver: d ? d.first : null });
      router.go('caseReceived', { id: c.id }, { replace: true });
    }, 900);
  }

  return screen({
    name: 'report',
    label: topic.label,
    head: header({ title: isBag ? 'Left something in the car' : topic.label, onBack: () => router.back() }),
    body: [
      el('div', { class: 'form-stack' }, [
        last && d ? card(row({ lead: iconCircle('receipt_long'), title: `${last.instant ? 'T2 exit' : 'T2'} to ${dropName(store.address(last.dropId))}`, sub: `${d.first} · ${d.plate}` }), { cls: 'tip-card' }) : null,
        what,
        detail,
        isBag ? row({ lead: iconCircle('add_a_photo'), title: 'Add a photo (optional)', cls: 'list-row', onClick: () => comingSoon('Photo upload') }) : null,
        el('div', { class: 'field' }, [
          el('p', { class: 'overline', text: 'How should we reach you?' }),
          chipGroup({ label: 'Contact method', value: reach, options: ['Call me', 'WhatsApp', 'In the app'].map((v) => ({ value: v, label: v })), onChange: (v) => { reach = v; } }),
        ]),
      ]),
    ],
    foot: actionBar(button({ label: 'Send report', block: true, onClick: submit })),
  });
}

export function caseReceived(params = {}) {
  const c = store.get().cases.find((x) => x.id === params.id) || store.get().cases[0];
  if (!c) return gone();
  const isBag = c.topic === 'bag';
  const steps = isBag
    ? [['Report received', 'Just now', true], ['Driver contacted', `${c.driver || 'Your driver'} has been asked to return the bag`], ['Bag back with you', 'We arrange the drop at no cost']]
    : [['Report received', 'Just now', true], ['Support reviews it', 'A named person picks it up'], ['We get back to you', `By ${c.reach || 'call'}`]];
  return screen({
    name: 'case',
    label: 'Report received',
    head: header({ title: `Case ${c.id}`, onBack: () => router.reset('help', {}, { transition: 'back' }) }),
    body: [
      el('div', { class: 'stagger' }, [
        el('span', { class: 'success-ring success-ring--sm', 'aria-hidden': 'true' }, icon('check', { size: 'lg' })),
        el('h1', { class: 'screen__title screen__title--gap', text: 'We are on it' }),
        card(kv([['Handled by', 'Priya, Safarnaama support'], ['First reply by', new Date(Date.now() + 9 * 60000).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase()], ['Driver record', 'Updated when the case closes']]), { cls: 'kv-card kv-card--full' }),
        el('ol', { class: 'timeline' }, steps.map(([tt, sub, doneStep], idx) => el('li', { class: ['timeline__step', doneStep ? 'is-done' : '', idx === 1 ? 'is-next' : ''].filter(Boolean).join(' ') }, [
          el('span', { class: 'timeline__dot', 'aria-hidden': 'true' }),
          el('div', {}, [el('p', { class: 'timeline__title', text: tt }), el('p', { class: 'timeline__sub', text: sub })]),
        ]))),
      ]),
    ],
    foot: actionBar(button({ label: 'Done', block: true, onClick: () => router.reset('help', {}, { transition: 'back' }) })),
  });
}

export { addCase, info as tripInfo };
