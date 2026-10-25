// localStorage-backed state with a silent in-memory fallback, plus pub/sub.

import * as data from './data.js';

const KEY = 'safarnaama.v1';

const initialState = () => ({
  onboarded: false,
  signedIn: false,
  user: { name: '', phone: '', language: 'en' },
  permissions: { location: null, notifications: null },   // null | 'granted' | 'denied'
  notifyTypes: data.NOTIFICATION_TYPES.map((n) => n.id),
  home: null,               // { addressId, label }
  poolWomenOnly: false,
  theme: null,              // null = follow system
  otp: { tries: 0, lockUntil: 0 },
  draft: null,              // booking in progress
  trip: null,               // locked ride
  paymentMethod: 'upi',
  womenPoolAsked: false,
  contacts: data.CONTACTS.map((c) => ({ ...c })),
  autoShare: false,
  credit: 0,                // ₹ credit from guarantees
  history: [],              // completed trips, newest first
  cases: [],                // help cases
  defaultBags: { cabin: 1, checkin: 1, people: 1 },
  offline: false,           // simulated offline
});

let memory = null;
let storageOk = true;

try {
  const probe = '__probe__';
  window.localStorage.setItem(probe, probe);
  window.localStorage.removeItem(probe);
} catch {
  storageOk = false;
}

function load() {
  if (storageOk) {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) return { ...initialState(), ...JSON.parse(raw) };
    } catch {
      storageOk = false;
    }
  }
  return memory ? structuredClone(memory) : initialState();
}

let state = load();
const listeners = new Set();

function persist() {
  memory = structuredClone(state);
  if (!storageOk) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    storageOk = false;
  }
}

export function get() {
  return state;
}

export function set(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  persist();
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function reset() {
  state = initialState();
  persist();
  listeners.forEach((fn) => fn(state));
}

// ── Selectors ──

export function firstName() {
  return (state.user.name || '').trim().split(/\s+/)[0] || '';
}

export function address(id) {
  return data.ADDRESSES.find((a) => a.id === id) || null;
}

export function homeAddress() {
  return state.home ? address(state.home.addressId) : null;
}

export function findFlight(raw) {
  const key = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (key === 'MANUAL') return (state.draft && state.draft.manual) || (state.trip && state.trip.manual) || null;
  return data.FLIGHTS[key] || null;
}

export function ride(id) {
  return data.RIDES.find((r) => r.id === id);
}

export function rideFits(r, bags) {
  return bags.cabin <= r.capacity.cabin
    && bags.checkin <= r.capacity.checkin
    && bags.people <= r.capacity.people;
}

// Cab if it fits, else SUV. Solo is always the default, so pool and auto are never recommended.
export function recommendedRide(bags) {
  return ['cab', 'suv'].map(ride).find((r) => rideFits(r, bags)) || ride('suv');
}

export function bay(terminal) {
  return data.BAYS[terminal] || data.BAYS.T2;
}

export function driver(id) {
  return data.DRIVERS.find((d) => d.id === id) || data.DRIVERS[0];
}

// Merge into the live trip
export function patchTrip(patch) {
  const t = state.trip;
  if (!t) return;
  set({ trip: { ...t, ...patch } });
}

export { data };
