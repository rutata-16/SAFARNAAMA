// DOM builders for every reusable UI piece. Screens compose these; they never style their own.

import { icon, CHECK_SVG, MAP_SVG } from './icons.js';

let phoneEl = null;
let liveEl = null;
let toastsEl = null;

export function mountShell(phone) {
  phoneEl = phone;
  toastsEl = el('div', { class: 'toasts', 'aria-live': 'polite', 'aria-atomic': 'false' });
  liveEl = el('div', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });
  phone.append(toastsEl, liveEl);
}

export function announce(msg) {
  if (!liveEl) return;
  liveEl.textContent = '';
  setTimeout(() => { liveEl.textContent = msg; }, 30);
}

// ── Element helper ──

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  const kids = Array.isArray(children) ? children : [children];
  kids.flat().forEach((c) => {
    if (c === null || c === undefined || c === false) return;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  });
  return node;
}

export const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

// ── Buttons ──

export function button({ label, variant = 'primary', iconLeft, iconRight, block = false, size = '', disabled = false, onClick, type = 'button', ariaLabel } = {}) {
  const labelEl = el('span', { class: 'btn__label', text: label });
  const btn = el('button', {
    type,
    class: ['btn', `btn--${variant}`, block ? 'btn--block' : '', size ? `btn--${size}` : ''].filter(Boolean).join(' '),
    'aria-label': ariaLabel,
  }, [iconLeft ? icon(iconLeft, { size: 'sm' }) : null, labelEl, iconRight ? icon(iconRight, { size: 'sm' }) : null]);
  btn.disabled = disabled;
  if (onClick) btn.addEventListener('click', onClick);

  btn.setLoading = (loading, text) => {
    btn.classList.toggle('is-loading', loading);
    btn.setAttribute('aria-busy', loading ? 'true' : 'false');
    const existing = btn.querySelector('.spinner');
    if (loading && !existing) btn.prepend(el('span', { class: 'spinner', 'aria-hidden': 'true' }));
    if (!loading && existing) existing.remove();
    labelEl.textContent = loading && text ? text : label;
  };
  btn.setLabel = (text) => { label = text; labelEl.textContent = text; };
  return btn;
}

export function iconButton({ name, label, onClick, variant = '', dot = false, fill = false }) {
  const btn = el('button', {
    type: 'button',
    class: ['icon-btn', variant ? `icon-btn--${variant}` : ''].filter(Boolean).join(' '),
    'aria-label': label,
    onClick,
  }, [icon(name, { fill }), dot ? el('span', { class: 'icon-btn__dot', 'aria-hidden': 'true' }) : null]);
  return btn;
}

export function link({ label, onClick, underline = false, body = false, muted = false, iconRight }) {
  return el('button', {
    type: 'button',
    class: ['link', underline ? 'link--underline' : '', body ? 'link--body' : '', muted ? 'link--muted' : ''].filter(Boolean).join(' '),
    onClick,
  }, [label, iconRight ? icon(iconRight, { size: 'xs' }) : null]);
}

// ── Screen shell ──

export function header({ title = '', onBack, right = null, center = false } = {}) {
  return el('header', { class: ['header', center ? 'header--center' : ''].join(' ') }, [
    onBack ? iconButton({ name: 'arrow_back_ios_new', label: 'Back', onClick: onBack }) : el('span', { class: 'header__spacer' }),
    title ? el('h1', { class: 'header__title', text: title }) : el('span', { class: 'header__spacer' }),
    right,
  ]);
}

export function screen({ name, head = null, body = [], foot = null, bodyClass = '', label }) {
  const bodyEl = el('div', { class: ['screen__body', bodyClass].filter(Boolean).join(' ') }, body);
  const node = el('main', { class: `screen screen--${name}`, 'aria-label': label || name }, [head, bodyEl, foot]);
  node.body = bodyEl;
  return node;
}

export function actionBar(children, { plain = false, split = false, note = null } = {}) {
  return el('footer', {
    class: ['action-bar', plain ? 'action-bar--plain' : '', split ? 'action-bar--split' : ''].filter(Boolean).join(' '),
  }, [children, note ? el('p', { class: 'fine-print action-bar__note' }, note) : null]);
}

// ── Cards, rows, badges ──

export function card(children, { selected = false, sunken = false, flush = false, cls = '' } = {}) {
  return el('div', {
    class: ['card', selected ? 'card--selected' : '', sunken ? 'card--sunken' : '', flush ? 'card--flush' : '', cls].filter(Boolean).join(' '),
  }, children);
}

export function iconCircle(name, { tone = '', size = '', fill = false } = {}) {
  return el('span', {
    class: ['icon-circle', tone ? `icon-circle--${tone}` : '', size ? `icon-circle--${size}` : ''].filter(Boolean).join(' '),
    'aria-hidden': 'true',
  }, icon(name, { fill }));
}

export function row({ lead = null, overline, title, sub, trail = null, onClick, cls = '', ariaLabel }) {
  const tag = onClick ? 'button' : 'div';
  return el(tag, {
    type: onClick ? 'button' : null,
    class: ['row', cls].filter(Boolean).join(' '),
    onClick,
    'aria-label': ariaLabel,
  }, [
    lead,
    el('span', { class: 'row__body' }, [
      overline ? el('span', { class: 'row__overline', text: overline }) : null,
      el('span', { class: 'row__title' }, title),
      sub ? el('span', { class: 'row__sub', text: sub }) : null,
    ]),
    trail ? el('span', { class: 'row__trail' }, trail) : null,
  ]);
}

export function badge(text, tone = '', iconName) {
  return el('span', { class: ['badge', tone ? `badge--${tone}` : ''].filter(Boolean).join(' ') }, [
    iconName ? icon(iconName, { fill: true }) : null, text,
  ]);
}

export function wipBadge(text = 'Not built yet') {
  return badge(text, 'wip');
}

export function spinner(large = false) {
  return el('span', { class: ['spinner', large ? 'spinner--lg' : ''].join(' '), role: 'status', 'aria-label': 'Loading' });
}

export function skeleton(cls) {
  return el('span', { class: `skeleton ${cls}`, 'aria-hidden': 'true' });
}

// ── Inputs ──

export function textField({ label, placeholder = '', value = '', iconName, autocomplete, inputmode, onInput, onEnter, clearable = false, id, maxlength, autocapitalize }) {
  const inputId = id || `f-${Math.random().toString(36).slice(2, 8)}`;
  const errId = `${inputId}-err`;
  const control = el('input', {
    id: inputId,
    class: 'input__control',
    type: 'text',
    placeholder,
    autocomplete: autocomplete || 'off',
    inputmode,
    maxlength,
    autocapitalize,
    spellcheck: 'false',
    'aria-describedby': errId,
  });
  control.value = value;
  const clear = clearable ? iconButton({ name: 'cancel', label: 'Clear', fill: true, onClick: () => { control.value = ''; control.dispatchEvent(new Event('input')); control.focus(); } }) : null;
  if (clear) { clear.classList.add('input__clear'); clear.hidden = !value; }
  const box = el('div', { class: 'input' }, [iconName ? el('span', { class: 'input__icon' }, icon(iconName)) : null, control, clear]);
  const error = el('p', { class: 'field__error', id: errId, 'aria-live': 'polite' });
  control.addEventListener('input', () => {
    if (clear) clear.hidden = !control.value;
    onInput && onInput(control.value);
  });
  control.addEventListener('keydown', (e) => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(control.value); } });

  const wrap = el('div', { class: 'field' }, [label ? el('label', { class: 'field__label', for: inputId, text: label }) : null, box, error]);
  wrap.control = control;
  wrap.setError = (msg) => {
    box.classList.toggle('is-invalid', !!msg);
    control.setAttribute('aria-invalid', msg ? 'true' : 'false');
    error.replaceChildren(...(msg ? [icon('error'), el('span', { text: msg })] : []));
  };
  return wrap;
}

export function fieldError(id) {
  return el('p', { class: 'field__error', id, 'aria-live': 'polite' });
}

export function setFieldError(node, msg) {
  node.replaceChildren(...(msg ? [icon('error'), el('span', { text: msg })] : []));
}

export function checkbox({ label, checked = false, onChange }) {
  const btn = el('button', { type: 'button', class: 'check', role: 'checkbox', 'aria-checked': String(checked) }, [
    el('span', { class: 'check__box', html: CHECK_SVG }),
    el('span', { class: 'check__label', text: label }),
  ]);
  btn.addEventListener('click', () => {
    const next = btn.getAttribute('aria-checked') !== 'true';
    btn.setAttribute('aria-checked', String(next));
    onChange && onChange(next);
  });
  return btn;
}

export function toggle({ checked = false, label, onChange }) {
  const btn = el('button', { type: 'button', class: 'toggle', role: 'switch', 'aria-checked': String(checked), 'aria-label': label });
  btn.addEventListener('click', () => {
    const next = btn.getAttribute('aria-checked') !== 'true';
    btn.setAttribute('aria-checked', String(next));
    onChange && onChange(next);
  });
  btn.setChecked = (v) => btn.setAttribute('aria-checked', String(v));
  return btn;
}

// options: [{ value, label, sub, trail, disabled, onDisabled }]
export function radioGroup({ label, options, value, onChange }) {
  const group = el('div', { class: 'radio-group', role: 'radiogroup', 'aria-label': label });
  const items = options.map((opt) => {
    const item = el('button', {
      type: 'button',
      class: 'radio-row',
      role: 'radio',
      'aria-checked': String(opt.value === value),
      'aria-disabled': opt.disabled ? 'true' : null,
      tabindex: opt.value === value ? '0' : '-1',
    }, [
      el('span', { class: 'radio-row__label' }, [opt.label, opt.sub ? el('small', { text: opt.sub }) : null]),
      opt.trail || null,
      el('span', { class: 'radio-row__dot', 'aria-hidden': 'true' }),
    ]);
    item.addEventListener('click', () => select(opt));
    return item;
  });
  function select(opt) {
    if (opt.disabled) { opt.onDisabled && opt.onDisabled(); return; }
    items.forEach((it, i) => {
      const on = options[i].value === opt.value;
      it.setAttribute('aria-checked', String(on));
      it.tabIndex = on ? 0 : -1;
    });
    onChange && onChange(opt.value);
  }
  group.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const enabled = options.map((o, i) => (!o.disabled ? i : -1)).filter((i) => i >= 0);
    const cur = enabled.indexOf(items.findIndex((it) => it.getAttribute('aria-checked') === 'true'));
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    const next = enabled[(cur + step + enabled.length) % enabled.length];
    select(options[next]);
    items[next].focus();
  });
  group.append(...items);
  return group;
}

// options: [{ value, label, icon }]
export function chipGroup({ label, options, value, onChange, onBrand = false }) {
  const group = el('div', { class: 'chips', role: 'radiogroup', 'aria-label': label });
  const items = options.map((opt) => {
    const chip = el('button', {
      type: 'button',
      class: ['chip', onBrand ? 'chip--on-brand' : ''].filter(Boolean).join(' '),
      role: 'radio',
      'aria-checked': String(opt.value === value),
      tabindex: opt.value === value ? '0' : '-1',
    }, [opt.icon ? icon(opt.icon, { fill: opt.value === value }) : null, opt.label]);
    chip.addEventListener('click', () => select(opt.value));
    return chip;
  });
  function select(v) {
    items.forEach((c, i) => {
      const on = options[i].value === v;
      c.setAttribute('aria-checked', String(on));
      c.tabIndex = on ? 0 : -1;
      const ic = c.querySelector('.ms');
      if (ic) ic.classList.toggle('ms--fill', on);
    });
    onChange && onChange(v);
  }
  group.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const cur = items.findIndex((c) => c.getAttribute('aria-checked') === 'true');
    const next = (cur + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    select(options[next].value);
    items[next].focus();
  });
  group.append(...items);
  return group;
}

export function stepper({ label, value, min = 0, max = 9, onChange }) {
  const valEl = el('span', { class: 'stepper__value', 'aria-live': 'polite', text: value });
  const minus = el('button', { type: 'button', class: 'stepper__btn', 'aria-label': `Fewer ${label}` }, icon('remove'));
  const plus = el('button', { type: 'button', class: 'stepper__btn', 'aria-label': `More ${label}` }, icon('add'));
  const sync = () => { valEl.textContent = value; minus.disabled = value <= min; plus.disabled = value >= max; };
  minus.addEventListener('click', () => { if (value > min) { value -= 1; sync(); onChange(value); } });
  plus.addEventListener('click', () => { if (value < max) { value += 1; sync(); onChange(value); } });
  sync();
  return el('div', { class: 'stepper', role: 'group', 'aria-label': label }, [minus, valEl, plus]);
}

// ── Illustrations (graceful fallback) ──

export function illustration(filename, alt, { width = 200, height = 160, cls = '' } = {}) {
  const img = el('img', {
    class: ['illus', cls].filter(Boolean).join(' '),
    src: `assets/illustrations/${filename}`,
    alt,
    width,
    height,
    decoding: 'async',
  });
  img.onerror = () => img.replaceWith(placeholder(alt, width, height, cls));
  return img;
}

function placeholder(label, width, height, cls) {
  const ph = el('div', { class: ['illus-placeholder', cls].filter(Boolean).join(' '), role: 'img', 'aria-label': label, text: label });
  ph.setAttribute('width', width);
  ph.setAttribute('height', height);
  return ph;
}

export function map({ pin = false, you = false, cls = '' } = {}) {
  return el('div', { class: ['map', cls].filter(Boolean).join(' '), role: 'img', 'aria-label': 'Map' }, [
    el('div', { class: 'map__svg', html: MAP_SVG }),
    pin ? el('span', { class: 'map__pin' }, icon('location_on', { fill: true })) : null,
    you ? el('span', { class: 'map__you' }) : null,
  ]);
}

export function logo({ size = '' } = {}) {
  return el('span', { class: ['logo-mark', size ? `logo-mark--${size}` : ''].filter(Boolean).join(' '), 'aria-hidden': 'true', text: 'S' });
}

export function emptyState({ art = null, title, text, action = null }) {
  return el('section', { class: 'empty' }, [art, el('h2', { class: 'empty__title', text: title }), el('p', { class: 'empty__text', text }), action]);
}

// ── Focus trap (sheets, alerts) ──

function trapFocus(container, onEscape) {
  const prev = document.activeElement;
  const sel = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const handler = (e) => {
    if (e.key === 'Escape' && onEscape) { e.preventDefault(); onEscape(); return; }
    if (e.key !== 'Tab') return;
    const nodes = [...container.querySelectorAll(sel)].filter((n) => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener('keydown', handler);
  requestAnimationFrame(() => {
    const target = container.querySelector('[data-autofocus]') || container.querySelector(sel);
    target && target.focus({ preventScroll: true });
  });
  return () => {
    container.removeEventListener('keydown', handler);
    if (prev && prev.isConnected) prev.focus({ preventScroll: true });
  };
}

// ── Bottom sheet ──

const openSheets = new Set();

export function sheet({ title, sub, body = [], foot = null, onClose, dismissible = true }) {
  const titleId = `sh-${Math.random().toString(36).slice(2, 8)}`;
  const scrim = el('div', { class: 'scrim' });
  const panel = el('section', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId }, [
    el('div', { class: 'sheet__grab', 'aria-hidden': 'true' }),
    el('div', { class: 'sheet__head' }, [
      el('h2', { class: 'sheet__title', id: titleId, text: title }),
      dismissible ? iconButton({ name: 'close', label: 'Close', onClick: () => close() }) : null,
    ]),
    sub ? el('p', { class: 'sheet__sub', text: sub }) : null,
    el('div', { class: 'sheet__body' }, body),
    foot ? el('div', { class: 'sheet__foot' }, foot) : null,
  ]);

  let closed = false;
  let release = () => {};
  function close(result) {
    if (closed) return;
    closed = true;
    openSheets.delete(api);
    release();
    scrim.classList.add('is-leaving');
    panel.classList.add('is-leaving');
    setTimeout(() => { scrim.remove(); panel.remove(); }, 220);
    onClose && onClose(result);
  }
  if (dismissible) scrim.addEventListener('click', () => close());
  phoneEl.append(scrim, panel);
  release = trapFocus(panel, dismissible ? () => close() : null);
  const api = { close, panel, body: panel.querySelector('.sheet__body') };
  openSheets.add(api);
  return api;
}

export function closeAllSheets() {
  [...openSheets].forEach((s) => s.close());
}

export function confirmSheet({ title, text, confirmLabel, cancelLabel = 'Keep it', destructive = true, onConfirm }) {
  const s = sheet({
    title,
    body: [el('p', { class: 'sheet-text', text })],
    foot: [
      button({ label: confirmLabel, variant: destructive ? 'destructive' : 'primary', block: true, onClick: () => { s.close(); onConfirm(); } }),
      button({ label: cancelLabel, variant: 'ghost', block: true, onClick: () => s.close() }),
    ],
  });
  return s;
}

// ── iOS system alert ──

export function systemAlert({ title, msg, media = null, buttons, row = false }) {
  dismissDialogs();
  const titleId = `al-${Math.random().toString(36).slice(2, 8)}`;
  let release = () => {};
  const close = () => {
    release();
    scrim.classList.add('is-leaving');
    setTimeout(() => scrim.remove(), 160);
  };
  const btns = buttons.map((b) => el('button', {
    type: 'button',
    class: ['sys-alert__btn', b.bold ? 'sys-alert__btn--bold' : '', b.danger ? 'sys-alert__btn--danger' : ''].filter(Boolean).join(' '),
    onClick: () => { close(); setTimeout(() => b.onClick && b.onClick(), 120); },
  }, b.label));
  const scrim = el('div', { class: 'sys-scrim' }, el('div', { class: 'sys-alert', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': titleId }, [
    el('div', { class: 'sys-alert__content' }, [
      el('h2', { class: 'sys-alert__title', id: titleId, text: title }),
      msg ? el('p', { class: 'sys-alert__msg', text: msg }) : null,
      media ? el('div', { class: 'sys-alert__media' }, media) : null,
    ]),
    row ? el('div', { class: 'sys-alert__row' }, btns) : btns,
  ]));
  phoneEl.append(scrim);
  release = trapFocus(scrim, null);
  return { close };
}

export function dismissDialogs() {
  document.querySelectorAll('.sys-scrim, .app-dialog-scrim').forEach((n) => n.remove());
}

// ── Toasts ──

export function toast(message, { type = 'info', iconName } = {}) {
  const icons = { info: 'info', success: 'check_circle', error: 'error' };
  const t = el('div', { class: `toast toast--${type}`, role: type === 'error' ? 'alert' : 'status' }, [
    icon(iconName || icons[type], { fill: true }),
    el('span', { text: message }),
  ]);
  toastsEl.append(t);
  while (toastsEl.children.length > 3) toastsEl.firstChild.remove();
  setTimeout(() => {
    t.classList.add('is-leaving');
    setTimeout(() => t.remove(), 220);
  }, 2600);
}

export function comingSoon(feature) {
  toast(`${feature} is coming soon. Not built in this prototype yet.`, { type: 'info', iconName: 'construction' });
}

// Toasts sit above the tab bar on tab screens, lower elsewhere
export function setToastOffset(mode) {
  if (toastsEl) toastsEl.dataset.offset = mode;
}

// ── Numeric keypad (iOS style) ──

export function keypad({ onDigit, onDelete, suggestion = null }) {
  const letters = ['', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];
  const keys = [];
  for (let i = 1; i <= 9; i++) {
    keys.push(el('button', { type: 'button', class: 'keypad__key', 'aria-label': String(i), onClick: () => onDigit(String(i)) }, [String(i), el('small', { text: letters[i - 1] || ' ' })]));
  }
  keys.push(el('span', { class: 'keypad__key keypad__key--blank', 'aria-hidden': 'true' }));
  keys.push(el('button', { type: 'button', class: 'keypad__key', 'aria-label': '0', onClick: () => onDigit('0') }, '0'));
  keys.push(el('button', { type: 'button', class: 'keypad__key keypad__key--fn', 'aria-label': 'Delete', onClick: onDelete }, icon('backspace')));

  const suggest = el('div', { class: 'keypad__suggest' });
  const pad = el('div', { class: 'keypad', role: 'group', 'aria-label': 'Number pad' }, [suggest, ...keys]);
  pad.setSuggestion = (s) => {
    suggest.replaceChildren(s ? el('button', { type: 'button', class: 'keypad__suggest-btn', onClick: s.onPick, 'aria-label': `Use code ${s.value} from Messages` }, [
      el('span', { text: 'From Messages' }),
      el('strong', { text: s.value }),
    ]) : '');
  };
  pad.setSuggestion(suggestion);

  // Physical keyboard support while the pad is on screen
  const onKey = (e) => {
    if (!pad.isConnected) { document.removeEventListener('keydown', onKey); return; }
    if (document.querySelector('.sheet, .sys-scrim')) return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); onDigit(e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); onDelete(); }
  };
  document.addEventListener('keydown', onKey);
  pad.destroy = () => document.removeEventListener('keydown', onKey);
  return pad;
}

// ── Bottom tab bar ──

export function tabbar(active, go) {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'trips', label: 'Trips', icon: 'receipt_long' },
    { id: 'help', label: 'Help', icon: 'support_agent' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];
  return el('nav', { class: 'tabbar', 'aria-label': 'Main' }, tabs.map((t) => el('button', {
    type: 'button',
    class: 'tabbar__item',
    'aria-current': t.id === active ? 'page' : null,
    onClick: () => { if (t.id !== active) go(t.id); },
  }, [el('span', { class: 'tabbar__pill' }, icon(t.icon, { fill: t.id === active })), t.label])));
}


// ── In-app dialog (centered card, app styling) ──

export function dialog({ title, text, art = null, body = null, actions, onClose }) {
  dismissDialogs();
  const titleId = `dl-${Math.random().toString(36).slice(2, 8)}`;
  let release = () => {};
  const close = () => {
    release();
    scrim.classList.add('is-leaving');
    setTimeout(() => scrim.remove(), 180);
    onClose && onClose();
  };
  const scrim = el('div', { class: 'app-dialog-scrim' }, el('section', { class: 'app-dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': titleId }, [
    art,
    el('h2', { class: 'app-dialog__title', id: titleId, text: title }),
    text ? el('p', { class: 'app-dialog__text', text }) : null,
    body,
    el('div', { class: 'app-dialog__actions' }, actions.map((a) => button({
      label: a.label,
      variant: a.variant || 'primary',
      block: true,
      onClick: () => { close(); a.onClick && setTimeout(a.onClick, 60); },
    }))),
  ]));
  phoneEl.append(scrim);
  release = trapFocus(scrim, null);
  return { close, node: scrim };
}

// ── Push notification banner (iOS style, inside the phone) ──

export function pushBanner({ title, text, onTap }) {
  document.querySelectorAll('.push').forEach((n) => n.remove());
  const b = el('button', { type: 'button', class: 'push', 'aria-label': `Notification: ${title}. ${text}` }, [
    el('span', { class: 'push__app', 'aria-hidden': 'true', text: 'S' }),
    el('span', { class: 'push__body' }, [
      el('span', { class: 'push__meta' }, [el('strong', { text: 'SAFARNAAMA' }), el('span', { text: 'now' })]),
      el('span', { class: 'push__title', text: title }),
      el('span', { class: 'push__text', text }),
    ]),
  ]);
  const hide = () => { b.classList.add('is-leaving'); setTimeout(() => b.remove(), 260); };
  b.addEventListener('click', () => { hide(); onTap && onTap(); });
  phoneEl.append(b);
  announce(`${title}. ${text}`);
  setTimeout(hide, 6000);
}

// ── Prototype simulation controls ──
// options: [{ label, icon, onClick }]

export function simulate(options, title = 'Simulate') {
  return el('button', {
    type: 'button',
    class: 'sim-pill',
    'aria-label': 'Prototype: simulate what happens next',
    onClick: () => {
      const sh = sheet({
        title: 'Prototype: what happens next?',
        sub: 'These stand in for live flight, driver and GPS events.',
        body: [el('div', { class: 'sim-list' }, options.map((o) => row({
          lead: iconCircle(o.icon || 'play_arrow'),
          title: o.label,
          sub: o.sub,
          trail: icon('chevron_right'),
          cls: 'list-row',
          onClick: () => { sh.close(); setTimeout(o.onClick, 120); },
        })))],
      });
    },
  }, [icon('science', { size: 'xs' }), title]);
}

export function avatar(name, { size = '', tone = '' } = {}) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return el('span', { class: ['avatar', size ? `avatar--${size}` : '', tone ? `avatar--${tone}` : ''].filter(Boolean).join(' '), 'aria-hidden': 'true', text: initials });
}

export function plate(text, size = '') {
  return el('span', { class: ['plate', size ? `plate--${size}` : ''].filter(Boolean).join(' '), text });
}
