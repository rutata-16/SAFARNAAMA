// Entry: shell, theme, route table, initial route.

import * as store from './store.js';
import * as router from './router.js';
import * as screens from './screens.js';
import * as booking from './booking.js';
import * as journey from './journey.js';
import * as instant from './instant.js';
import { mountShell } from './components.js';

const phone = document.querySelector('.phone');
const viewport = document.querySelector('.viewport');

// ── Theme: stored choice, else follow the system ──
const media = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = store.get().theme || (media.matches ? 'dark' : 'light');
  phone.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', t === 'dark' ? '#0D0C1D' : '#FAF7F2');
}
media.addEventListener('change', applyTheme);
store.subscribe(applyTheme);
applyTheme();

// Real connectivity changes re-render the current screen (Home shows the offline banner)
window.addEventListener('offline', () => router.refresh());
window.addEventListener('online', () => router.refresh());

// ── Mock status bar clock ──
const clock = document.querySelector('.statusbar__time');
function tick() {
  const d = new Date();
  clock.textContent = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
}
tick();
setInterval(tick, 30000);

mountShell(phone);

router.init({
  viewportEl: viewport,
  phoneEl: phone,
  table: {
    splash: screens.splash,
    welcome: screens.welcome,
    phone: screens.phone,
    otp: screens.otp,
    otpLocked: screens.otpLocked,
    name: screens.name,
    location: screens.location,
    locationOff: screens.locationOff,
    notifications: screens.notifications,
    saveHome: screens.saveHome,
    pool: screens.pool,
    home: screens.home,
    whereTo: booking.whereTo,
    bags: booking.bags,
    book: booking.book,
    poolDetails: booking.poolDetails,
    manualArrival: screens.manualArrival,
    landed: screens.landed,
    otherWays: screens.otherWays,
    locking: journey.locking,
    locked: journey.locked,
    ride: journey.ride,
    rideCancelled: journey.rideCancelled,
    flightCancelled: journey.flightCancelled,
    welcomeMumbai: journey.welcomeMumbai,
    bagsHold: journey.bagsHold,
    finding: journey.finding,
    driver: journey.driver,
    noCars: journey.noCars,
    walk: journey.walk,
    chat: journey.chat,
    meet: journey.meet,
    onTrip: journey.onTrip,
    sos: journey.sos,
    arrived: journey.arrived,
    rate: journey.rate,
    tripDone: journey.tripDone,
    report: journey.report,
    caseReceived: journey.caseReceived,
    exitNow: instant.exitNow,
    assigning: instant.assigning,
    yourCar: instant.yourCar,
    queueEmpty: instant.queueEmpty,
    pastTrip: screens.pastTrip,
    contacts: screens.contacts,
    trips: screens.trips,
    help: screens.help,
    profile: screens.profile,
  },
});

router.reset('splash', {}, { transition: 'none' });
