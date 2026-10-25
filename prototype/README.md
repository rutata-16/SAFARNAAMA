# Safarnaama prototype

Mobile-only, static HTML/CSS/JS prototype covering:

- **01 · First launch and sign in** (with a skip option)
- **02 · Home and adding your arrival**
- **03 · Choosing and locking the ride**
- **04 · Before you land** · **05 · Landing and your driver** · **06 · Walking to the bay** · **07 · Meet, board and ride** · **08 · Arriving home and getting help** · **09 · At the exit now** · **10 · Trips and Profile**

Screens follow the Figma "Playground" page.

Vanilla ES modules. No framework, no build step, no dependencies beyond Google Fonts (Fraunces, Figtree, Material Symbols Rounded).

## Run locally

```bash
cd prototype
python3 -m http.server 8000
```

Open http://localhost:8000. On a wide window the app sits in a phone frame. Below 520px it fills the screen.

## Deploy to GitHub Pages

1. Push the contents of this folder to `main`.
2. In the repo, go to Settings → Pages and choose `main` / `/ (root)`.
3. Open `https://<user>.github.io/<repo>/`.

All paths are relative, `.nojekyll` is present, and `404.html` is a byte-for-byte copy of `index.html`.

## Flow map

```
Splash ─▶ O1 Welcome ─▶ O2 Phone ─▶ O3 Code ─▶ O4 Name + language ─▶ O5 Location ─▶ O6 Notifications ─▶ O7 Save Home ─▶ O8 Pool ─▶ Home
                           │            │                               │
                           │ Skip       ├─ wrong code (O3e, 3 tries)    ├─ iOS prompt (O5d)
                           │            └─ too many tries (O3x)         └─ Don't allow / Not now ─▶ O5x fallback
                           └──────────────────────────────▶ O5 (as guest)

Home (step 1: flight) ─▶ B2 Where to (step 2) ─▶ B3 Bags (step 3) ─▶ B4 Your ride home
   └─ home already saved ─────────────────────────────────────────▶ B4 (all prefilled)

B4 Your ride home ─┬─ Edit flight / drop / bags (edits return to B4)
                   ├─ Other options sheet (B5): Cab · Pool · Auto · SUV, ones that can't fit are disabled
                   │     └─ Pool ─▶ Women-only prompt, once (B6w) ─▶ B6 Pool details ─▶ Join / Back to solo
                   ├─ Fare details (B7f)
                   └─ Continue ─▶ (guest? sign-in sheet ─▶ O2/O3 ─▶ back) ─▶ B7 Lock your ride sheet
                                     ├─ Change payment method
                                     ├─ HDFC card ─▶ B7e "Payment didn't go through" ─▶ Try again / Use another method
                                     └─ UPI ─▶ B8 Your ride ─▶ Share (SH1) · Cancel (confirm, refund)
Home then shows the upcoming ride card (H2); Trips lists it.
```

### The whole ride (04 → 08)

```
B3 Lock ─▶ B4l Locking ─▶ B5 Ride locked ─▶ R4 Your ride
R4 ─┬─ Simulate: Flight delayed (push N1, R4d) · Flight cancelled (R4x, refund) · Pool does not fill (R4n)
    ├─ Share trip (SH1 contacts ─▶ SH2 sharing on / stop) · Cancel ride (R4c reasons ─▶ R4cd)
    └─ Simulate: Plane lands (push N2) ─▶ R5 Welcome to Mumbai
R5 ─┬─ Bags delayed? (R5b) ─▶ R5h Car request on hold
    └─ I have my bags ─▶ L1 Finding ─┬─▶ R6 Your driver ─ Choose another (R6a, once) ─▶ L1b ─▶ R6b
                                      └─ Simulate: No cars (R6e) ─▶ Keep waiting / Cancel and refund (R6ec)
R6 ─▶ R7 Walk to Bay 12 (driver reaches the bay by himself after ~14 s)
R7 ─┬─ Call (R7call) · Chat (R7chat, driver replies) · Photo (R7ph)
    └─ Simulate: Driver at bay (R7w, 4:00 free) · Free time runs out (R7p) · No signal (R7n) · Bay changed (R7b)
                 · Driver cancels (R7x ─▶ R6c, ₹100 credit) · Cannot find each other (R7f)
R7 ─▶ I'm at the bay ─▶ R8 Meet and board (code 4 8 2 7; auto-starts after ~15 s)
R8 ─┬─ This is not my car (R8x) · Problem with bags (R8b)
    └─▶ R9 On the trip: SOS (R9s countdown ─▶ R9s2) · Driver asked for extra money (R9m ─▶ R9m2)
        Simulate: Route changes (R9d) · Driver ends early (R9e) · Arrive home
R10 You are home (tick bags; "A bag is still in the car" R10lb ─▶ R11f) ─▶ R10r Rate ─▶ R10d Trip complete
Help tab (R11) ─▶ report (R11f) ─▶ R11s case received. Cases also show in Trips.
```

### At the exit now (09)

Home → "At the exit now?" (or a flight that has already landed, `UK 942`) → X1 → X1s pay → X1l assigning → X2 your car → Skip once (X2a → X2b) → walk to the car → R8 meet → R9 → R10. The simulate pill on X1 makes the queue empty after paying (X2e).

### Trips and Profile (10)

Trips shows T0 empty until you finish or cancel a ride, then upcoming, past (T2 details) and help cases. Profile has saved places, trusted contacts (P2: add with validation, remove, auto-share), payment methods, language (P1l), default bags, women-only pools, appearance, log out (P1o) and reset.

### Prototype controls

A dashed **Simulate** pill sits in the header of screens that wait on the outside world (flight status, driver GPS, the queue). It opens a sheet of the "▶ Prototype" events from Figma. Everything else is driven by normal taps.

### Things to try

| Where | Input | Result |
| --- | --- | --- |
| Phone | fewer than 10 digits, or starting 0–5 | Inline error, Continue disabled until edited |
| Code | tap **From Messages 482716** above the keypad | Verifies |
| Code | any other 6 digits | "That code does not match", tries count down; 3rd miss locks for 10 min |
| Locked | Get the code on a call | Back to code entry, tries reset |
| Name | empty | Inline error; Hindi / Marathi show "Coming soon" |
| Save Home | type `hill`, `powai`, `juhu` | Live suggestions; nonsense shows "No matches" |
| Home | `AI 864`, `6E 2134` (delayed), `UK 955`, `QP 1102` (T1) | Found → booking |
| Home | `6E 5021` | "Flies twice" sheet (B1d) |
| Home | `UK 942` | Already landed (B1x) → exit queue |
| Home | not-found error → Enter arrival by hand | B1m manual arrival |
| Home | Simulate → Go offline | H1o offline banner, booking blocked |
| Drop | Vile Parle East | Minimum hub fare, Auto ₹120 (B2m, B2mi) |
| Drop | Lonavala | Outside service area (B2o) → Other ways out of T2 (B2w) |
| Home | `AB 123` / `hello` | Not found / format error |
| Bags | 3 check-in bags | Recommendation switches to SUV |
| Summary | Other options → Pool | Women-only prompt (first time), then pool details |
| Lock sheet | Change → Credit or debit card → Pay | Payment fails (B4e); UPI and Google Pay succeed |
| Profile | Appearance | System / Light / Dark |
| Profile | Reset prototype | Clears everything, back to splash |

## Inferred screens (not in the mid-fi set)

- Splash (brand indigo, logo tile + wordmark)
- iOS notification permission alert
- Location-off sheet on "Use my current location"
- Sign-in gate sheet when a guest taps Continue on booking
- Drop, Bags, Other options, Fare details, Payment, Share sheets
- Trips, Help and Profile tabs (light versions so the tab bar has no dead ends)

## Not built yet (marked in the UI)

- Real payments, push notifications, flight API, maps SDK, phone calls, camera: all simulated
- Hindi / Marathi, adding payment methods, picking from phone contacts, inviting a co-rider, photo upload in reports, updating bags at the bay → "Coming soon" toast

## Assets

Illustrations live in `assets/illustrations/` (lowercase, copied from `../Assets/Illustrations`). Each slot falls back to a labelled placeholder if the file is missing.

| File | Used on |
| --- | --- |
| `welcome-hero.png` | O1 Welcome |
| `location-permission.png` | O5 Location |
| `notification-permission.png` | O6 Notifications |
| `help-empty.png` | Help tab |
| `flight-cancelled.png` | R4x flight cancelled |
| `ride-cancelled.png` | R4cd ride cancelled |
| `bags-waiting.png` | R5b, R5h bags delayed |
| `finding-driver.png` | L1, L1b, X1l |
| `no-cars-queue.png` | R6e, X2e |
| `bag-left-behind.png` | R10lb |
| `you-are-home.png` | R10 |
| `trip-complete.png` | R10d |

No logo or favicon image files are used: the logo is a styled "S" tile, and the favicon is suppressed with a `data:` URL.

## Data and state

- `js/data.js`: flights, addresses, ride types, fares, OTP rules
- `js/store.js`: state in `localStorage` (`safarnaama.v1`), silent in-memory fallback
