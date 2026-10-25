// Material Symbols Rounded (Google Fonts icon font) + the few SVGs the font can't draw.

export function icon(name, { fill = false, size = '', label = '' } = {}) {
  const span = document.createElement('span');
  span.className = ['ms', fill ? 'ms--fill' : '', size ? `ms--${size}` : ''].filter(Boolean).join(' ');
  span.textContent = name;
  if (label) {
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', label);
  } else {
    span.setAttribute('aria-hidden', 'true');
  }
  return span;
}

// Check mark drawn as a stroke so it can animate in
export const CHECK_SVG = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.2 8.4l3.1 3.1 6.5-6.8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Static map: land, blocks, roads, water. Used for the save-home map and the location alert.
export const MAP_SVG = `<svg viewBox="0 0 350 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect class="map__land" width="350" height="220"/>
  <path class="map__water" d="M0 170 C40 160 70 190 110 185 C140 182 150 210 170 220 L0 220Z"/>
  <rect class="map__block" x="14" y="20" width="44" height="30" rx="4"/>
  <rect class="map__block" x="120" y="64" width="56" height="24" rx="4"/>
  <rect class="map__block" x="230" y="20" width="38" height="44" rx="4"/>
  <rect class="map__block" x="268" y="150" width="56" height="34" rx="4"/>
  <rect class="map__block" x="196" y="118" width="40" height="28" rx="4"/>
  <rect class="map__block" x="22" y="100" width="40" height="34" rx="4"/>
  <path class="map__road" stroke-width="16" d="M-10 64 C80 50 140 108 200 98 S300 60 360 72"/>
  <path class="map__road" stroke-width="12" d="M70 -10 C82 60 96 140 120 230"/>
  <path class="map__road" stroke-width="12" d="M240 -10 C250 60 262 90 282 120 C300 150 296 190 290 230"/>
  <path class="map__road" stroke-width="8" d="M-10 150 C90 140 180 160 360 140"/>
  <text class="map__label" x="134" y="128">HILL ROAD</text>
  <text class="map__label" x="18" y="210">BANDRA</text>
</svg>`;

// Trip map: static streets with the route drawn on top and the car moving along it.
export const ROUTE_SVG = `<svg viewBox="0 0 390 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect class="map__land" width="390" height="340"/>
  <path class="map__water" d="M0 250 C60 236 90 280 150 270 C200 262 220 320 250 340 L0 340Z"/>
  <rect class="map__block" x="20" y="30" width="60" height="40" rx="6"/>
  <rect class="map__block" x="250" y="40" width="70" height="50" rx="6"/>
  <rect class="map__block" x="140" y="140" width="64" height="36" rx="6"/>
  <rect class="map__block" x="290" y="200" width="60" height="44" rx="6"/>
  <rect class="map__block" x="40" y="160" width="50" height="40" rx="6"/>
  <path class="map__road" stroke-width="18" d="M-10 110 C100 90 180 130 260 120 S360 90 400 100"/>
  <path class="map__road" stroke-width="14" d="M110 -10 C120 80 130 200 170 350"/>
  <path class="map__road" stroke-width="14" d="M300 -10 C300 90 320 160 330 350"/>
  <path class="map__road" stroke-width="10" d="M-10 220 C120 210 240 240 400 210"/>
  <path class="trip-route" id="trip-route" d="M320 40 C312 100 300 116 250 121 C190 128 140 108 124 150 C112 190 150 214 200 226 C240 236 250 270 236 300"/>
  <circle class="trip-route__start" cx="320" cy="40" r="7"/>
  <circle class="trip-route__end" cx="236" cy="300" r="9"/>
  <g class="trip-car">
    <circle r="13"/>
    <path d="M-5 -2 h10 l-1.5 -4 h-7z M-6 -2 h12 v5 h-12z" fill="#fff"/>
    <animateMotion dur="40s" repeatCount="1" fill="freeze" rotate="0" keyPoints="0;1" keyTimes="0;1"><mpath href="#trip-route"/></animateMotion>
  </g>
  <text class="map__label" x="262" y="34">T2</text>
  <text class="map__label" x="250" y="320">HOME</text>
</svg>`;
