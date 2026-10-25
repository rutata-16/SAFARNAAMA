// 09 · At the exit now (instant). Pay, get the next car in the queue, then join the same meet → trip → home flow.

import * as store from './store.js';
import * as router from './router.js';
import { icon } from './icons.js';
import {
  el, rupees, button, link, header, screen, actionBar, card, iconCircle, row, badge,
  illustration, sheet, toast, dialog, simulate, avatar, plate, radioGroup,
} from './components.js';
import { signInGate } from './screens.js';
import { toPhase } from './journey.js';

const { data } = store;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function exitDraft() {
  const s = store.get();
  if (!s.draft || !s.draft.instant) {
    store.set({ draft: { instant: true, bags: { ...s.defaultBags }, dropId: s.home ? s.home.addressId : null, rideId: null, day: 'Today' } });
  }
  return store.get().draft;
}

function bagsLine(b) {
  return `${b.cabin} cabin · ${b.checkin} check-in · ${b.people} ${b.people === 1 ? 'person' : 'people'}`;
}

function exitFare(r) {
  return r.id === 'cab' ? data.EXIT_FARE : r.fare + 20;
}

function kv(pairs) {
  return el('dl', { class: 'kv' }, pairs.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', {}, v)]));
}

/* ═══════════════════════ X1 At the exit now ═══════════════════════ */

export function exitNow() {
  if (store.get().trip) {
    setTimeout(() => toast('You already have a ride in progress. Finish or cancel it first.', { iconName: 'info' }), 300);
  }
  const d = exitDraft();
  const drop = store.address(d.dropId);
  const r = store.recommendedRide(d.bags);
  const fare = exitFare(r);
  const q = data.QUEUE;
  let emptyQueue = false;

  function paySheet() {
    if (store.get().trip) { toast('Finish or cancel your current ride first.', { type: 'error' }); return; }
    if (!drop) { router.go('whereTo', { edit: true, returnTo: 'exitNow' }); return; }
    if (drop.outside) { toast(`We do not go to ${drop.short} yet.`, { type: 'error' }); return; }
    if (!store.get().signedIn) { signInGate('exitNow', 'Sign in so we can send your driver’s details and your receipt. It takes 30 seconds.'); return; }
    let method = store.get().paymentMethod === 'card' || store.get().paymentMethod === 'credit' ? 'upi' : store.get().paymentMethod;
    const pay = button({ label: `Pay ${rupees(fare)} and get a car`, block: true, onClick: async () => {
      pay.setLoading(true, 'Confirming payment');
      await wait(1300);
      sh.close();
      store.set({ paymentMethod: method });
      router.go('assigning', { empty: emptyQueue, fare, rideId: r.id, method }, { replace: false, transition: 'fade' });
    } });
    const sh = sheet({
      title: 'Pay and get the next car',
      body: [
        card([
          el('div', { class: 'lock__top' }, [
            el('div', { class: 'row__body' }, [el('p', { class: 'row__title', text: `${r.name} · to ${drop.short}` }), el('p', { class: 'row__sub', text: `Queue Bay ${q.bay} · ${q.walk} min walk` })]),
            el('p', { class: 'lock__fare', text: rupees(fare) }),
          ]),
          el('p', { class: 'lock__allin' }, [icon('check_circle', { size: 'xs', fill: true }), 'All-in. No cash, no tolls on top. Driver cancels? Next car, same fare.']),
        ], { cls: 'lock__card' }),
        el('p', { class: 'field__label field__label--section', text: 'Pay with' }),
        radioGroup({
          label: 'Payment method',
          value: method,
          options: data.PAYMENT_METHODS.filter((m) => !m.creditOnly && !m.fails).map((m) => ({ value: m.id, label: el('span', { class: 'opt' }, [el('span', { class: 'opt__name' }, [icon(m.icon, { size: 'sm' }), m.label]), el('small', { text: m.detail })]) })),
          onChange: (v) => { method = v; },
        }),
      ],
      foot: [pay],
    });
  }

  const node = screen({
    name: 'exit',
    label: 'At the exit now',
    head: header({ title: 'At the exit now', onBack: () => router.back(), right: simulate([{ label: 'Queue is empty after paying', icon: 'remove_road', onClick: () => { emptyQueue = true; toast('Next payment will find the queue empty.'); } }]) }),
    body: [
      el('div', { class: 'book stagger' }, [
        el('p', { class: 'flight-pill' }, [icon('my_location', { size: 'xs' }), 'You are at Mumbai T2 · Arrivals']),
        card([
          row({ lead: iconCircle('hail'), overline: 'Pickup', title: `Queue Bay ${q.bay} · staffed` }),
          el('hr', { class: 'divider divider--inset' }),
          drop
            ? row({ lead: iconCircle('home'), overline: 'Drop', title: drop.short, trail: link({ label: 'Edit', body: true, onClick: () => router.go('whereTo', { edit: true, returnTo: 'exitNow' }) }) })
            : row({ lead: iconCircle('add_location_alt', { tone: 'accent' }), overline: 'Drop', title: el('span', { class: 'text-brand', text: 'Add where you are going' }), trail: icon('chevron_right'), onClick: () => router.go('whereTo', { edit: true, returnTo: 'exitNow' }) }),
        ], { cls: 'route-card' }),
        card(row({ lead: el('span', { class: 'plain-icon' }, icon('luggage')), title: el('span', { class: 'bags-text', text: bagsLine(d.bags) }), trail: link({ label: 'Edit', body: true, onClick: () => router.go('bags', { edit: true, returnTo: 'exitNow' }) }) }), { cls: 'bags-card' }),
        drop && drop.outside ? card(row({ lead: iconCircle('wrong_location', { tone: 'error' }), title: `We do not go to ${drop.short} yet`, sub: 'We cover Mumbai, Thane and Navi Mumbai.' }), { cls: 'tip-card' }) : card([
          el('div', { class: 'ride-card__tag' }, badge('Next car in the queue', 'brand', 'hail')),
          el('div', { class: 'ride-card__head' }, [
            iconCircle(r.icon, { tone: 'accent', size: 'lg', fill: true }),
            el('div', { class: 'row__body' }, [el('p', { class: 'ride-card__name', text: r.name }), el('p', { class: 'row__sub', text: 'Fits your bags' })]),
            el('div', { class: 'ride-card__price' }, [el('p', { class: 'ride-card__fare', text: rupees(fare) }), el('p', { class: 'ride-card__allin', text: 'all-in' })]),
          ]),
          el('ul', { class: 'ride-card__facts' }, [
            el('li', {}, [icon('directions_walk', { size: 'sm' }), `Queue Bay ${q.bay} · ${q.walk} min walk from the exit`]),
            el('li', {}, [icon('timer', { size: 'sm' }), `Wait now: about ${q.waitMins} min · ${q.cars} cars in the queue`]),
          ]),
          badge('All-in fare', 'success'),
        ], { selected: true, cls: 'ride-card' }),
        el('p', { class: 'fine-print', text: 'Booked fares are cheaper. Next time, add your flight before you land.' }),
      ]),
    ],
    foot: actionBar([
      el('div', { class: 'total' }, [el('p', { class: 'total__amount', text: `${rupees(fare)} all-in` }), el('p', { class: 'total__sub', text: 'Nothing more to pay' })]),
      button({ label: 'Get a car', onClick: paySheet }),
    ], { split: true }),
  });
  return node;
}

/* ═══════════════════════ X1l Assigning the next car ═══════════════════════ */

export function assigning(params = {}) {
  const d = store.get().draft;
  const t = setTimeout(() => {
    const trip = {
      id: `SF-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      instant: true,
      status: 'active',
      phase: params.empty ? 'queueEmpty' : 'assigned',
      flightKey: null,
      day: 'Today',
      rideId: params.rideId || 'cab',
      fare: params.fare,
      bags: d ? d.bags : store.get().defaultBags,
      dropId: d ? d.dropId : null,
      method: params.method,
      driverId: params.next ? 'imran' : 'santosh',
      skipUsed: !!params.next,
      bookedAt: Date.now(),
    };
    store.set({ trip, draft: null });
    router.resetTo([{ name: 'home' }, { name: params.empty ? 'queueEmpty' : 'yourCar', params: { next: !!params.next } }], { transition: 'fade' });
  }, 2400);
  const node = el('main', { class: 'screen screen--center', 'aria-label': 'Assigning the next car' }, [
    el('div', { class: 'center-state' }, [
      illustration('finding-driver.png', 'A car pulling out of the airport taxi queue', { width: 200, height: 150, cls: 'state-art' }),
      el('h1', { class: 'screen__title', text: params.next ? 'Getting the next car' : 'Assigning the next car' }),
      el('p', { class: 'screen__lead', text: 'From the T2 queue, a car that fits your bags.' }),
      el('span', { class: 'progress progress--indeterminate', role: 'progressbar', 'aria-label': 'Assigning a car' }, el('span', { class: 'progress__fill' })),
    ]),
  ]);
  node._cleanup = () => clearTimeout(t);
  return node;
}

/* ═══════════════════════ X2 / X2b Your car ═══════════════════════ */

export function yourCar(params = {}) {
  const t = store.get().trip;
  if (!t) { setTimeout(() => router.reset('home'), 0); return el('main', { class: 'screen' }); }
  const d = store.driver(t.driverId);
  const q = data.QUEUE;

  function skip() {
    dialog({
      title: 'Skip this car?',
      text: 'You keep your place in line. You can skip once.',
      actions: [
        { label: 'Skip this car', onClick: () => {
          const cur = store.get().trip;
          store.set({ trip: null, draft: { instant: true, bags: cur.bags, dropId: cur.dropId, rideId: cur.rideId, day: 'Today' } });
          router.resetTo([{ name: 'home' }, { name: 'assigning', params: { next: true, fare: cur.fare, rideId: cur.rideId, method: cur.method } }], { transition: 'fade' });
        } },
        { label: `Keep ${d.first}`, variant: 'ghost' },
      ],
    });
  }

  return screen({
    name: 'your-car',
    label: 'Your car',
    head: header({ title: 'Your car', onBack: () => router.backTo('home') }),
    body: [
      el('div', { class: 'ride stagger' }, [
        card([
          el('div', { class: 'driver-head' }, [
            avatar(d.name, { size: 'lg' }),
            el('div', { class: 'row__body' }, [el('p', { class: 'driver-head__name', text: d.name }), el('p', { class: 'row__sub' }, [icon('star', { size: 'xs', fill: true }), ` ${d.rating} rating · ${d.trips} trips`])]),
          ]),
          el('div', { class: 'driver-car' }, [el('p', { class: 'row__sub', text: d.car }), plate(d.plate)]),
        ], { cls: 'driver-card' }),
        card([el('p', { class: 'overline', text: 'Hub record' }), row({ lead: iconCircle('verified', { tone: 'success' }), title: 'Logged at the T2 queue for this booking', sub: d.record })], { cls: 'tip-card tip-card--stack hub-card' }),
        card(kv([['Queue bay', `${q.bay}, staffed`], ['Walk', `About ${q.walk} min`], ['Fare', `${rupees(t.fare)}, paid`]]), { cls: 'kv-card' }),
      ]),
    ],
    foot: actionBar([
      button({ label: 'Walk to the car', iconLeft: 'directions_walk', block: true, onClick: () => { toast(`Show ${d.first} your code at Bay ${q.bay}.`, { iconName: 'pin' }); toPhase('meet'); } }),
      !t.skipUsed ? button({ label: 'Skip this car', variant: 'ghost', block: true, onClick: skip }) : null,
    ]),
  });
}

/* ═══════════════════════ X2e Queue empty ═══════════════════════ */

export function queueEmpty() {
  const t = store.get().trip;
  if (!t) { setTimeout(() => router.reset('home'), 0); return el('main', { class: 'screen' }); }
  const q = data.QUEUE;
  return screen({
    name: 'queue-empty',
    label: 'Queue empty',
    head: header({ title: 'Your car', onBack: () => router.backTo('home') }),
    body: [
      el('div', { class: 'stagger' }, [
        illustration('no-cars-queue.png', 'An empty taxi queue lane', { width: 200, height: 150, cls: 'state-art' }),
        el('h1', { class: 'screen__title', text: 'The T2 queue is empty right now' }),
        el('p', { class: 'screen__lead', text: `You have paid ${rupees(t.fare)}. Here is what happens next.` }),
        card(kv([['Next car expected', 'about 15 min'], ['Cars on the way', '3'], ['Your place', 'First in line']]), { cls: 'kv-card kv-card--full' }),
        card(row({ lead: iconCircle('shield_person', { tone: 'success' }), title: 'Wait at the safe waiting point', sub: `Lit and staffed, next to Bay ${q.bay} · water and seating` }), { cls: 'share-card' }),
      ]),
    ],
    foot: actionBar([
      button({ label: 'Keep my place', block: true, onClick: () => {
        toast('A car has joined the queue. Assigning it to you.', { type: 'success' });
        const cur = store.get().trip;
        store.set({ trip: null, draft: { instant: true, bags: cur.bags, dropId: cur.dropId, rideId: cur.rideId, day: 'Today' } });
        router.resetTo([{ name: 'home' }, { name: 'assigning', params: { fare: cur.fare, rideId: cur.rideId, method: cur.method } }], { transition: 'fade' });
      } }),
      button({ label: 'Cancel and get refund', variant: 'ghost', block: true, onClick: () => dialog({
        title: `Cancel and get ${rupees(t.fare)} back?`,
        text: 'No fee. The wait is on us, not you.',
        actions: [
          { label: 'Cancel and refund', variant: 'destructive', onClick: () => {
            const cur = store.get().trip;
            const s = store.get();
            store.set({ history: [{ ...cur, status: 'cancelled', refund: cur.fare, endedAt: Date.now() }, ...s.history], trip: null });
            router.resetTo([{ name: 'home' }, { name: 'rideCancelled', params: { id: cur.id, refund: cur.fare, method: cur.method, noFee: true } }], { transition: 'fade' });
          } },
          { label: 'Keep waiting', variant: 'ghost' },
        ],
      }) }),
    ]),
  });
}
