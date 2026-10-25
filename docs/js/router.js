// Screen stack with enter/exit transitions. Screens are re-built from store state when revisited.

import { closeAllSheets, setToastOffset } from './components.js';

let viewport = null;
let phone = null;
let routes = {};
const stack = [];          // [{ name, params }]
let currentNode = null;
let busy = false;

export function init({ viewportEl, phoneEl, table }) {
  viewport = viewportEl;
  phone = phoneEl;
  routes = table;
}

export function current() {
  return stack[stack.length - 1] || null;
}

export function canGoBack() {
  return stack.length > 1;
}

function render(entry, transition) {
  const factory = routes[entry.name];
  if (!factory) throw new Error(`Unknown route: ${entry.name}`);
  closeAllSheets();
  const node = factory(entry.params || {});
  const prev = currentNode;
  currentNode = node;

  phone.dataset.status = node.dataset.status || 'dark';
  phone.dataset.bleed = node.dataset.bleed || 'false';
  setToastOffset(node.dataset.tabs === 'true' ? 'tabs' : 'low');

  viewport.append(node);

  const finish = () => {
    if (prev) {
      prev._cleanup && prev._cleanup();
      prev.remove();
    }
    node.classList.remove(`route-enter-${transition}`);
    busy = false;
    node._entered && node._entered();
  };

  if (!prev || transition === 'none') {
    finish();
    return;
  }

  busy = true;
  const exitName = transition === 'up' ? 'fade' : transition;
  const exitClass = transition === 'up' ? 'route-exit-fade' : (transition === 'down' ? 'route-exit-down' : `route-exit-${exitName}`);
  const enterClass = transition === 'down' ? 'route-enter-fade' : `route-enter-${transition}`;
  node.classList.add(enterClass);
  prev.classList.add(exitClass);
  prev.setAttribute('aria-hidden', 'true');
  prev.inert = true;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => {
    node.classList.remove(enterClass);
    finish();
  }, reduced ? 10 : 380);
}

export function go(name, params = {}, { transition = 'forward', replace = false } = {}) {
  if (busy) return;
  if (replace) stack.pop();
  stack.push({ name, params });
  render(current(), transition);
}

export function back({ transition = 'back' } = {}) {
  if (busy || stack.length < 2) return;
  stack.pop();
  render(current(), transition);
}

// Pop back to the nearest entry with this name (or replace the stack with it)
export function backTo(name, params) {
  if (busy) return;
  const idx = stack.map((e) => e.name).lastIndexOf(name);
  if (idx === -1) { reset(name, params, { transition: 'back' }); return; }
  stack.length = idx + 1;
  if (params) stack[idx].params = params;
  render(current(), 'back');
}

export function reset(name, params = {}, { transition = 'fade' } = {}) {
  if (busy) return;
  stack.length = 0;
  stack.push({ name, params });
  render(current(), transition);
}

// Replace the whole stack (e.g. home → ride after booking) and show the top entry
export function resetTo(entries, { transition = 'up' } = {}) {
  if (busy) return;
  stack.length = 0;
  stack.push(...entries);
  render(current(), transition);
}

// Re-render the current screen in place (e.g. after a store change)
export function refresh() {
  if (!current()) return;
  render(current(), 'none');
}
