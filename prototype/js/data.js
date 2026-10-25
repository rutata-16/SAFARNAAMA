// All dummy, static data. Screens read this through store.js.

export const OTP = {
  code: '482716',        // what "Messages" suggests above the keypad
  maxTries: 3,
  resendSeconds: 30,
  lockSeconds: 10 * 60,
};

export const LANGUAGES = [
  { id: 'en', label: 'English', native: 'English', available: true },
  { id: 'hi', label: 'Hindi', native: 'हिन्दी', available: false },
  { id: 'mr', label: 'Marathi', native: 'मराठी', available: false },
];

export const NOTIFICATION_TYPES = [
  { id: 'landed', label: 'You have landed and can call your car' },
  { id: 'delayed', label: 'Your flight is delayed and your ride has moved' },
  { id: 'driver', label: 'Your driver is assigned and at the bay' },
  { id: 'home', label: 'You reached home, for people you share with' },
];

export const ADDRESSES = [
  { id: 'a1', title: 'Sea View Apartments', line: 'Flat 1203, Sea View Apartments, Hill Road, Bandra West, Mumbai 400050', short: 'Hill Road, Bandra West', area: 'Bandra West', km: 23, mins: 45 },
  { id: 'a2', title: 'Pali Hill Residency', line: 'Pali Hill Residency, Pali Hill, Bandra West, Mumbai 400050', short: 'Pali Hill, Bandra West', area: 'Bandra West', km: 22, mins: 42 },
  { id: 'a3', title: 'Lokhandwala Complex', line: 'Lokhandwala Complex, Andheri West, Mumbai 400053', short: 'Lokhandwala, Andheri West', area: 'Andheri West', km: 11, mins: 28 },
  { id: 'a4', title: 'Hiranandani Gardens', line: 'Hiranandani Gardens, Powai, Mumbai 400076', short: 'Hiranandani, Powai', area: 'Powai', km: 14, mins: 35 },
  { id: 'a5', title: 'Nariman Point', line: 'Maker Chambers, Nariman Point, Mumbai 400021', short: 'Nariman Point', area: 'Nariman Point', km: 31, mins: 65 },
  { id: 'a7', title: 'Vile Parle East', line: 'Nehru Road, Vile Parle East, Mumbai 400057', short: 'Vile Parle East', area: 'Vile Parle East', km: 2.1, mins: 9, short_trip: true },
  { id: 'a8', title: 'Lonavala', line: 'Lonavala, Pune district, Maharashtra 410401', short: 'Lonavala', area: 'Lonavala', km: 84, mins: 130, outside: true },
  { id: 'a6', title: 'Juhu Tara Road', line: 'Sagar Darshan, Juhu Tara Road, Juhu, Mumbai 400049', short: 'Juhu Tara Road, Juhu', area: 'Juhu', km: 9, mins: 24 },
];

// The address "Use my current location" resolves to
export const CURRENT_LOCATION_ADDRESS = 'a1';

// Flights the lookup knows about. Anything else is "not found".
export const FLIGHTS = {
  AI864: {
    number: 'AI 864', airline: 'Air India', fromCity: 'Bengaluru', from: 'BLR', to: 'BOM',
    arrival: '10:40 PM', arrivalShort: '10:40 pm', terminal: 'T2', belt: 7, status: 'on-time',
  },
  '6E2134': {
    number: '6E 2134', airline: 'IndiGo', fromCity: 'Delhi', from: 'DEL', to: 'BOM',
    arrival: '11:15 PM', arrivalShort: '11:15 pm', terminal: 'T2', belt: 4, status: 'delayed', delayedTo: '11:50 pm',
  },
  UK955: {
    number: 'UK 955', airline: 'Vistara', fromCity: 'Delhi', from: 'DEL', to: 'BOM',
    arrival: '9:05 PM', arrivalShort: '9:05 pm', terminal: 'T2', belt: 9, status: 'on-time',
  },
  '6E5021': {
    number: '6E 5021', airline: 'IndiGo', fromCity: 'Chennai', from: 'MAA', to: 'BOM',
    arrival: '10:40 PM', arrivalShort: '10:40 pm', terminal: 'T2', belt: 5, status: 'on-time', twice: true,
  },
  UK942: {
    number: 'UK 942', airline: 'Vistara', fromCity: 'Delhi', from: 'DEL', to: 'BOM',
    arrival: '10:15 PM', arrivalShort: '10:15 pm', terminal: 'T2', belt: 7, status: 'landed', landedMinsAgo: 25,
  },
  QP1102: {
    number: 'QP 1102', airline: 'Akasa Air', fromCity: 'Goa', from: 'GOI', to: 'BOM',
    arrival: '8:20 PM', arrivalShort: '8:20 pm', terminal: 'T1', belt: 2, status: 'on-time',
  },
};

export const FLIGHT_EXAMPLES = ['AI 864', '6E 5021', 'UK 942'];

// Pickup bay by terminal
export const BAYS = {
  T1: { number: 4, walkMins: 3 },
  T2: { number: 12, walkMins: 4 },
};

// Ride types. `capacity` decides whether the bags + people fit.
export const RIDES = [
  {
    id: 'cab', name: 'Cab', icon: 'local_taxi', fare: 640, solo: true,
    blurb: 'Solo, straight home',
    capacity: { cabin: 2, checkin: 2, people: 3 },
    waitText: 'Car at the bay about 5 min after you have your bags',
  },
  {
    id: 'pool', name: 'Pool', icon: 'groups', fare: 490, solo: false,
    blurb: 'Save ₹150 · up to 10 min longer',
    capacity: { cabin: 1, checkin: 1, people: 1 },
    waitText: 'Leaves once your co-rider has their bags too',
  },
  {
    id: 'auto', name: 'Auto', icon: 'electric_rickshaw', fare: 320, solo: true,
    blurb: 'Open-air, good for light bags',
    capacity: { cabin: 1, checkin: 0, people: 2 },
    waitText: 'Auto at the bay about 3 min after you have your bags',
  },
  {
    id: 'suv', name: 'Cab XL', icon: 'airport_shuttle', fare: 890, solo: true,
    blurb: 'Room for family and big bags',
    capacity: { cabin: 4, checkin: 4, people: 6 },
    waitText: 'Car at the bay about 8 min after you have your bags',
  },
];

// Pool on AI 864 heading the same way
export const POOL = {
  save: 150,
  extraMins: 10,
  womenNearby: 3,
  riders: [{ name: 'Meera', rating: 4.9, flight: 'AI 864', drop: 'Khar West' }],
  womenRiders: [{ name: 'Meera', rating: 4.9, flight: 'AI 864', drop: 'Khar West' }, { name: 'Sana', rating: 4.8, flight: 'AI 864', drop: 'Bandra West' }],
};

// Split of the all-in fare (always sums to the fare)
export function fareBreakdown(fare, km) {
  const pickup = 90;
  const platform = 25;
  return [
    { label: 'Base fare', sub: `RTA rate for ${km} km`, amount: fare - pickup - platform },
    { label: 'Airport pickup fee', amount: pickup },
    { label: 'Tolls', sub: 'No tolls on this route', amount: 0 },
    { label: 'Platform fee', amount: platform },
  ];
}

export const GUARANTEE_CREDIT = 100;

export const PAYMENT_METHODS = [
  { id: 'upi', icon: 'qr_code_2', label: 'UPI', detail: 'ananya@okicici' },
  { id: 'gpay', icon: 'account_balance_wallet', label: 'Google Pay', detail: 'Linked to HDFC' },
  { id: 'card', icon: 'credit_card', label: 'Credit or debit card', detail: 'Visa ending 4417', fails: true },
  { id: 'credit', icon: 'redeem', label: 'Safarnaama credit', detail: '₹100 available', creditOnly: true },
];

export const HOW_IT_WORKS = [
  { icon: 'currency_rupee', title: 'One all-in fare', text: 'The price you see is the price you pay. Parking, tolls and tax are already inside.' },
  { icon: 'signpost', title: 'One numbered bay', text: 'Your car waits at a fixed bay. We walk you there from the baggage belt.' },
  { icon: 'verified_user', title: 'A ride that holds', text: 'If a driver cancels, a new one is sent at the same fare. Your flight runs late, your ride moves with it.' },
];

export const DEFAULT_USER = {
  name: 'Ananya Rao',
  phone: '98765 43210',
};


/* ═══════════ Sections 04–10 ═══════════ */

export const MIN_HUB_FARE = { auto: 120, distanceFare: 62 };

export const GUARANTEE_RULES = [
  { icon: 'schedule', title: 'Flight delayed', text: 'Your ride moves to the new time. Fare unchanged.' },
  { icon: 'person_cancel', title: 'Driver cancels', text: 'The next driver in the queue, same fare, plus ₹100 credit.' },
  { icon: 'event_busy', title: 'You cancel', text: 'Free until a driver is assigned. After that, ₹50.' },
  { icon: 'search', title: 'Cannot find each other', text: '5 min free at the bay, then ₹2 per min to the driver.' },
  { icon: 'money_off', title: 'Asked for extra money', text: 'You owe nothing more. Report it in the trip, we follow up.' },
];

export const OTHER_WAYS_OUT = [
  { icon: 'local_taxi', title: 'Premium taxi counter', where: 'Outside arrivals exit', walk: 'About 1 min', price: 'Around ₹1,000' },
  { icon: 'confirmation_number', title: 'Prepaid taxi booth', where: 'Arrivals hall, near gate 3', walk: 'About 2 min', price: 'Fixed at the booth' },
  { icon: 'smartphone', title: 'Other ride apps', where: 'P4 West or P6 parking', walk: '10 to 15 min', price: 'App fare' },
  { icon: 'train', title: 'Metro Line 1', where: 'Marol Naka station', walk: 'Not walkable with bags', price: '₹20 to 40' },
];

export const CONTACTS = [
  { id: 'amma', name: 'Amma', phone: '+91 98200 11223' },
  { id: 'riya', name: 'Riya (roommate)', phone: '+91 99300 44556' },
];

export const CANCEL_REASONS = ['Plans changed', 'Someone is picking me up', 'Booked another ride', 'Other'];

export const DRIVERS = [
  {
    id: 'santosh', name: 'Santosh Kadam', first: 'Santosh', rating: 4.8, trips: '1,240', car: 'White Maruti Dzire', color: 'white',
    plate: 'MH 02 AB 1234', tags: ['Helps with bags', 'On time'], checkedIn: '9:50 pm', record: '0 refusals, 0 cancellations in the last 30 days',
  },
  {
    id: 'imran', name: 'Imran Shaikh', first: 'Imran', rating: 4.9, trips: '860', car: 'Silver Hyundai Aura', color: 'silver',
    plate: 'MH 03 CK 5521', tags: ['Polite', 'Clean car'], checkedIn: '9:41 pm', record: '0 refusals, 1 cancellation in the last 30 days',
  },
];

export const START_CODE = '4827';

export const AMENITIES = [
  { icon: 'water_drop', label: 'Water and snacks', dist: '40 m from belt' },
  { icon: 'wc', label: 'Washrooms', dist: '60 m from belt' },
  { icon: 'shield_person', label: 'Safe waiting point', dist: 'Lit and staffed, next to the bay' },
];

// Walking directions, belt → bay. Bay 14 is the "bay changed" route.
export const WALKS = {
  12: { mins: 4, steps: [
    { icon: 'door_open', title: 'Exit through Gate 3', sub: 'Turn left after the coffee kiosk' },
    { icon: 'elevator', title: 'Take lift L4 to level P2', sub: 'Lifts fit trolleys' },
    { icon: 'signpost', title: 'Walk to pillar C4', sub: 'Bay 12 is the lit sign on your right' },
  ] },
  14: { mins: 5, steps: [
    { icon: 'door_open', title: 'Exit through Gate 3', sub: 'Turn left after the coffee kiosk' },
    { icon: 'elevator', title: 'Take lift L4 to level P2', sub: 'Lifts fit trolleys' },
    { icon: 'signpost', title: 'Walk past pillar C4 to C6', sub: 'Bay 14 is the lit sign on your left' },
  ] },
  4: { mins: 3, steps: [
    { icon: 'door_open', title: 'Exit through Gate 1', sub: 'Keep right past the currency counter' },
    { icon: 'signpost', title: 'Walk to pillar A2', sub: 'Bay 4 is the lit sign straight ahead' },
  ] },
};

export const CHAT_QUICK = ['I am at the bay', '2 min away', 'Cannot find you', 'Please wait'];

export const EXTRA_ASK_REASONS = ['Cash on top', 'Toll', 'Parking', 'To change route', 'Other'];

export const RATING_TAGS = {
  good: ['On time', 'Helped with bags', 'Polite', 'Clean car'],
  bad: ['Asked for extra', 'Rude', 'Felt unsafe', 'Late'],
};

export const HELP_TOPICS = [
  { id: 'bag', icon: 'work_history', label: 'I left something in the car' },
  { id: 'extra', icon: 'money_off', label: 'Driver asked for extra money' },
  { id: 'noshow', icon: 'person_off', label: 'Driver did not come or cancelled' },
  { id: 'unsafe', icon: 'shield', label: 'I felt unsafe' },
  { id: 'charge', icon: 'receipt_long', label: 'I was charged wrongly' },
  { id: 'other', icon: 'help', label: 'Something else' },
];

export const EXIT_FARE = 660;
export const QUEUE = { bay: 'Q3', walk: 2, waitMins: 3, cars: 6 };
