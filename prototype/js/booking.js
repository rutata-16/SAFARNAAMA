// 02 → 03 · Where to, bags, choosing the ride, pool, locking it, and the scheduled ride.

import * as store from './store.js';
import * as router from './router.js';
import { icon } from './icons.js';
import {
  el, rupees, button, iconButton, link, header, screen, actionBar, card, iconCircle, row, badge, wipBadge,
  spinner, textField, toggle, radioGroup, stepper, sheet, confirmSheet, toast, comingSoon, announce,
} from './components.js';
import { signInGate } from './screens.js';
import { guaranteeSheet } from './journey.js';

const { data } = store;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function draft() {
  return store.get().draft;
}

function patchDraft(patch) {
  store.set({ draft: { ...draft(), ...patch } });
}

// Guard for routes that need a booking in progress
function missingDraft() {
  setTimeout(() => router.reset('home'), 0);
  return el('main', { class: 'screen' });
}

function stepHead(step, onBack) {
  return header({ onBack, right: el('span', { class: 'step-count', text: `Step ${step} of 3` }) });
}

function rideIcon(r) {
  return r.icon;
}

function landsAt(f) {
  return f.status === 'delayed' ? f.delayedTo : f.arrivalShort;
}

function bagsLine(b) {
  const parts = [`${b.cabin} cabin`, `${b.checkin} check-in ${b.checkin === 1 ? 'bag' : 'bags'}`];
  if (b.people > 1) parts.push(`${b.people} people`);
  return parts.join(' · ');
}

function dropTitle(addr) {
  const home = store.get().home;
  return home && home.addressId === addr.id ? `${home.label} · ${addr.area}` : addr.short;
}

function totalBags(b) {
  return b.cabin + b.checkin;
}

/* ═══════════════════════ B2 Where to (step 2 of 3) ═══════════════════════ */

export function whereTo(params = {}) {
  const d = draft();
  if (!d) return missingDraft();
  const flight = store.findFlight(d.flightKey);
  const home = store.get().home;
  const homeAddr = store.homeAddress();
  const list = el('div', { class: 'drop-list', role: 'listbox', 'aria-label': 'Places' });

  function choose(id) {
    patchDraft({ dropId: id });
    if (params.edit) { router.backTo(params.returnTo || 'book'); toast(`Drop changed to ${store.address(id).short}`, { type: 'success' }); return; }
    router.go('bags');
  }

  function paint(q = '') {
    const term = q.trim().toLowerCase();
    if (!term) {
      const recent = ['a7', 'a8', 'a3'].map(store.address).filter((a) => !homeAddr || a.id !== homeAddr.id);
      list.replaceChildren(
        el('p', { class: 'overline overline--section', text: 'Recent' }),
        ...recent.map((a) => row({ lead: iconCircle('history'), title: a.title, sub: `${a.km} km from T2`, cls: 'list-row', onClick: () => choose(a.id) })),
      );
      return;
    }
    const items = data.ADDRESSES.filter((a) => a.line.toLowerCase().includes(term) || a.title.toLowerCase().includes(term));
    list.replaceChildren(...(items.length
      ? items.map((a) => row({ lead: iconCircle('location_on'), title: a.title, sub: a.line, cls: 'list-row', onClick: () => choose(a.id) }))
      : [el('div', { class: 'search-empty' }, [icon('search_off'), el('p', {}, [el('strong', { text: `No matches for “${q.trim()}”` }), el('br'), 'Try a building, road or area, like “Powai” or “Juhu”.'])])]));
  }

  const field = textField({ placeholder: 'Search a place', iconName: 'search', clearable: true, onInput: paint, onEnter: (q) => { const first = list.querySelector('.row'); if (q.trim() && first) first.click(); } });
  field.control.setAttribute('aria-label', 'Search a place');
  paint();

  const quick = [
    homeAddr ? { id: homeAddr.id, icon: 'home', label: home.label, sub: homeAddr.area } : null,
    { id: 'a4', icon: 'work', label: 'Work', sub: 'Powai' },
  ].filter(Boolean);

  const node = screen({
    name: 'where',
    label: 'Where are you going',
    head: params.edit ? header({ title: 'Change drop', onBack: () => router.back() }) : stepHead(2, () => router.back()),
    body: [
      flight ? el('div', { class: 'flight-pill' }, [icon('flight_land', { size: 'xs' }), `${flight.number} · lands ${flight.terminal}, ${landsAt(flight)}`]) : null,
      el('h1', { class: 'screen__title', text: 'Where are you going?' }),
      el('div', { class: 'form-stack form-stack--tight' }, [
        field,
        el('div', { class: 'quick-places' }, [
          ...quick.map((q) => el('button', { type: 'button', class: 'quick-place', onClick: () => choose(q.id) }, [iconCircle(q.icon), el('span', {}, [el('strong', { text: q.label }), el('small', { text: q.sub })])])),
          homeAddr ? null : el('button', { type: 'button', class: 'quick-place quick-place--add', onClick: () => router.go('saveHome', { mode: 'edit' }) }, [iconCircle('add_home', { tone: 'accent' }), el('span', {}, [el('strong', { text: 'Add home' }), el('small', { text: 'One tap next time' })])]),
        ]),
        list,
      ]),
    ],
  });
  node._entered = () => field.control.focus({ preventScroll: true });
  return node;
}

/* ═══════════════════════ B3 Bags (step 3 of 3) ═══════════════════════ */

export function bags(params = {}) {
  const d = draft();
  if (!d) return missingDraft();
  const b = { ...d.bags };
  const fit = el('p', { class: 'bags-fit', 'aria-live': 'polite' });
  const peopleWrap = el('div', { class: 'bag-line' });

  function paintFit() {
    const tooBig = !store.rideFits(store.ride('suv'), b);
    const r = store.recommendedRide(b);
    fit.classList.toggle('is-warn', tooBig);
    fit.replaceChildren(icon(tooBig ? 'warning' : 'check_circle', { size: 'xs', fill: true }), el('span', {
      text: tooBig ? 'That is more than one Cab XL can take. Our help team can book two cars.' : `A ${r.name.toLowerCase()} fits ${totalBags(b) === 1 ? 'your bag' : `all ${totalBags(b)} bags`}`,
    }));
    showBtn.disabled = tooBig;
  }

  const line = (title, sub, key, min, max) => el('div', { class: 'bag-line' }, [
    el('div', { class: 'row__body' }, [el('p', { class: 'row__title', text: title }), el('p', { class: 'row__sub', text: sub })]),
    stepper({ label: title.toLowerCase(), value: b[key], min, max, onChange: (v) => { b[key] = v; paintFit(); } }),
  ]);

  function paintPeople(on) {
    if (!on) b.people = 1;
    if (on && b.people < 2) b.people = 2;
    peopleWrap.hidden = !on;
    peopleWrap.replaceChildren(
      el('div', { class: 'row__body' }, [el('p', { class: 'row__title', text: 'People' }), el('p', { class: 'row__sub', text: 'Including you' })]),
      stepper({ label: 'people', value: Math.max(b.people, 2), min: 2, max: 6, onChange: (v) => { b.people = v; paintFit(); } }),
    );
    paintFit();
  }

  const showBtn = button({
    label: params.edit ? 'Update my ride' : 'Show my ride',
    block: true,
    onClick: () => {
      patchDraft({ bags: b, rideId: null });
      store.set({ defaultBags: { ...b } });
      if (params.edit) router.backTo(params.returnTo || 'book');
      else router.go('book');
    },
  });

  const together = toggle({ checked: b.people > 1, label: 'Travelling with someone?', onChange: paintPeople });

  paintPeople(b.people > 1);

  return screen({
    name: 'bags',
    label: 'How many bags',
    head: params.edit ? header({ title: 'Change bags', onBack: () => router.back() }) : stepHead(3, () => router.back()),
    body: [
      el('h1', { class: 'screen__title', text: 'How many bags?' }),
      el('p', { class: 'screen__lead', text: 'So we send a car they fit in.' }),
      el('div', { class: 'bags-block' }, [
        line('Cabin bags', 'Carry-on', 'cabin', 0, 8),
        line('Check-in bags', 'From the belt', 'checkin', 0, 8),
        el('div', { class: 'toggle-row bag-line' }, [
          el('div', { class: 'row__body' }, [el('p', { class: 'row__title', text: 'Travelling with someone?' }), el('p', { class: 'row__sub', text: 'We will make sure everyone fits' })]),
          together,
        ]),
        peopleWrap,
        fit,
      ]),
    ],
    foot: actionBar(showBtn),
  });
}

/* ═══════════════════════ B4 Ride summary ═══════════════════════ */

export function book() {
  const d = draft();
  if (!d) return missingDraft();
  if (!d.dropId) { setTimeout(() => router.go('whereTo', {}, { replace: true }), 0); return el('main', { class: 'screen' }); }

  const flight = store.findFlight(d.flightKey);
  const bayInfo = store.bay(flight.terminal);
  const drop = store.address(d.dropId);
  const short = !!drop.short_trip;
  const minFares = { auto: data.MIN_HUB_FARE.auto, cab: 180, suv: 260, pool: 180 };
  const fareOf = (r) => (short ? minFares[r.id] : r.fare);
  const priced = (r) => ({ ...r, fare: fareOf(r) });
  const auto = store.ride('auto');
  const baseRec = short && store.rideFits(auto, d.bags) ? auto : store.recommendedRide(d.bags);
  const rec = priced(baseRec);
  const pick = d.rideId && store.rideFits(store.ride(d.rideId), d.bags) && !(short && d.rideId === 'pool') ? store.ride(d.rideId) : baseRec;
  const chosen = priced(pick);
  const heavy = baseRec.id === 'suv';
  const isPool = chosen.id === 'pool';

  const update = (patch) => { patchDraft(patch); router.refresh(); };

  function optionsSheet() {
    const sh = sheet({
      title: 'Other ways home',
      sub: 'Every fare is all-in and fixed before you land.',
      body: [radioGroup({
        label: 'Ride type',
        value: chosen.id,
        options: data.RIDES.map((r) => {
          const fits = store.rideFits(r, d.bags) && !(short && r.id === 'pool');
          const sub = !fits
            ? (short && r.id === 'pool' ? 'No pools on short trips' : r.capacity.people < d.bags.people ? `Seats ${r.capacity.people}, you are ${d.bags.people}` : r.id === 'auto' && d.bags.checkin ? 'Not available: your check-in bag will not fit' : `Won't fit ${totalBags(d.bags)} bags`)
            : r.id === 'cab' || r.id === 'suv' ? `Bay ${bayInfo.number} · ${bayInfo.walkMins} min walk · ready ~${r.id === 'cab' ? 5 : 8} min after bags` : r.blurb;
          return {
            value: r.id,
            label: el('span', { class: 'opt' }, [
              el('span', { class: 'opt__name' }, [icon(rideIcon(r), { size: 'sm' }), r.name, r.id === rec.id ? badge('Recommended', 'brand') : null]),
              el('small', { text: sub }),
              r.id === 'pool' && fits ? el('small', { class: 'opt__pool' }, [icon('group', { size: 'xs' }), `${data.POOL.riders.length + 1} from your flight`]) : null,
            ]),
            trail: el('span', { class: 'opt__fare', text: rupees(fareOf(r)) }),
            disabled: !fits,
            onDisabled: () => toast(`${r.name} can't take ${bagsLine(d.bags)}. Change your bags to see it.`, { iconName: 'luggage' }),
          };
        }),
        onChange: (v) => {
          setTimeout(() => {
            sh.close();
            if (v === 'pool') { openPool(); return; }
            update({ rideId: v });
            if (v !== rec.id) toast(`Switched to ${store.ride(v).name}, ${rupees(fareOf(store.ride(v)))} all-in`, { type: 'success' });
          }, 180);
        },
      }),
      store.get().poolWomenOnly && !short && store.rideFits(store.ride('pool'), d.bags) ? row({
        lead: iconCircle('woman', { tone: 'accent' }),
        title: `Women-only pool · ${rupees(store.ride('pool').fare)}`,
        sub: `${data.POOL.womenRiders.length} women from your flight, going your way`,
        trail: icon('chevron_right'),
        cls: 'list-row',
        onClick: () => { sh.close(); router.go('poolDetails'); },
      }) : null,
      link({ label: 'Other ways out of T2 (info only)', iconRight: 'chevron_right', onClick: () => { sh.close(); router.go('otherWays'); } })],
      foot: [button({ label: 'Done', variant: 'secondary', block: true, onClick: () => sh.close() })],
    });
  }

  // B6w: ask about women-only pools in context, once, before showing the pool
  function openPool() {
    const s = store.get();
    if (s.poolWomenOnly || s.womenPoolAsked) { router.go('poolDetails'); return; }
    const sh = sheet({
      title: 'Women-only pool available',
      body: [
        el('div', { class: 'women-pool' }, [
          iconCircle('woman', { tone: 'accent', size: 'lg' }),
          el('p', { class: 'sheet-text', text: `${data.POOL.womenNearby} women from your flight are going towards ${drop.area}. Would you like to see women-only pools?` }),
        ]),
        card(row({ lead: el('span', { class: 'tip-icon' }, icon('visibility_off')), title: 'Private to you', sub: 'We only use this to show you women-only pools. Drivers and co-riders never see it. You can change it in Profile.' }), { sunken: true, cls: 'tip-card' }),
      ],
      foot: [
        button({ label: 'Yes, show me', block: true, onClick: () => { store.set({ poolWomenOnly: true, womenPoolAsked: true }); sh.close(); router.go('poolDetails'); } }),
        button({ label: 'Not now', variant: 'ghost', block: true, onClick: () => { store.set({ womenPoolAsked: true }); sh.close(); router.go('poolDetails'); } }),
      ],
    });
  }

  function editFlight() {
    confirmSheet({
      title: 'Change your flight?',
      text: `Your drop and bags stay as they are. You'll pick the flight again on Home.`,
      confirmLabel: 'Change flight',
      cancelLabel: `Keep ${flight.number}`,
      destructive: false,
      onConfirm: () => router.backTo('home'),
    });
  }

  const rideCard = card([
    el('div', { class: 'ride-card__tag' }, chosen.id === rec.id ? badge('Recommended', 'brand', 'thumb_up') : badge(isPool ? 'Pool from your flight' : 'Your pick', isPool ? 'accent' : '')),
    el('div', { class: 'ride-card__head' }, [
      iconCircle(rideIcon(chosen), { tone: 'accent', size: 'lg', fill: true }),
      el('div', { class: 'row__body' }, [
        el('p', { class: 'ride-card__name', text: chosen.name }),
        el('p', { class: 'row__sub', text: isPool ? (store.get().poolWomenOnly ? `Women-only · with ${data.POOL.womenRiders.map((w) => w.name).join(' and ')}` : `With ${data.POOL.riders[0].name} · you're the 2nd drop`) : chosen.id === rec.id ? 'Best fit for your bags' : chosen.blurb }),
      ]),
      el('div', { class: 'ride-card__price' }, [el('p', { class: 'ride-card__fare', text: rupees(chosen.fare) }), el('p', { class: 'ride-card__allin', text: 'all-in' })]),
    ]),
    el('ul', { class: 'ride-card__facts' }, [
      el('li', {}, [icon('directions_walk', { size: 'sm' }), chosen.id === 'auto' ? `Auto Bay A3, about 3 min walk from belt ${flight.belt}` : `Pickup ${flight.terminal} · Bay ${bayInfo.number} · ${bayInfo.walkMins} min walk from belt ${flight.belt}`]),
      el('li', {}, [icon('timer', { size: 'sm' }), chosen.waitText]),
      el('li', {}, [icon('luggage', { size: 'sm' }), `Fits your ${totalBags(d.bags)} ${totalBags(d.bags) === 1 ? 'bag' : 'bags'}`]),
      isPool ? el('li', {}, [icon('savings', { size: 'sm' }), `You save ${rupees(data.POOL.save)}. Up to ${data.POOL.extraMins} min longer.`]) : null,
    ]),
    el('div', { class: 'chips chips--static' }, [badge('All-in fare', 'success'), short ? badge('Minimum hub fare', 'warning') : null]),
    isPool
      ? el('div', { class: 'ride-card__links' }, [link({ label: 'Pool details', onClick: () => router.go('poolDetails') }), link({ label: 'Back to solo', onClick: () => { update({ rideId: null }); toast('Back to a solo cab', { type: 'success' }); } })])
      : null,
  ], { selected: true, cls: 'ride-card' });

  function whyMinimum() {
    const sh = sheet({
      title: 'Why a minimum hub fare?',
      sub: 'Drivers wait a long time in the T2 queue, so very short trips have a floor.',
      body: [
        el('dl', { class: 'fare-table' }, [
          el('dt', { text: `Distance fare (${drop.km} km)` }), el('dd', { text: rupees(data.MIN_HUB_FARE.distanceFare) }),
          el('dt', { class: 'fare-table__total', text: 'Minimum hub fare' }), el('dd', { class: 'fare-table__total', text: rupees(chosen.fare) }),
        ]),
        card(row({ lead: el('span', { class: 'tip-icon' }, icon('gavel')), title: 'Short trips cannot be refused', sub: 'Refusals are logged on the driver’s record and affect their place in the queue.' }), { sunken: true, cls: 'tip-card tip-card--stack' }),
      ],
      foot: [button({ label: 'Got it', variant: 'secondary', block: true, onClick: () => sh.close() })],
    });
  }

  const outsideCard = card([
    row({ lead: iconCircle('wrong_location', { tone: 'error' }), title: `We do not go to ${drop.short} yet`, sub: 'We cover Mumbai, Thane and Navi Mumbai. Change your drop, or see other ways out of T2.' }),
    el('div', { class: 'ride-card__links' }, [
      link({ label: 'Change drop', onClick: () => router.go('whereTo', { edit: true }) }),
      link({ label: 'Other ways out of T2', iconRight: 'chevron_right', onClick: () => router.go('otherWays') }),
    ]),
  ], { cls: 'ride-card ride-card--error' });

  const editRow = (lead, title, label, onClick) => card(row({
    lead,
    title: el('span', { class: 'summary-row__text', text: title }),
    trail: link({ label: 'Edit', body: true, onClick }),
  }), { cls: 'summary-row' });

  return screen({
    name: 'book',
    label: 'Your ride home',
    head: header({ title: 'Your ride home', onBack: () => router.back() }),
    body: [
      el('div', { class: 'book stagger' }, [
        el('div', { class: 'summary-stack' }, [
          editRow(iconCircle('flight_land'), `${flight.number} · lands ${landsAt(flight)}`, 'flight', editFlight),
          editRow(iconCircle(store.get().home && store.get().home.addressId === drop.id ? 'home' : 'location_on'), `To ${dropTitle(drop)}`, 'drop', () => router.go('whereTo', { edit: true })),
          editRow(iconCircle('luggage'), bagsLine(d.bags), 'bags', () => router.go('bags', { edit: true })),
        ]),
        flight.status === 'delayed' ? card(row({ lead: el('span', { class: 'tip-icon tip-icon--warn' }, icon('schedule')), title: `${flight.number} is running late`, sub: `Now landing ${flight.delayedTo}. Your ride moves with it at no extra cost.` }), { cls: 'tip-card tip-card--warn' }) : null,
        heavy && !drop.outside ? card(row({ lead: el('span', { class: 'tip-icon' }, icon('luggage')), title: 'Autos and small cabs are hidden', sub: 'Your bags need a bigger boot. We only match cars that fit everything.' }), { sunken: true, cls: 'tip-card' }) : null,
        drop.outside ? outsideCard : rideCard,
        drop.outside ? null : el('div', { class: 'book__links' }, [
          link({ label: 'Other options', body: true, iconRight: 'expand_more', onClick: optionsSheet }),
          link({ label: 'Fare details', body: true, onClick: () => fareSheet(chosen, drop, flight, bayInfo) }),
          short ? link({ label: 'Why a minimum fare?', body: true, onClick: whyMinimum }) : null,
        ]),
      ]),
    ],
    foot: actionBar([
      el('div', { class: 'total' }, [
        el('p', { class: 'total__amount', text: drop.outside ? 'Not available' : `${rupees(chosen.fare)} all-in` }),
        el('p', { class: 'total__sub', text: drop.outside ? 'Outside our service area' : 'Nothing more to pay' }),
      ]),
      button({
        label: 'Continue',
        disabled: !!drop.outside,
        onClick: () => {
          if (!store.get().signedIn) { signInGate('book'); return; }
          lockSheet(chosen, drop, flight, bayInfo);
        },
      }),
    ], { split: true }),
  });
}

/* ═══════════════════════ B7f Fare breakdown ═══════════════════════ */

function fareSheet(chosen, drop, flight, bayInfo) {
  const rows = data.fareBreakdown(chosen.fare, drop.km);
  const sh = sheet({
    title: 'Fare breakdown',
    sub: `${chosen.name} · to ${dropTitle(drop)} · ${drop.km} km`,
    body: [
      el('dl', { class: 'fare-table' }, [
        ...rows.flatMap((r) => [
          el('dt', {}, [r.label, r.sub ? el('small', { text: r.sub }) : null]),
          el('dd', { text: rupees(r.amount) }),
        ]),
        el('dt', { class: 'fare-table__total', text: 'Total' }),
        el('dd', { class: 'fare-table__total', text: rupees(chosen.fare) }),
      ]),
      card([
        row({ lead: el('span', { class: 'tip-icon' }, icon('lock')), title: 'Locked now', sub: `Longer routes or traffic won't change it. You pay ${rupees(chosen.fare)}.` }),
        row({ lead: el('span', { class: 'tip-icon' }, icon('schedule')), title: '5 free minutes at the bay', sub: `After that, waiting is ₹3 per minute. We remind you before it starts.` }),
      ], { sunken: true, cls: 'tip-card tip-card--stack' }),
    ],
    foot: [button({ label: 'Done', variant: 'secondary', block: true, onClick: () => sh.close() })],
  });
  return sh;
}

/* ═══════════════════════ B7 Lock your ride (+ B7e payment failed) ═══════════════════════ */

function lockSheet(chosen, drop, flight, bayInfo) {
  const d = draft();
  let method = store.get().paymentMethod;
  let failed = false;
  let picking = false;

  const body = el('div', { class: 'lock' });
  const foot = el('div', { class: 'lock__foot' });
  const methodOf = (id) => data.PAYMENT_METHODS.find((m) => m.id === id);

  function paint() {
    const m = methodOf(method);
    if (picking) {
      body.replaceChildren(
        el('p', { class: 'field__label', text: 'Pay with' }),
        radioGroup({
          label: 'Payment method',
          value: method,
          options: data.PAYMENT_METHODS.map((pm) => {
            const credit = store.get().credit;
            const short = pm.creditOnly && credit < chosen.fare;
            return {
              value: pm.id,
              label: el('span', { class: 'opt' }, [el('span', { class: 'opt__name' }, [icon(pm.icon, { size: 'sm' }), pm.label]), el('small', { text: pm.creditOnly ? `${rupees(credit)} available${short ? ', not enough for this ride' : ''}` : pm.detail })]),
              disabled: short,
              onDisabled: () => toast(`Your credit covers ${rupees(credit)}. Pick another method for this ride.`, { iconName: 'redeem' }),
            };
          }),
          onChange: (v) => { method = v; store.set({ paymentMethod: v }); failed = false; setTimeout(() => { picking = false; paint(); }, 160); },
        }),
        row({ lead: iconCircle('add'), title: 'Add a new method', cls: 'list-row', onClick: () => comingSoon('Adding payment methods') }),
        card(row({ lead: el('span', { class: 'tip-icon' }, icon('money_off')), title: 'Cash is not accepted on app bookings', sub: 'So no one can ask you for cash at the drop.' }), { sunken: true, cls: 'tip-card' }),
      );
      foot.replaceChildren(button({ label: 'Back', variant: 'secondary', block: true, onClick: () => { picking = false; paint(); } }));
      return;
    }

    body.replaceChildren(
      failed ? el('div', { class: 'pay-error', role: 'alert' }, [icon('error', { fill: true }), el('p', {}, [el('strong', { text: 'Payment didn’t go through. ' }), 'You haven’t been charged.'])]) : null,
      card([
        el('div', { class: 'lock__top' }, [
          el('div', { class: 'row__body' }, [
            el('p', { class: 'row__title', text: `${chosen.name} · ${flight.number} · to ${dropTitle(drop)}` }),
            el('p', { class: 'row__sub', text: `${d.day}, lands ${landsAt(flight)} · ${flight.terminal} Bay ${bayInfo.number}` }),
          ]),
          el('p', { class: 'lock__fare', text: rupees(chosen.fare) }),
        ]),
        el('p', { class: 'lock__allin' }, [icon('check_circle', { size: 'xs', fill: true }), 'All-in. Nothing more to pay: no cash, no tolls on top.']),
        link({ label: 'See fare breakdown', onClick: () => fareSheet(chosen, drop, flight, bayInfo) }),
      ], { cls: 'lock__card' }),
      card([
        row({ lead: iconCircle('verified_user', { tone: 'success' }), title: 'Ride guarantee', sub: `If your driver cancels, you get another car at the same fare, plus ${rupees(data.GUARANTEE_CREDIT)} credit.` }),
        link({ label: 'How it works', onClick: guaranteeSheet }),
        el('p', { class: 'fine-print', text: '5 min free waiting at the bay, then ₹2 per min to the driver.' }),
      ], { cls: 'lock__card' }),
      card(row({
        lead: iconCircle(m.icon),
        title: m.label,
        sub: m.detail,
        trail: link({ label: 'Change', body: true, onClick: () => { picking = true; paint(); } }),
      }), { cls: 'lock__card lock__method' }),
      chosen.id === 'pool' ? el('p', { class: 'fine-print', text: `If the pool doesn't fill by the time you have your bags, we switch you to a solo cab. You still pay ${rupees(chosen.fare)}.` }) : null,
    );

    const pay = button({ label: failed ? 'Try again' : `Pay ${rupees(chosen.fare)} and lock`, block: true, onClick: () => doPay(pay) });
    foot.replaceChildren(
      pay,
      failed
        ? button({ label: 'Use another method', variant: 'ghost', block: true, onClick: () => { picking = true; paint(); } })
        : el('p', { class: 'fine-print action-bar__note', text: 'Free to cancel until a driver is assigned.' }),
    );
  }

  async function doPay(btn) {
    btn.setLoading(true, method === 'upi' ? 'Waiting for UPI app' : 'Contacting your bank');
    await wait(method === 'upi' ? 1700 : 1400);
    if (methodOf(method).fails) {
      failed = true;
      announce('Payment didn’t go through. You haven’t been charged.');
      paint();
      sh.panel.querySelector('.sheet__body').scrollTop = 0;
      return;
    }
    store.set({
      paymentMethod: method,
      trip: {
        id: `SF-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        status: 'scheduled',
        flightKey: d.flightKey,
        day: d.day,
        rideId: chosen.id,
        fare: chosen.fare,
        bags: d.bags,
        dropId: d.dropId,
        method,
        bookedAt: Date.now(),
        phase: 'scheduled',
        pool: chosen.id === 'pool' ? 'joined' : null,
        manual: d.manual || null,
        driverId: 'santosh',
        sharingWith: store.get().autoShare && store.get().contacts[0] ? store.get().contacts[0].id : null,
      },
      draft: null,
    });
    sh.close();
    router.resetTo([{ name: 'home' }, { name: 'locking' }], { transition: 'fade' });
  }

  const sh = sheet({ title: 'Lock your ride', body: [body], foot: [foot] });
  paint();
}

/* ═══════════════════════ B6 Pool details ═══════════════════════ */

export function poolDetails() {
  const d = draft();
  if (!d) return missingDraft();
  const flight = store.findFlight(d.flightKey);
  const drop = store.address(d.dropId);
  const womenOnly = store.get().poolWomenOnly;
  const p = data.POOL;
  const riders = womenOnly ? p.womenRiders : p.riders;
  const rider = riders[0];
  const ORD = ['1st', '2nd', '3rd'];

  return screen({
    name: 'pool-details',
    label: 'Pool from your flight',
    head: header({ title: womenOnly ? 'Women-only pool' : 'Pool with your flight', onBack: () => router.back() }),
    body: [
      el('div', { class: 'pool stagger' }, [
        el('div', { class: 'pool__badges' }, [
          badge('Non-stop · fixed drop order', 'brand', 'route'),
          womenOnly ? badge('Women only', 'accent', 'woman') : null,
        ]),
        el('h2', { class: 'overline overline--section', text: 'Who you’d ride with' }),
        el('ol', { class: 'pool-route' }, [
          ...riders.map((rd, n) => el('li', { class: 'pool-route__stop' }, [
            el('span', { class: 'pool-route__avatar', 'aria-hidden': 'true', text: rd.name[0] }),
            el('div', { class: 'row__body' }, [
              el('p', { class: 'row__title', text: rd.name }),
              el('p', { class: 'row__sub', text: `${rd.rating} rating · ${rd.flight}` }),
            ]),
            el('span', { class: 'pool-route__drop', text: `${ORD[n]} drop · ${rd.drop}` }),
          ])),
          el('li', { class: 'pool-route__stop is-you' }, [
            el('span', { class: 'pool-route__avatar', 'aria-hidden': 'true', text: (store.firstName() || 'Y')[0] }),
            el('div', { class: 'row__body' }, [
              el('p', { class: 'row__title', text: 'You' }),
              el('p', { class: 'row__sub', text: flight.number }),
            ]),
            el('span', { class: 'pool-route__drop', text: `${ORD[riders.length]} drop · ${drop.area}` }),
          ]),
        ]),
        womenOnly ? card(row({ lead: el('span', { class: 'tip-icon' }, icon('badge')), title: 'Driver', sub: 'A woman driver, if one is in the queue' }), { sunken: true, cls: 'tip-card' }) : null,
        el('div', { class: 'pool-stats' }, [
          card([el('p', { class: 'pool-stats__label', text: 'You save' }), el('p', { class: 'pool-stats__value', text: rupees(p.save) })]),
          card([el('p', { class: 'pool-stats__label', text: 'Up to' }), el('p', { class: 'pool-stats__value', text: `${p.extraMins} min` }), el('p', { class: 'pool-stats__label', text: 'longer' })]),
        ]),
        card(row({ lead: el('span', { class: 'tip-icon' }, icon('autorenew')), title: 'Never stuck waiting', sub: `If the pool doesn't fill by the time you collect your bags, we switch you to a solo cab automatically.` }), { sunken: true, cls: 'tip-card' }),
        link({ label: 'Invite someone you know instead', iconRight: 'chevron_right', onClick: () => comingSoon('Inviting a co-rider') }),
      ]),
    ],
    foot: actionBar([
      button({
        label: `Join this pool · ${rupees(store.ride('pool').fare)}`,
        block: true,
        onClick: () => {
          patchDraft({ rideId: 'pool' });
          router.back();
          toast(`You're in the pool with ${riders.map((x) => x.name).join(' and ')}. ${rupees(p.save)} saved.`, { type: 'success', iconName: 'groups' });
        },
      }),
      button({ label: 'Back to solo', variant: 'ghost', block: true, onClick: () => { patchDraft({ rideId: null }); router.back(); } }),
    ]),
  });
}
