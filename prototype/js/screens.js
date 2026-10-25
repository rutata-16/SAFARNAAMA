// Every route as a factory returning a DOM node.
// 01 · First launch and sign in  →  splash … pool
// 02 · Home and adding your arrival  →  home, book, ride (+ tab screens)

import * as store from './store.js';
import * as router from './router.js';
import { icon } from './icons.js';
import { openTrip, shareSheet, extraSheet, tripInfo } from './journey.js';
import {
  el, rupees, button, iconButton, link, header, screen, actionBar, card, iconCircle, row, badge, wipBadge,
  spinner, skeleton, textField, fieldError, setFieldError, checkbox, toggle, radioGroup, chipGroup, stepper,
  illustration, map, logo, emptyState, sheet, confirmSheet, systemAlert, toast, comingSoon, keypad, tabbar, announce,
  simulate, dialog, avatar,
} from './components.js';

const { data } = store;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ═══════════════════════ Onboarding helpers ═══════════════════════ */

// In "gate" mode the sign-in steps were opened from a booking or profile; they return there afterwards.
function afterSignIn(params) {
  if (!store.get().user.name) {
    router.go('name', params);
    return;
  }
  finishGate(params);
}

function finishGate(params) {
  if (params.mode === 'gate') {
    router.backTo(params.returnTo || 'home');
    toast(`Signed in. Welcome, ${store.firstName()}.`, { type: 'success' });
    return;
  }
  // Returning user who logged out: straight back home
  if (store.get().onboarded) {
    router.reset('home', {}, { transition: 'fade' });
    toast(`Welcome back, ${store.firstName()}.`, { type: 'success' });
    return;
  }
  router.go('location');
}

function skipLink(onClick) {
  return link({ label: 'Skip', underline: true, body: true, muted: true, onClick });
}

function keyboardFoot(btn, pad) {
  return el('div', { class: 'kb-foot' }, [el('div', { class: 'kb-foot__action' }, btn), pad]);
}

function formatPhone(digits) {
  return digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
}

function mmss(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ═══════════════════════ Splash ═══════════════════════ */

export function splash() {
  const node = el('main', { class: 'screen screen--splash', 'aria-label': 'Safarnaama' }, [
    el('div', { class: 'splash__center' }, [
      logo({ size: 'xl' }),
      el('h1', { class: 'splash__word', text: 'Safarnaama' }),
      el('p', { class: 'splash__tag', text: 'Your ride home, sorted before you land' }),
    ]),
    el('div', { class: 'splash__foot' }, [el('span', { class: 'splash__bar' })]),
  ]);
  node.dataset.status = 'light';
  node.dataset.bleed = 'true';
  const t = setTimeout(() => {
    router.reset(store.get().onboarded ? 'home' : 'welcome', {}, { transition: 'fade' });
  }, 2100);
  node._cleanup = () => clearTimeout(t);
  return node;
}

/* ═══════════════════════ O1 Welcome ═══════════════════════ */

export function welcome() {
  const features = [
    { icon: 'currency_rupee', title: 'All-in fare, fixed', sub: 'No cash, tolls or extras on top' },
    { icon: 'pin_drop', title: 'One numbered pickup bay', sub: 'Step-by-step from the baggage belt' },
    { icon: 'verified_user', title: 'A ride that holds', sub: 'Driver cancels? A new one, same fare' },
  ];
  const node = screen({
    name: 'welcome',
    label: 'Welcome to Safarnaama',
    body: [
      el('div', { class: 'welcome__hero' }, illustration('welcome-hero.png', 'A traveller walks out of arrivals with her suitcase towards a car waiting at pickup bay 1', { width: 390, height: 300, cls: 'welcome__img' })),
      el('div', { class: 'welcome__content stagger' }, [
        el('div', { class: 'brand-lockup' }, [logo(), el('h1', { class: 'brand-lockup__word', text: 'Safarnaama' })]),
        el('p', { class: 'welcome__pitch', text: 'Your ride home from the airport, locked in before you land.' }),
        el('ul', { class: 'feature-list' }, features.map((f) => el('li', {}, row({ lead: iconCircle(f.icon), title: f.title, sub: f.sub })))),
      ]),
    ],
    foot: actionBar(
      button({ label: 'Get started', block: true, onClick: () => router.go('phone') }),
      { plain: true, note: 'No app with you? Scan the Safarnaama QR at the arrivals exit.' },
    ),
  });
  node.dataset.bleed = 'true';
  return node;
}

/* ═══════════════════════ O2 Phone number ═══════════════════════ */

export function phone(params = {}) {
  const gate = params.mode === 'gate';
  let digits = (store.get().user.phone || '').replace(/\D/g, '');
  let hasError = false;

  const display = el('span', { class: 'input__display' });
  const box = el('div', { class: 'input input--phone', role: 'textbox', 'aria-label': 'Mobile number', 'aria-describedby': 'phone-err', tabindex: '0' }, [
    el('span', { class: 'input__prefix', text: '+91' }), display,
  ]);
  const err = fieldError('phone-err');
  const cont = button({ label: 'Continue', block: true, onClick: submit });

  function paint() {
    display.replaceChildren();
    if (digits) display.append(formatPhone(digits));
    display.classList.toggle('is-placeholder', !digits);
    if (!digits) display.append(el('span', { class: 'caret' }), 'Mobile number');
    else display.append(el('span', { class: 'caret' }));
    box.setAttribute('aria-valuetext', formatPhone(digits));
    cont.disabled = !digits || hasError;
  }

  function setError(msg) {
    hasError = !!msg;
    box.classList.toggle('is-invalid', hasError);
    setFieldError(err, msg);
    if (msg) announce(msg);
    paint();
  }

  const pad = keypad({
    onDigit: (d) => { if (digits.length < 10) { digits += d; if (hasError) setError(''); paint(); } },
    onDelete: () => { digits = digits.slice(0, -1); if (hasError) setError(''); paint(); },
  });

  async function submit() {
    if (digits.length < 10) return setError('Enter a 10-digit mobile number');
    if (!/^[6-9]/.test(digits)) return setError('Indian mobile numbers start with 6, 7, 8 or 9');
    cont.setLoading(true, 'Sending code');
    await wait(900);
    const s = store.get();
    const sameNumber = s.user.phone === formatPhone(digits);
    store.set({ user: { ...s.user, phone: formatPhone(digits) }, otp: sameNumber ? s.otp : { tries: 0, lockUntil: 0 } });
    cont.setLoading(false);
    if (store.get().otp.lockUntil > Date.now()) router.go('otpLocked', params);
    else router.go('otp', params);
  }

  paint();
  const node = screen({
    name: 'phone',
    label: 'Mobile number',
    head: header({
      onBack: () => router.back(),
      right: gate ? null : skipLink(() => {
        store.set({ signedIn: false });
        router.go('location', { skipped: true });
        toast('No problem. You can sign in when you book a ride.');
      }),
    }),
    body: [
      el('h1', { class: 'screen__title', text: gate ? 'Sign in with your mobile number' : 'What is your mobile number?' }),
      el('p', { class: 'screen__lead', text: 'We will text you a 6-digit code to verify it.' }),
      el('div', { class: 'field field--spaced' }, [box, err]),
      el('p', { class: 'fine-print fine-print--spaced' }, [
        'By continuing you agree to the ',
        el('button', { type: 'button', onClick: () => comingSoon('Terms of Use') }, 'Terms of Use'),
        ' and ',
        el('button', { type: 'button', onClick: () => comingSoon('Privacy Policy') }, 'Privacy Policy'),
        '.',
      ]),
    ],
    foot: keyboardFoot(cont, pad),
  });
  node._cleanup = () => pad.destroy();
  return node;
}

/* ═══════════════════════ O3 Verify code ═══════════════════════ */

export function otp(params = {}) {
  let code = '';
  let verifying = false;
  let invalid = false;
  let resendLeft = data.OTP.resendSeconds;
  const timers = [];

  const boxes = Array.from({ length: 6 }, () => el('span', { class: 'otp__box', 'aria-hidden': 'true' }));
  const otpEl = el('div', { class: 'otp', role: 'textbox', 'aria-label': 'Six digit code', 'aria-describedby': 'otp-err', tabindex: '0' }, boxes);
  const err = fieldError('otp-err');
  const resendWrap = el('div', { class: 'otp__resend' });
  const verify = button({ label: 'Verify', block: true, onClick: () => submit() });

  function paint() {
    boxes.forEach((b, i) => {
      b.textContent = code[i] || '';
      b.classList.toggle('is-filled', !!code[i]);
      b.classList.toggle('is-active', i === code.length && !invalid);
    });
    otpEl.classList.toggle('is-invalid', invalid);
    otpEl.setAttribute('aria-valuetext', code.split('').join(' '));
    verify.disabled = code.length < 6 || verifying;
  }

  function paintResend() {
    if (resendLeft > 0) {
      resendWrap.replaceChildren(el('p', { class: 'field__hint', text: `Resend code in ${mmss(resendLeft)}` }));
    } else {
      resendWrap.replaceChildren(link({ label: 'Resend code', underline: true, onClick: resend }));
    }
  }

  function tick() {
    if (resendLeft > 0) { resendLeft -= 1; paintResend(); }
  }

  async function resend() {
    resendLeft = data.OTP.resendSeconds;
    paintResend();
    pad.setSuggestion(null);
    toast(`New code sent to +91 ${store.get().user.phone}`, { type: 'success', iconName: 'sms' });
    timers.push(setTimeout(showSuggestion, 1800));
  }

  function showSuggestion() {
    pad.setSuggestion({ value: data.OTP.code, onPick: () => { code = data.OTP.code; invalid = false; setFieldError(err, ''); paint(); submit(); } });
  }

  function onDigit(d) {
    if (verifying) return;
    if (invalid) { code = ''; invalid = false; setFieldError(err, ''); }
    if (code.length < 6) code += d;
    paint();
    if (code.length === 6) timers.push(setTimeout(submit, 250));
  }

  function onDelete() {
    if (verifying) return;
    if (invalid) { invalid = false; setFieldError(err, ''); }
    code = code.slice(0, -1);
    paint();
  }

  async function submit() {
    if (verifying || code.length < 6) return;
    verifying = true;
    verify.setLoading(true, 'Verifying');
    paint();
    await wait(800);
    verifying = false;
    verify.setLoading(false);

    if (code === data.OTP.code) {
      otpEl.classList.add('is-success');
      announce('Number verified');
      store.set({ signedIn: true, otp: { tries: 0, lockUntil: 0 } });
      await wait(450);
      afterSignIn(params);
      return;
    }

    const tries = store.get().otp.tries + 1;
    const left = data.OTP.maxTries - tries;
    if (left <= 0) {
      store.set({ otp: { tries, lockUntil: Date.now() + data.OTP.lockSeconds * 1000 } });
      router.go('otpLocked', params, { replace: true, transition: 'fade' });
      return;
    }
    store.set({ otp: { tries, lockUntil: 0 } });
    invalid = true;
    setFieldError(err, `That code does not match. ${left} ${left === 1 ? 'try' : 'tries'} left.`);
    announce(`That code does not match. ${left} tries left.`);
    resendLeft = 0;
    paintResend();
    paint();
  }

  const pad = keypad({ onDigit, onDelete });
  paint();
  paintResend();
  timers.push(setInterval(tick, 1000));
  timers.push(setTimeout(showSuggestion, params.viaCall ? 2600 : 1800));

  const node = screen({
    name: 'otp',
    label: 'Verify code',
    head: header({ onBack: () => router.back() }),
    body: [
      el('h1', { class: 'screen__title', text: 'Enter the 6-digit code' }),
      el('p', { class: 'screen__lead screen__lead--inline' }, [
        params.viaCall ? `Calling +91 ${store.get().user.phone} now ` : `Sent to +91 ${store.get().user.phone} `,
        link({ label: 'Edit', underline: true, onClick: () => router.back() }),
      ]),
      el('div', { class: 'field field--spaced' }, [otpEl, err]),
      resendWrap,
    ],
    foot: keyboardFoot(verify, pad),
  });
  node._cleanup = () => { pad.destroy(); timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); };
  return node;
}

/* ═══════════════════════ O3x Too many tries ═══════════════════════ */

export function otpLocked(params = {}) {
  const timeEl = el('p', { class: 'lock__time', 'aria-live': 'off' });
  const call = button({ label: 'Get the code on a call', variant: 'secondary', block: true, onClick: viaCall });
  const other = button({ label: 'Use a different number', variant: 'ghost', block: true, onClick: () => { store.set({ otp: { tries: 0, lockUntil: 0 } }); router.backTo('phone'); } });
  let interval = null;

  function paint() {
    const left = Math.max(0, Math.ceil((store.get().otp.lockUntil - Date.now()) / 1000));
    const m = String(Math.floor(left / 60)).padStart(2, '0');
    const s = String(left % 60).padStart(2, '0');
    timeEl.textContent = `${m}:${s}`;
    if (left === 0) {
      clearInterval(interval);
      timeEl.textContent = 'Now';
      call.setLabel('Send a new code');
      store.set({ otp: { tries: 0, lockUntil: 0 } });
    }
  }

  async function viaCall() {
    if (store.get().otp.lockUntil <= Date.now()) { router.go('otp', params, { replace: true }); return; }
    call.setLoading(true, 'Calling you');
    await wait(1200);
    store.set({ otp: { tries: 0, lockUntil: 0 } });
    toast(`You'll get a call on +91 ${store.get().user.phone} with your code`, { iconName: 'call' });
    router.go('otp', { ...params, viaCall: true }, { replace: true, transition: 'fade' });
  }

  paint();
  interval = setInterval(paint, 1000);
  const node = screen({
    name: 'locked',
    label: 'Too many tries',
    head: header({ onBack: () => router.backTo('phone') }),
    body: [
      el('div', { class: 'stagger' }, [
        iconCircle('lock', { tone: 'solid', size: 'lg' }),
        el('h1', { class: 'screen__title screen__title--gap', text: 'Too many tries' }),
        el('p', { class: 'screen__lead', text: 'For your security, wait a few minutes before asking for a new code.' }),
        card([el('p', { class: 'lock__label', text: 'You can try again in' }), timeEl], { cls: 'lock__card' }),
      ]),
    ],
    foot: actionBar([call, other]),
  });
  node._cleanup = () => clearInterval(interval);
  return node;
}

/* ═══════════════════════ O4 Name and language ═══════════════════════ */

export function name(params = {}) {
  const s = store.get();
  let language = s.user.language || 'en';
  const nameField = textField({ label: 'Full name', placeholder: 'Your name', value: s.user.name, autocomplete: 'name', autocapitalize: 'words', onInput: () => nameField.setError(''), onEnter: () => submit() });
  nameField.control.setAttribute('data-autofocus', '');

  const langs = radioGroup({
    label: 'App language',
    value: language,
    options: data.LANGUAGES.map((l) => ({
      value: l.id,
      label: l.label,
      sub: l.id === 'en' ? null : l.native,
      trail: l.available ? null : wipBadge('Coming soon'),
      disabled: !l.available,
      onDisabled: () => toast(`${l.label} is on the way. The app stays in English for now.`, { iconName: 'translate' }),
    })),
    onChange: (v) => { language = v; },
  });

  function submit() {
    const val = nameField.control.value.trim();
    if (!val) { nameField.setError('Enter your name so your driver knows who to look for'); nameField.control.focus(); return; }
    if (val.length < 2) { nameField.setError('That looks a little short. Enter your full name.'); return; }
    store.set({ user: { ...store.get().user, name: val.replace(/\s+/g, ' '), language } });
    finishGate(params);
  }

  const node = screen({
    name: 'name',
    label: 'Your name',
    head: header({ onBack: () => router.back() }),
    body: [
      el('h1', { class: 'screen__title', text: 'What should we call you?' }),
      el('p', { class: 'screen__lead', text: 'Your first name is shown to your driver.' }),
      el('div', { class: 'form-stack' }, [
        nameField,
        el('div', { class: 'field' }, [el('p', { class: 'field__label', id: 'lang-label', text: 'App language' }), langs]),
      ]),
    ],
    foot: actionBar(button({ label: 'Continue', block: true, onClick: submit })),
  });
  node._entered = () => nameField.control.focus({ preventScroll: true });
  return node;
}

/* ═══════════════════════ O5 Location ═══════════════════════ */

export function location() {
  function ask() {
    systemAlert({
      title: 'Allow “Safarnaama” to use your location?',
      msg: 'Used to guide you to your pickup bay and show your live trip.',
      media: map({ you: true, cls: 'map--alert' }),
      buttons: [
        { label: 'Allow Once', onClick: () => granted('once') },
        { label: 'Allow While Using App', onClick: () => granted('while') },
        { label: 'Don’t Allow', onClick: denied },
      ],
    });
  }
  function granted() {
    store.set({ permissions: { ...store.get().permissions, location: 'granted' } });
    router.go('notifications');
  }
  function denied() {
    store.set({ permissions: { ...store.get().permissions, location: 'denied' } });
    router.go('locationOff');
  }

  return screen({
    name: 'permission',
    label: 'Location permission',
    head: header({ onBack: () => router.back() }),
    body: [
      el('div', { class: 'permission stagger' }, [
        illustration('location-permission.png', 'A map pin guiding the way from the baggage belt to the pickup bay', { width: 200, height: 180, cls: 'permission__art' }),
        el('h1', { class: 'screen__title', text: 'Use your location for pickups' }),
        el('p', { class: 'screen__lead', text: 'We use it to guide you from the baggage belt to your pickup bay, and to share your trip only if you choose to. It is not used when the app is closed.' }),
      ]),
    ],
    foot: actionBar([
      button({ label: 'Allow location', block: true, onClick: ask }),
      button({ label: 'Not now', variant: 'ghost', block: true, onClick: denied }),
    ]),
  });
}

/* ═══════════════════════ O5x Location off ═══════════════════════ */

export function locationOff() {
  return screen({
    name: 'permission',
    label: 'Location off',
    head: header({ onBack: () => router.back() }),
    body: [
      el('div', { class: 'stagger' }, [
        iconCircle('info', { size: 'lg' }),
        el('h1', { class: 'screen__title screen__title--gap', text: 'No problem, you can still book' }),
        el('p', { class: 'screen__lead', text: 'We will use your flight number to find your terminal, and show written directions to your pickup bay.' }),
        card(row({ lead: el('span', { class: 'tip-icon' }, icon('settings')), title: 'Turn it on any time', sub: 'Settings, then Safarnaama, then Location' }), { sunken: true, cls: 'tip-card' }),
      ]),
    ],
    foot: actionBar([
      button({ label: 'Continue', block: true, onClick: () => router.go('notifications') }),
      button({ label: 'Open Settings', variant: 'ghost', block: true, onClick: () => toast('In the real app this opens iOS Settings for Safarnaama.', { iconName: 'settings' }) }),
    ]),
  });
}

/* ═══════════════════════ O6 Notifications ═══════════════════════ */

export function notifications() {
  const chosen = new Set(store.get().notifyTypes);
  const allow = button({ label: 'Allow notifications', block: true, onClick: ask });

  function sync() {
    allow.setLabel(chosen.size ? 'Allow notifications' : 'Continue without alerts');
  }

  function ask() {
    store.set({ notifyTypes: [...chosen] });
    if (!chosen.size) { done('denied'); return; }
    systemAlert({
      title: '“Safarnaama” Would Like to Send You Notifications',
      msg: 'Notifications may include alerts, sounds and icon badges. These can be configured in Settings.',
      row: true,
      buttons: [
        { label: 'Don’t Allow', onClick: () => done('denied') },
        { label: 'Allow', bold: true, onClick: () => done('granted') },
      ],
    });
  }

  function done(state) {
    store.set({ permissions: { ...store.get().permissions, notifications: state } });
    if (state === 'denied') toast('Alerts are off. Check the app after you land.', { iconName: 'notifications_off' });
    router.go('saveHome');
  }

  sync();
  return screen({
    name: 'permission',
    label: 'Notifications',
    head: header({ onBack: () => router.back() }),
    body: [
      el('div', { class: 'permission stagger' }, [
        illustration('notification-permission.png', 'A phone showing a calm alert that the flight has landed', { width: 200, height: 160, cls: 'permission__art permission__art--wide' }),
        el('h1', { class: 'screen__title', text: 'Get told only when it matters' }),
        el('p', { class: 'screen__lead', text: 'Pick what you want to hear about. No offers, no spam.' }),
        el('div', { class: 'check-list', role: 'group', 'aria-label': 'Notification types' }, data.NOTIFICATION_TYPES.map((n) => checkbox({
          label: n.label,
          checked: chosen.has(n.id),
          onChange: (on) => { if (on) chosen.add(n.id); else chosen.delete(n.id); sync(); },
        }))),
      ]),
    ],
    foot: actionBar([
      allow,
      button({ label: 'Not now', variant: 'ghost', block: true, onClick: () => done('denied') }),
    ]),
  });
}

/* ═══════════════════════ O7 Save Home ═══════════════════════ */

export function saveHome(params = {}) {
  const editing = params.mode === 'edit';
  const existing = store.get().home;
  let selected = existing ? existing.addressId : null;
  let label = existing ? existing.label : 'Home';
  let searchTimer = null;

  const results = el('div', { class: 'search-results', role: 'listbox', 'aria-label': 'Address suggestions' });
  const idle = el('div', { class: 'save-home__idle' });
  const saveBtn = button({ label: `Save ${label}`, block: true, onClick: save });

  const search = textField({
    placeholder: 'Search your home address',
    iconName: 'search',
    clearable: true,
    autocomplete: 'street-address',
    onInput: (q) => {
      clearTimeout(searchTimer);
      if (!q.trim()) { results.hidden = true; idle.hidden = false; return; }
      results.hidden = false;
      idle.hidden = true;
      results.replaceChildren(...[0, 1, 2].map(() => el('div', { class: 'result-skeleton' }, [skeleton('sk-circle'), el('div', { class: 'sk-lines' }, [skeleton('sk-line'), skeleton('sk-line sk-line--short')])])));
      searchTimer = setTimeout(() => showResults(q), 450);
    },
  });
  search.control.setAttribute('aria-label', 'Search your home address');

  function showResults(q) {
    const term = q.trim().toLowerCase();
    const matches = data.ADDRESSES.filter((a) => a.line.toLowerCase().includes(term) || a.title.toLowerCase().includes(term));
    if (!matches.length) {
      results.replaceChildren(el('div', { class: 'search-empty' }, [
        icon('search_off'),
        el('p', {}, [el('strong', { text: `No matches for “${q.trim()}”` }), el('br'), 'Try a building, road or area, like “Hill Road” or “Powai”.']),
      ]));
      return;
    }
    results.replaceChildren(...matches.map((a) => row({
      lead: iconCircle('location_on'),
      title: a.title,
      sub: a.line,
      cls: 'list-row',
      onClick: () => pick(a.id),
    })));
    results.querySelectorAll('.row').forEach((r) => r.setAttribute('role', 'option'));
  }

  function pick(id) {
    selected = id;
    search.control.value = '';
    search.control.dispatchEvent(new Event('input'));
    search.control.blur();
    paintIdle();
  }

  async function useCurrent(btnRow) {
    if (store.get().permissions.location !== 'granted') {
      const s = sheet({
        title: 'Location is off',
        body: [el('p', { class: 'sheet-text', text: 'Turn on location for Safarnaama to use where you are now. Or search for your address instead, it works just as well.' })],
        foot: [
          button({ label: 'Allow location', block: true, onClick: () => { s.close(); store.set({ permissions: { ...store.get().permissions, location: 'granted' } }); useCurrent(btnRow); } }),
          button({ label: 'Search instead', variant: 'ghost', block: true, onClick: () => { s.close(); search.control.focus(); } }),
        ],
      });
      return;
    }
    const trail = btnRow.querySelector('.row__trail');
    trail.replaceChildren(spinner());
    btnRow.disabled = true;
    await wait(1100);
    pick(data.CURRENT_LOCATION_ADDRESS);
    announce('Found your location');
  }

  function paintIdle() {
    const addr = store.address(selected);
    const btnRow = row({
      lead: iconCircle('my_location'),
      title: 'Use my current location',
      trail: el('span'),
      cls: 'list-row',
      onClick: () => useCurrent(btnRow),
    });

    idle.replaceChildren(
      btnRow,
      map({ pin: !!addr, cls: 'map--save' }),
      addr
        ? card([el('p', { class: 'row__overline', text: label }), el('p', { class: 'addr-card__line', text: addr.line })], { cls: 'addr-card' })
        : card([el('p', { class: 'addr-card__empty', text: 'Search above or use your current location to drop a pin.' })], { cls: 'addr-card addr-card--empty' }),
      addr ? chipGroup({
        label: 'Save as',
        value: label,
        options: [
          { value: 'Home', label: 'Home', icon: 'home' },
          { value: 'Work', label: 'Work', icon: 'work' },
          { value: 'Other', label: 'Other', icon: 'location_on' },
        ],
        onChange: (v) => { label = v; saveBtn.setLabel(`Save ${v}`); idle.querySelector('.addr-card .row__overline').textContent = v; },
      }) : null,
    );
    saveBtn.disabled = !addr;
  }

  function save() {
    store.set({ home: { addressId: selected, label } });
    if (editing) {
      router.back();
      toast(`${label} saved`, { type: 'success' });
      return;
    }
    toast(`${label} saved. We'll use it as your drop.`, { type: 'success' });
    router.go('pool');
  }

  results.hidden = true;
  paintIdle();

  const node = screen({
    name: 'save-home',
    label: 'Save Home',
    head: header({
      title: 'Save Home',
      center: true,
      onBack: () => router.back(),
      right: editing ? el('span', { class: 'header__pad' }) : skipLink(() => router.go('pool')),
    }),
    body: [el('div', { class: 'form-stack form-stack--tight' }, [search, results, idle])],
    foot: actionBar(saveBtn),
  });
  node._cleanup = () => clearTimeout(searchTimer);
  return node;
}

/* ═══════════════════════ O8 Pool preference ═══════════════════════ */

export function pool() {
  let womenOnly = store.get().poolWomenOnly;
  const finish = button({ label: 'Finish', block: true, onClick: done });

  async function done(skipped) {
    store.set({ poolWomenOnly: skipped === true ? false : womenOnly });
    finish.setLoading(true, 'Setting things up');
    await wait(900);
    store.set({ onboarded: true });
    router.reset('home', {}, { transition: 'fade' });
    const n = store.firstName();
    toast(n ? `You're all set, ${n}.` : `You're all set. Add your flight when you're ready.`, { type: 'success' });
  }

  const sw = toggle({ checked: womenOnly, label: 'Show me women-only pool options', onChange: (v) => { womenOnly = v; } });

  return screen({
    name: 'pool',
    label: 'Pool preference',
    head: header({ onBack: () => router.back(), right: skipLink(() => done(true)) }),
    body: [
      el('h1', { class: 'screen__title', text: 'One last thing' }),
      el('p', { class: 'screen__lead', text: 'Optional. You can change this any time in Profile.' }),
      el('div', { class: 'form-stack' }, [
        card(el('div', { class: 'toggle-row' }, [
          el('div', { class: 'row__body' }, [
            el('p', { class: 'row__title', id: 'pool-title', text: 'Show me women-only pool options' }),
            el('p', { class: 'row__sub', text: 'Only used to offer pools where every co-rider is a woman. Never shown to drivers or co-riders.' }),
          ]),
          sw,
        ])),
        card(row({ lead: el('span', { class: 'tip-icon' }, icon('shield')), title: 'Solo is always the default', sub: 'Pooling only appears when a pool actually exists for your flight, and you can switch back to solo any time.' }), { sunken: true, cls: 'tip-card' }),
      ]),
    ],
    foot: actionBar(finish),
  });
}

/* ═══════════════════════ Tab shell ═══════════════════════ */

function isOffline() {
  return store.get().offline || !navigator.onLine;
}

export function goTab(id) {
  router.reset(id, {}, { transition: 'none' });
}

function tabScreen(name, label, body) {
  const node = screen({ name, label, body, foot: tabbar(name, goTab) });
  node.dataset.tabs = 'true';
  return node;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late,';
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export function howItWorksSheet() {
  const sh = sheet({
    title: 'How Safarnaama works',
    body: [el('ol', { class: 'how-list' }, data.HOW_IT_WORKS.map((h, i) => el('li', {}, row({
      lead: el('span', { class: 'how-list__num', text: i + 1 }),
      title: h.title,
      sub: h.text,
    }))))],
    foot: [button({ label: 'Got it', block: true, onClick: () => sh.close() })],
  });
}

export function signInGate(returnTo, reason) {
  const s = sheet({
    title: 'Sign in to lock this ride',
    body: [el('p', { class: 'sheet-text', text: reason || 'We need your mobile number so your driver can reach you and your receipt has somewhere to go. It takes 30 seconds.' })],
    foot: [
      button({ label: 'Sign in with mobile number', block: true, onClick: () => { s.close(); router.go('phone', { mode: 'gate', returnTo }); } }),
      button({ label: 'Not now', variant: 'ghost', block: true, onClick: () => s.close() }),
    ],
  });
}

export function flightStatusBadge(flight) {
  return flight.status === 'delayed'
    ? badge(`Delayed · ${flight.delayedTo}`, 'warning')
    : badge('On time', 'success');
}

const PHASE_TEXT = {
  scheduled: (i) => [`Lands ${i.landsAt} at ${i.f.terminal}`, 'Ride locked. We will tell you when to head out.'],
  landed: () => ['You have landed', 'Tap “I have my bags” when you have them'],
  hold: () => ['Waiting for your bags', 'Your car request is on hold'],
  finding: () => ['Finding your driver', 'Usually under a minute'],
  noCars: () => ['Waiting for a car', 'Next car expected in about 12 min'],
  driver: (i) => [`${i.d.first} is your driver`, `Walk to ${i.bayLabel}`],
  assigned: (i) => [`${i.d.first} is your driver`, `Walk to ${i.bayLabel}`],
  queueEmpty: () => ['Waiting for the next car', 'You are first in line'],
  walking: (i) => [`Walk to ${i.bayLabel}`, `${i.d.first} · ${i.d.plate}`],
  meet: (i) => [`Meet ${i.d.first} at ${i.bayLabel}`, `Code ${store.data.START_CODE}`],
  onTrip: (i) => ['On the way', `${i.d.first} · fare locked at ${rupees(i.fare)}`],
  sos: () => ['SOS is active', 'Help is on the way'],
  arrived: () => ['You have arrived', 'Check your bags before the car leaves'],
  rate: () => ['You have arrived', 'Rate your ride'],
};

export function tripCard(trip, { compact = false } = {}) {
  const i = tripInfo(trip);
  const r = i.r;
  const [title, foot] = (PHASE_TEXT[trip.phase] || PHASE_TEXT.scheduled)(i);
  const top = i.f ? `${i.f.number} · ${i.f.from} to ${i.f.to}` : 'Ride from the T2 exit';
  return el('button', { type: 'button', class: 'trip-card', onClick: openTrip, 'aria-label': `${title}. Open your ride.` }, [
    el('div', { class: 'trip-card__top' }, [
      el('span', { class: 'trip-card__flight' }, [icon(i.f ? 'flight' : 'hail', { size: 'xs' }), top]),
      trip.phase === 'scheduled' && i.f ? (trip.delayed ? badge('Delayed 40 min', 'warning') : flightStatusBadge(i.f)) : badge(trip.phase === 'sos' ? 'SOS' : 'Live', trip.phase === 'sos' ? 'error' : 'success'),
    ]),
    el('p', { class: 'trip-card__title', text: title }),
    el('p', { class: 'trip-card__meta', text: `${trip.day} · ${r.name} · ${i.bayLabel} · ${rupees(trip.fare)} paid` }),
    compact ? null : el('div', { class: 'trip-card__foot' }, [el('span', { text: foot }), icon('chevron_right')]),
  ]);
}

/* ═══════════════════════ H1 Home ═══════════════════════ */

export function home() {
  const s = store.get();
  const n = store.firstName();
  let day = 'Today';
  let looking = false;

  const flightInput = el('input', {
    class: 'flight-input__control',
    type: 'text',
    placeholder: 'Flight number, e.g. AI 864',
    autocomplete: 'off',
    autocapitalize: 'characters',
    spellcheck: 'false',
    maxlength: '8',
    enterkeyhint: 'search',
    'aria-label': 'Flight number',
    'aria-describedby': 'flight-msg',
  });
  const go = iconButton({ name: 'arrow_forward', label: 'Find flight', onClick: () => lookup() });
  go.classList.add('flight-input__go');
  go.hidden = true;
  const inputBox = el('div', { class: 'flight-input' }, [el('span', { class: 'flight-input__icon' }, icon('flight')), flightInput, go]);
  const msg = el('p', { class: 'hero__msg', id: 'flight-msg', 'aria-live': 'polite' });
  const examples = el('div', { class: 'hero__examples' }, [
    el('span', { text: 'Try ' }),
    ...data.FLIGHT_EXAMPLES.map((f) => el('button', { type: 'button', class: 'hero__example', onClick: () => { flightInput.value = f; onInput(); lookup(); } }, f)),
  ]);

  function setMsg(text, error = false) {
    msg.classList.toggle('is-error', error);
    msg.replaceChildren(...(error ? [icon('error', { size: 'xs' })] : []), el('span', { text }));
    inputBox.classList.toggle('is-invalid', error);
  }

  function onInput() {
    flightInput.value = flightInput.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    go.hidden = flightInput.value.replace(/\s/g, '').length < 3;
    if (msg.classList.contains('is-error')) setMsg('Fare, pickup bay and wait are fixed before you land.');
  }

  async function lookup() {
    if (looking) return;
    if (isOffline()) { setMsg('You are offline. Booking needs internet.', true); return; }
    const raw = flightInput.value.trim();
    const compact = raw.replace(/\s/g, '');
    if (!compact) { setMsg('Enter your flight number to see your ride.', true); flightInput.focus(); return; }
    if (!/^[A-Z0-9]{2}\d{2,4}$/.test(compact)) { setMsg('Flight numbers look like AI 864 or 6E 2134.', true); return; }
    looking = true;
    go.replaceChildren(spinner());
    go.disabled = true;
    setMsg(`Finding ${raw} ${day.toLowerCase()}…`);
    await wait(1000);
    looking = false;
    go.replaceChildren(icon('arrow_forward'));
    go.disabled = false;
    const flight = store.findFlight(compact);
    if (!flight) {
      setMsg(`We could not find ${raw} landing in Mumbai ${day.toLowerCase()}. Check the number on your boarding pass. Codeshare? Use the number on your ticket.`, true);
      msg.append(el('button', { type: 'button', class: 'hero__example hero__manual', onClick: () => router.go('manualArrival') }, 'Enter arrival by hand'));
      return;
    }
    if (flight.status === 'landed') { router.go('landed', { key: compact }); return; }
    if (flight.twice) {
      const sh = sheet({
        title: `${flight.number} flies twice in the next day`,
        sub: 'Pick the one you are on.',
        body: [radioGroup({
          label: 'Which flight',
          value: null,
          options: ['Today', 'Tomorrow'].map((dd) => ({ value: dd, label: `${dd} · lands ${flight.arrivalShort}`, sub: `Terminal ${flight.terminal.slice(1)} · from ${flight.fromCity}` })),
          onChange: (v) => { setTimeout(() => { sh.close(); day = v; startDraft(compact); }, 160); },
        })],
      });
      return;
    }
    startDraft(compact);
  }

  function startDraft(compact) {
    const flight = store.findFlight(compact);
    if (flight.to !== 'BOM') { setMsg(`${flight.number} doesn't land in Mumbai. Safarnaama works at Mumbai airport for now.`, true); return; }
    const key = compact;
    store.set({
      draft: {
        flightKey: key,
        day,
        bags: { ...store.get().defaultBags },
        rideId: null,
        dropId: store.get().home ? store.get().home.addressId : null,
      },
    });
    router.go(store.get().draft.dropId ? 'book' : 'whereTo');
  }

  flightInput.addEventListener('input', onInput);
  flightInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); lookup(); } });

  const hero = s.trip ? null : el('section', { class: 'hero', 'aria-labelledby': 'hero-title' }, [
    el('p', { class: 'hero__over', text: 'Landing soon?' }),
    el('h2', { class: 'hero__title', id: 'hero-title', text: 'Lock your ride home before you land' }),
    inputBox,
    chipGroup({ label: 'Day of arrival', value: day, onBrand: true, options: [{ value: 'Today', label: 'Today' }, { value: 'Tomorrow', label: 'Tomorrow' }], onChange: (v) => { day = v; } }),
    msg,
    examples,
  ]);
  if (hero) setMsg('Fare, pickup bay and wait are fixed before you land.');

  const upcoming = s.trip ? el('section', { class: 'home-section', 'aria-label': 'Upcoming ride' }, [
    el('p', { class: 'overline overline--section', text: 'Your ride home' }),
    tripCard(s.trip),
  ]) : null;

  const offline = isOffline() ? el('div', { class: 'live-banner live-banner--warning offline-banner', role: 'status' }, [
    el('span', { class: 'live-banner__icon' }, icon('cloud_off', { size: 'sm', fill: true })),
    el('div', { class: 'live-banner__body' }, [
      el('p', { class: 'live-banner__title', text: 'You are offline' }),
      el('p', { class: 'live-banner__text', text: 'Booking needs internet. Any locked ride stays on this phone.' }),
    ]),
    button({ label: 'Retry', size: 'sm', variant: 'secondary', onClick: async (e) => {
      const b = e.currentTarget;
      b.setLoading(true, 'Checking');
      await wait(900);
      if (navigator.onLine) { store.set({ offline: false }); router.refresh(); toast('Back online', { type: 'success', iconName: 'wifi' }); }
      else { b.setLoading(false); toast('Still offline. Check your connection.', { type: 'error' }); }
    } }),
  ]) : null;

  const guest = !s.signedIn ? card(row({
    lead: iconCircle('person', { tone: 'accent' }),
    title: 'You are browsing as a guest',
    sub: 'Sign in when you are ready to lock a ride.',
    trail: link({ label: 'Sign in', onClick: () => router.go('phone', { mode: 'gate', returnTo: 'home' }) }),
  }), { cls: 'guest-card' }) : null;

  const node = tabScreen('home', 'Home', [
    el('div', { class: 'home stagger' }, [
      el('div', { class: 'greet' }, [
        el('div', {}, [
          el('p', { class: 'greet__hello', text: n ? greeting() : greeting().replace(',', '') }),
          el('h1', { class: 'greet__name', text: n || 'Welcome' }),
        ]),
        el('div', { class: 'greet__actions' }, [
          simulate([
            isOffline() ? { label: 'Come back online', icon: 'wifi', onClick: () => { store.set({ offline: false }); router.refresh(); } } : { label: 'Go offline', icon: 'cloud_off', onClick: () => { store.set({ offline: true }); router.refresh(); } },
          ]),
          iconButton({ name: 'notifications', label: 'Notifications', variant: 'tinted', fill: true, onClick: notificationsSheet }),
        ]),
      ]),
      offline,
      hero,
      upcoming,
      guest,
      el('button', { type: 'button', class: 'card card--interactive exit-card', onClick: () => (isOffline() ? toast('You are offline. Booking needs internet.', { type: 'error' }) : router.go('exitNow')) }, row({
        lead: iconCircle('local_taxi', { tone: 'accent' }),
        title: 'At the exit now?',
        sub: 'Take the next car from the queue at a fixed fare',
        trail: icon('chevron_right'),
      })),
      el('section', { class: 'home-section', 'aria-labelledby': 'gtk' }, [
        el('h2', { class: 'overline overline--section', id: 'gtk', text: 'Good to know' }),
        row({ lead: iconCircle('info'), title: 'How Safarnaama works', sub: 'Fixed fare, numbered bay, ride guarantee', trail: icon('chevron_right'), cls: 'list-row', onClick: howItWorksSheet }),
        row({ lead: iconCircle('group'), title: 'Add someone to share trips with', sub: 'They see your flight, driver and live trip', trail: icon('chevron_right'), cls: 'list-row', onClick: () => router.go('contacts') }),
      ]),
    ]),
  ]);
  return node;
}

function notificationsSheet() {
  const s = store.get();
  const off = s.permissions.notifications !== 'granted';
  const sh = sheet({
    title: 'Notifications',
    body: [emptyState({
      art: iconCircle(off ? 'notifications_off' : 'notifications', { size: 'lg', tone: off ? 'accent' : '' }),
      title: 'Nothing new',
      text: off ? 'Alerts are off, so check here after you land. You can turn them on in Settings.' : s.trip ? 'We will tell you the moment your plane lands.' : 'Add your flight and we will tell you when it lands.',
    })],
    foot: [button({ label: 'Done', variant: 'secondary', block: true, onClick: () => sh.close() })],
  });
}

/* ═══════════════════════ B1m Enter arrival by hand ═══════════════════════ */

export function manualArrival() {
  let terminal = 'T2';
  let day = 'Today';
  const today = new Date();
  const dateLabel = (dd) => {
    const d = new Date(today.getTime() + (dd === 'Tomorrow' ? 86400000 : 0));
    return `${dd}, ${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
  };
  const time = el('input', { class: 'input__control', type: 'time', value: '22:40', 'aria-label': 'Landing time' });
  const err = fieldError('manual-err');

  function next() {
    if (!time.value) { setFieldError(err, 'Add the time your flight lands'); return; }
    const [h, m] = time.value.split(':').map(Number);
    const label = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
    const manual = { number: 'Your flight', airline: '', fromCity: 'entered by hand', from: '—', to: 'BOM', arrival: label.toUpperCase(), arrivalShort: label, terminal, belt: terminal === 'T2' ? 7 : 2, status: 'manual' };
    store.set({ draft: { flightKey: 'MANUAL', manual, day, bags: { ...store.get().defaultBags }, rideId: null, dropId: store.get().home ? store.get().home.addressId : null } });
    router.go(store.get().draft.dropId ? 'book' : 'whereTo', {}, { replace: true });
  }

  return screen({
    name: 'manual',
    label: 'Enter arrival by hand',
    head: header({ title: 'Your arrival', onBack: () => router.back() }),
    body: [
      el('h1', { class: 'screen__title', text: 'When and where do you land?' }),
      el('div', { class: 'form-stack' }, [
        el('div', { class: 'field' }, [el('p', { class: 'field__label', text: 'Terminal' }), chipGroup({ label: 'Terminal', value: terminal, options: [{ value: 'T1', label: 'Terminal 1' }, { value: 'T2', label: 'Terminal 2' }], onChange: (v) => { terminal = v; } })]),
        el('div', { class: 'field' }, [el('p', { class: 'field__label', text: 'Date' }), chipGroup({ label: 'Date', value: day, options: ['Today', 'Tomorrow'].map((dd) => ({ value: dd, label: dateLabel(dd) })), onChange: (v) => { day = v; } })]),
        el('div', { class: 'field' }, [el('label', { class: 'field__label', text: 'Landing time' }), el('div', { class: 'input' }, [el('span', { class: 'input__icon' }, icon('schedule')), time]), err]),
        card(row({ lead: el('span', { class: 'tip-icon tip-icon--warn' }, icon('info')), title: 'We cannot track a flight entered by hand', sub: 'If you are late, update the time here. Free waiting starts from the time you enter.' }), { cls: 'tip-card tip-card--warn' }),
      ]),
    ],
    foot: actionBar(button({ label: 'Continue', block: true, onClick: next })),
  });
}

/* ═══════════════════════ B1x Flight already landed ═══════════════════════ */

export function landed(params = {}) {
  const f = store.findFlight(params.key || '');
  if (!f) { setTimeout(() => router.back(), 0); return el('main', { class: 'screen' }); }
  return screen({
    name: 'landed',
    label: 'Flight already landed',
    head: header({ title: 'Add your arrival', onBack: () => router.back() }),
    body: [
      el('div', { class: 'stagger' }, [
        iconCircle('flight_land', { size: 'lg', tone: 'accent' }),
        el('h1', { class: 'screen__title screen__title--gap', text: `${f.number} landed ${f.landedMinsAgo} min ago` }),
        el('p', { class: 'screen__lead', text: 'Already at the arrivals exit? Take the next car from the queue at a fixed fare.' }),
        card(el('dl', { class: 'kv' }, [
          el('dt', { text: 'Landed' }), el('dd', { text: f.arrivalShort }),
          el('dt', { text: 'Terminal' }), el('dd', { text: f.terminal }),
          el('dt', { text: 'Baggage belt' }), el('dd', { text: String(f.belt) }),
        ]), { cls: 'kv-card kv-card--full' }),
      ]),
    ],
    foot: actionBar([
      button({ label: 'Get the next car', iconLeft: 'hail', block: true, onClick: () => router.go('exitNow', {}, { replace: true }) }),
      button({ label: 'Enter a different flight', variant: 'ghost', block: true, onClick: () => router.back() }),
    ]),
  });
}

/* ═══════════════════════ B2w Other ways out of T2 ═══════════════════════ */

export function otherWays() {
  return screen({
    name: 'other-ways',
    label: 'Other ways out of T2',
    head: header({ title: 'Other ways out of T2', onBack: () => router.back() }),
    body: [
      el('p', { class: 'screen__lead', text: 'For information. Walk times are from baggage claim. We do not book these.' }),
      el('ul', { class: 'way-list' }, data.OTHER_WAYS_OUT.map((w) => el('li', {}, card([
        row({ lead: iconCircle(w.icon), title: w.title, sub: w.where, trail: el('span', { class: 'way-list__price', text: w.price }) }),
        el('p', { class: 'way-list__walk' }, [icon('directions_walk', { size: 'xs' }), w.walk]),
      ], { cls: 'way-card' })))),
    ],
  });
}

/* ═══════════════════════ T1 / T0 Trips ═══════════════════════ */

function tripRoute(t) {
  const drop = store.address(t.dropId);
  const home = store.get().home;
  const to = drop ? (home && home.addressId === drop.id ? home.label : drop.short) : 'drop';
  const from = t.instant ? 'T2' : (store.findFlight(t.flightKey || '') || { terminal: 'T2' }).terminal;
  return `${from} to ${to}`;
}

function when(ts) {
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? 'Today' : `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
}

export function trips() {
  const s = store.get();
  const has = s.trip || s.history.length || s.cases.length;
  if (!has) {
    return tabScreen('trips', 'Trips', [
      el('h1', { class: 'tab-title', text: 'Trips' }),
      emptyState({
        art: iconCircle('luggage', { size: 'lg' }),
        title: 'No trips yet',
        text: 'Lock your first ride home before you land. It shows up here, with the receipt once you are home.',
        action: button({ label: 'Add your arrival', variant: 'secondary', size: 'sm', onClick: () => goTab('home') }),
      }),
    ]);
  }
  return tabScreen('trips', 'Trips', [
    el('h1', { class: 'tab-title', text: 'Trips' }),
    s.trip ? el('section', { class: 'home-section' }, [el('p', { class: 'overline overline--section', text: 'Upcoming' }), tripCard(s.trip, { compact: true })]) : null,
    s.history.length ? el('section', { class: 'home-section', 'aria-labelledby': 'past' }, [
      el('h2', { class: 'overline overline--section', id: 'past', text: 'Past' }),
      ...s.history.map((t) => row({
        lead: iconCircle(t.status === 'cancelled' ? 'cancel' : 'check_circle', { tone: t.status === 'cancelled' ? '' : 'success' }),
        title: `${when(t.endedAt)} · ${tripRoute(t)}`,
        sub: t.status === 'cancelled' ? `Cancelled · ${rupees(t.refund || 0)} refunded` : `${rupees(t.fare)}${t.rating ? ` · you rated ${t.rating}` : ''}`,
        trail: icon('chevron_right'),
        cls: 'list-row',
        onClick: () => router.go('pastTrip', { id: t.id }),
      })),
    ]) : null,
    s.cases.length ? el('section', { class: 'home-section', 'aria-labelledby': 'cases' }, [
      el('h2', { class: 'overline overline--section', id: 'cases', text: 'Help cases' }),
      ...s.cases.map((c) => row({ lead: iconCircle('support_agent'), title: `${c.title} · ${c.id}`, trail: badge(c.status, 'warning'), cls: 'list-row', onClick: () => router.go('caseReceived', { id: c.id }) })),
    ]) : null,
  ]);
}

/* ═══════════════════════ T2 Past trip details ═══════════════════════ */

export function pastTrip(params = {}) {
  const t = store.get().history.find((h) => h.id === params.id);
  if (!t) { setTimeout(() => router.back(), 0); return el('main', { class: 'screen' }); }
  const d = store.driver(t.driverId);
  const drop = store.address(t.dropId);
  const time = new Date(t.endedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  const cancelled = t.status === 'cancelled';
  const rows = data.fareBreakdown(t.fare, drop ? drop.km : 18);
  return screen({
    name: 'past-trip',
    label: 'Trip details',
    head: header({ title: 'Trip details', onBack: () => router.back() }),
    body: [
      el('div', { class: 'book stagger' }, [
        card(el('dl', { class: 'kv' }, [
          el('dt', { text: 'Date' }), el('dd', { text: `${when(t.endedAt)}, ${time}` }),
          el('dt', { text: 'Route' }), el('dd', { text: `${tripRoute(t)}${drop ? ` · ${drop.km} km` : ''}` }),
          el('dt', { text: cancelled ? 'Status' : 'Driver' }), el('dd', { text: cancelled ? `Cancelled${t.reason ? ` · ${t.reason}` : ''}` : `${d.first} · ${d.plate}` }),
        ]), { cls: 'kv-card' }),
        cancelled
          ? card(el('dl', { class: 'fare-table' }, [el('dt', { class: 'fare-table__total', text: 'Refunded' }), el('dd', { class: 'fare-table__total', text: rupees(t.refund || 0) })]), { cls: 'kv-card' })
          : card(el('dl', { class: 'fare-table' }, [
            ...rows.flatMap((r) => [el('dt', { text: r.label }), el('dd', { text: rupees(r.amount) })]),
            el('dt', { class: 'fare-table__total', text: 'Total paid' }), el('dd', { class: 'fare-table__total', text: rupees(t.fare) }),
          ]), { cls: 'kv-card kv-card--pad' }),
        !cancelled ? el('div', { class: 'past-rating' }, [el('span', { class: 'row__sub', text: 'Your rating' }), el('span', { class: 'past-rating__stars', 'aria-label': t.rating ? `${t.rating} stars` : 'Not rated' }, t.rating ? Array.from({ length: 5 }, (_, n) => icon('star', { size: 'sm', fill: n < t.rating })) : 'Not rated')]) : null,
        row({ lead: iconCircle('support_agent'), title: 'Get help with this trip', trail: icon('chevron_right'), cls: 'list-row', onClick: () => goTab('help') }),
        !cancelled ? row({ lead: iconCircle('download'), title: 'Download receipt', trail: icon('chevron_right'), cls: 'list-row', onClick: () => toast(`Receipt for ${t.id} saved to Files`, { type: 'success', iconName: 'download' }) }) : null,
      ]),
    ],
  });
}

/* ═══════════════════════ R11 Help ═══════════════════════ */

export function help() {
  const s = store.get();
  const last = s.trip || s.history.find((h) => h.status === 'completed');
  const topic = (h) => {
    if (h.id === 'extra' && s.trip) return extraSheet();
    router.go('report', { topic: h.id });
  };
  return tabScreen('help', 'Help', [
    el('h1', { class: 'tab-title', text: 'Help' }),
    s.cases.length ? el('section', { class: 'home-section', 'aria-labelledby': 'open-cases' }, [
      el('h2', { class: 'overline overline--section', id: 'open-cases', text: 'Open cases' }),
      ...s.cases.map((c) => card(row({ lead: iconCircle('support_agent', { tone: 'accent' }), title: `${c.title} · ${c.id}`, sub: c.topic === 'bag' ? 'Driver contacted · reply within 10 min' : 'A named person is on it', trail: badge(c.status, 'warning'), onClick: () => router.go('caseReceived', { id: c.id }) }), { cls: 'case-card' })),
    ]) : emptyState({
      art: illustration('help-empty.png', 'A calm help desk with nothing waiting', { width: 200, height: 160 }),
      title: 'No open cases',
      text: 'If anything goes wrong on a trip, it shows up here and a real person picks it up.',
    }),
    el('section', { class: 'home-section', 'aria-labelledby': 'help-topics' }, [
      el('h2', { class: 'overline overline--section', id: 'help-topics', text: last ? `Your last trip · ${when(last.endedAt || last.bookedAt)}, ${tripRoute(last)}` : 'Get help with' }),
      ...data.HELP_TOPICS.map((h) => row({ lead: iconCircle(h.icon), title: h.label, trail: icon('chevron_right'), cls: 'list-row', onClick: () => topic(h) })),
    ]),
  ]);
}

/* ═══════════════════════ P1 Profile ═══════════════════════ */

export function profile() {
  const s = store.get();
  const homeAddr = store.homeAddress();
  const initials = (s.user.name || 'G').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const lang = data.LANGUAGES.find((l) => l.id === (s.user.language || 'en'));

  const themeChips = chipGroup({
    label: 'Appearance',
    value: s.theme || 'system',
    options: [{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }],
    onChange: (v) => store.set({ theme: v === 'system' ? null : v }),
  });

  const poolToggle = toggle({ checked: s.poolWomenOnly, label: 'Show me women-only pool options', onChange: (v) => { store.set({ poolWomenOnly: v }); toast(v ? 'Women-only pools will show when available' : 'Women-only pools turned off', { type: 'success' }); } });

  function languageSheet() {
    const sh = sheet({
      title: 'App language',
      body: [radioGroup({
        label: 'App language',
        value: s.user.language || 'en',
        options: data.LANGUAGES.map((l) => ({ value: l.id, label: l.label, sub: l.id === 'en' ? null : l.native, trail: l.available ? null : wipBadge('Coming soon'), disabled: !l.available, onDisabled: () => toast(`${l.label} is on the way. The app stays in English for now.`, { iconName: 'translate' }) })),
        onChange: () => setTimeout(() => sh.close(), 160),
      })],
    });
  }

  function paymentsSheet() {
    const sh = sheet({
      title: 'Payment methods',
      body: [
        ...data.PAYMENT_METHODS.map((m) => row({ lead: iconCircle(m.icon), title: m.label, sub: m.creditOnly ? `${rupees(s.credit)} available` : m.detail, trail: s.paymentMethod === m.id ? badge('Default', 'brand') : null, cls: 'list-row' })),
        card(row({ lead: el('span', { class: 'tip-icon' }, icon('money_off')), title: 'Cash is not accepted on app bookings', sub: 'So no one can ask you for cash at the drop.' }), { sunken: true, cls: 'tip-card' }),
      ],
      foot: [button({ label: 'Add a payment method', variant: 'secondary', block: true, onClick: () => { sh.close(); comingSoon('Adding payment methods'); } })],
    });
  }

  function bagsSheet() {
    const b = { ...s.defaultBags };
    const line = (title, key, min) => el('div', { class: 'bag-line' }, [el('p', { class: 'row__title row__body', text: title }), stepper({ label: title.toLowerCase(), value: b[key], min, max: 8, onChange: (v) => { b[key] = v; } })]);
    const sh = sheet({
      title: 'Default bags',
      sub: 'We fill these in every time you book. You can change them per trip.',
      body: [line('Cabin bags', 'cabin', 0), line('Check-in bags', 'checkin', 0)],
      foot: [button({ label: 'Save', block: true, onClick: () => { store.set({ defaultBags: { ...b, people: 1 } }); sh.close(); router.refresh(); toast('Default bags saved', { type: 'success' }); } })],
    });
  }

  function logout() {
    dialog({
      title: 'Log out?',
      text: s.trip && s.trip.flightKey ? `Your locked ride for ${store.findFlight(s.trip.flightKey).number} stays booked. Sign in again to see it.` : 'You can sign back in with your mobile number any time.',
      actions: [
        { label: 'Log out', variant: 'destructive', onClick: () => { store.set({ signedIn: false }); router.reset('welcome', {}, { transition: 'fade' }); } },
        { label: 'Cancel', variant: 'ghost' },
      ],
    });
  }

  const settingsRow = (lead, title, sub, onClick, trail) => row({ lead: iconCircle(lead), title, sub, trail: trail || icon('chevron_right'), cls: 'list-row', onClick });

  return tabScreen('profile', 'Profile', [
    el('h1', { class: 'tab-title', text: 'Profile' }),
    card(el('div', { class: 'me' }, [
      el('span', { class: 'me__avatar', 'aria-hidden': 'true', text: s.signedIn ? initials : '' }, s.signedIn ? null : icon('person')),
      el('div', { class: 'row__body' }, [
        el('p', { class: 'row__title', text: s.signedIn ? (s.user.name || 'Add your name') : 'Guest' }),
        el('p', { class: 'row__sub', text: s.signedIn ? `+91 ${s.user.phone}` : 'Sign in to lock rides and keep receipts' }),
      ]),
      s.signedIn ? null : button({ label: 'Sign in', size: 'sm', onClick: () => router.go('phone', { mode: 'gate', returnTo: 'profile' }) }),
    ])),
    el('section', { class: 'home-section', 'aria-label': 'Account' }, [
      settingsRow(homeAddr ? 'home' : 'add_home', 'Saved places', homeAddr ? `${s.home.label} · ${homeAddr.short}` : 'Add home', () => router.go('saveHome', { mode: 'edit' })),
      settingsRow('group', 'Trusted contacts', s.contacts.length ? s.contacts.map((c) => c.name.split(' ')[0]).join(', ') : 'None yet', () => router.go('contacts')),
      settingsRow('credit_card', 'Payment methods', `UPI, Visa ending 4417${s.credit ? ` · ${rupees(s.credit)} credit` : ''}`, paymentsSheet),
      settingsRow('translate', 'Language', lang ? lang.label : 'English', languageSheet),
      settingsRow('luggage', 'Default bags', `${s.defaultBags.cabin} cabin, ${s.defaultBags.checkin} check-in`, bagsSheet),
      settingsRow('notifications', 'Notifications', s.permissions.notifications === 'granted' ? 'On' : 'Off', () => toast('In the real app this opens iOS Settings for Safarnaama.', { iconName: 'settings' })),
    ]),
    el('section', { class: 'home-section', 'aria-label': 'Preferences' }, [
      el('div', { class: 'toggle-row list-row' }, [el('div', { class: 'row__body' }, [el('p', { class: 'row__title', text: 'Show me women-only pool options' }), el('p', { class: 'row__sub', text: 'Never shown to drivers or co-riders.' })]), poolToggle]),
      el('div', { class: 'pref-block' }, [el('p', { class: 'row__title', text: 'Appearance' }), themeChips]),
    ]),
    el('section', { class: 'home-section profile-actions', 'aria-label': 'Account actions' }, [
      s.signedIn ? button({ label: 'Log out', variant: 'danger-ghost', block: true, iconLeft: 'logout', onClick: logout }) : null,
      button({
        label: 'Reset prototype',
        variant: 'ghost',
        block: true,
        iconLeft: 'restart_alt',
        onClick: () => confirmSheet({
          title: 'Start over?',
          text: 'This clears your name, saved home, trips, settings and any locked ride, and takes you back to first launch.',
          confirmLabel: 'Reset everything',
          cancelLabel: 'Cancel',
          onConfirm: () => { store.reset(); router.reset('splash', {}, { transition: 'fade' }); },
        }),
      }),
    ]),
  ]);
}

/* ═══════════════════════ P2 Trusted contacts ═══════════════════════ */

export function contacts() {
  const s = store.get();
  const first = s.contacts[0];

  function addSheet() {
    const nameF = textField({ label: 'Name', placeholder: 'For example, Amma', autocomplete: 'name', onInput: () => nameF.setError('') });
    const phoneF = textField({ label: 'Mobile number', placeholder: '98200 11223', inputmode: 'numeric', autocomplete: 'tel', maxlength: '11', onInput: () => phoneF.setError('') });
    const sh = sheet({
      title: 'Add a trusted contact',
      sub: 'They get a text when you share a ride. No app needed.',
      body: [el('div', { class: 'form-stack form-stack--tight' }, [nameF, phoneF])],
      foot: [
        button({ label: 'Add contact', block: true, onClick: () => {
          const n = nameF.control.value.trim();
          const digits = phoneF.control.value.replace(/\D/g, '');
          let bad = false;
          if (!n) { nameF.setError('Add a name you will recognise'); bad = true; }
          if (digits.length !== 10 || !/^[6-9]/.test(digits)) { phoneF.setError('Enter a 10-digit Indian mobile number'); bad = true; }
          if (bad) return;
          if (s.contacts.length >= 5) { toast('You can add up to 5 trusted contacts.', { type: 'error' }); return; }
          const c = { id: `c${Date.now()}`, name: n, phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` };
          store.set({ contacts: [...store.get().contacts, c] });
          sh.close();
          router.refresh();
          toast(`${n} added`, { type: 'success' });
        } }),
        button({ label: 'Add from phone contacts', variant: 'ghost', block: true, onClick: () => comingSoon('Picking from phone contacts') }),
      ],
    });
    nameF.control.focus();
  }

  function remove(c) {
    confirmSheet({
      title: `Remove ${c.name}?`,
      text: 'They stop getting your ride updates, including any ride you are on now.',
      confirmLabel: 'Remove',
      cancelLabel: 'Keep',
      onConfirm: () => {
        const left = store.get().contacts.filter((x) => x.id !== c.id);
        store.set({ contacts: left, autoShare: left.length ? store.get().autoShare : false });
        if (store.get().trip && store.get().trip.sharingWith === c.id) store.patchTrip({ sharingWith: null });
        router.refresh();
        toast(`${c.name} removed`);
      },
    });
  }

  return screen({
    name: 'contacts',
    label: 'Trusted contacts',
    head: header({ title: 'Trusted contacts', onBack: () => router.back() }),
    body: [
      el('p', { class: 'screen__lead', text: 'They get your flight, driver and live trip when you share. Up to 5 people.' }),
      el('div', { class: 'contact-list' }, s.contacts.length ? s.contacts.map((c) => card(row({
        lead: avatar(c.name, { size: 'sm', tone: 'accent' }),
        title: c.name,
        sub: c.phone,
        trail: link({ label: 'Remove', onClick: () => remove(c) }),
      }), { cls: 'contact-card' })) : [emptyState({ art: iconCircle('group_add', { size: 'lg' }), title: 'No one yet', text: 'Add someone who should know when you land and when you reach home.' })]),
      row({ lead: iconCircle('person_add'), title: 'Add a contact', cls: 'list-row', onClick: addSheet }),
      first ? card(el('div', { class: 'toggle-row' }, [
        el('div', { class: 'row__body' }, [
          el('p', { class: 'row__title', text: 'Share every airport ride automatically' }),
          el('p', { class: 'row__sub', text: `With ${first.name.split(' ')[0]}, from landing until you reach home.` }),
        ]),
        toggle({ checked: s.autoShare, label: 'Share every airport ride automatically', onChange: (v) => { store.set({ autoShare: v }); if (v && store.get().trip && !store.get().trip.sharingWith) store.patchTrip({ sharingWith: first.id }); } }),
      ]), { sunken: true, cls: 'tip-card contacts-auto' }) : null,
    ],
  });
}
