#!/usr/bin/env node
/* Flowscope slice A — data files: screens-a, flows-a, apps-a, patterns-a, elements-a */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
fs.mkdirSync(DATA, { recursive: true });

const screens = JSON.parse(fs.readFileSync(path.join(ROOT, 'tmp/screens-meta.json'), 'utf8'));
fs.writeFileSync(path.join(DATA, 'screens-a.json'), JSON.stringify(screens, null, 1));
console.log('screens-a.json:', screens.length, 'screens');

const FLOWS = [
  { id:'finpulse-send-money', app_id:'finpulse', app_name:'FinPulse', title:'Send money to a contact',
    description:'Pick a contact, enter an amount and confirm — an instant, fee-free transfer from the FinPulse home screen.',
    category:'Finance', platform:'iOS', popularity:92, created:'2026-10-15',
    steps:[
      {screen_id:'finpulse-home-03', caption:'Start from Home', hotspot:{x:22,y:30,label:'Tap Send'}},
      {screen_id:'finpulse-send-contacts-12', caption:'Choose Lukas Meyer', hotspot:{x:50,y:62,label:'Tap a contact'}},
      {screen_id:'finpulse-send-amount-13', caption:'Enter €85.00', hotspot:{x:50,y:92,label:'Tap Continue'}},
      {screen_id:'finpulse-send-confirm-14', caption:'Review the transfer', hotspot:{x:50,y:92,label:'Tap Send €85.00'}},
      {screen_id:'finpulse-send-success-15', caption:'Transfer delivered', hotspot:{x:50,y:78,label:'Tap Done'}},
    ]},
  { id:'pulsefit-start-workout', app_id:'pulsefit', app_name:'PulseFit', title:'Start a guided workout',
    description:'From the home screen into a leg-day session: preview the plan, check the first exercise, train live and review the summary.',
    category:'Health & Fitness', platform:'iOS', popularity:88, created:'2026-10-15',
    steps:[
      {screen_id:'pulsefit-home-02', caption:"Open today's workout", hotspot:{x:50,y:62,label:'Tap Start workout'}},
      {screen_id:'pulsefit-workout-detail-13', caption:'Review the plan', hotspot:{x:50,y:90,label:'Tap Start workout'}},
      {screen_id:'pulsefit-workout-preview-14', caption:'Preview exercise 1', hotspot:{x:50,y:92,label:'Tap Begin set 1'}},
      {screen_id:'pulsefit-workout-active-15', caption:'Train with live stats', hotspot:{x:74,y:90,label:'Tap Complete set'}},
      {screen_id:'pulsefit-workout-summary-16', caption:'Save the summary', hotspot:{x:50,y:76,label:'Tap Save & share'}},
    ]},
  { id:'wanderly-book-flight', app_id:'wanderly', app_name:'Wanderly', title:'Book a flight',
    description:'Search Bremen to Barcelona, compare results, review flight details and check out — ending with a boarding-pass confirmation.',
    category:'Travel', platform:'iOS', popularity:90, created:'2026-10-15',
    steps:[
      {screen_id:'wanderly-search-02', caption:'Search flights', hotspot:{x:50,y:88,label:'Tap Search 240 flights'}},
      {screen_id:'wanderly-results-13', caption:'Compare results', hotspot:{x:80,y:40,label:'Tap Select'}},
      {screen_id:'wanderly-flight-detail-14', caption:'Check flight details', hotspot:{x:50,y:93,label:'Tap Continue to checkout'}},
      {screen_id:'wanderly-checkout-05', caption:'Pay for the trip', hotspot:{x:50,y:93,label:'Tap Pay €190.00'}},
      {screen_id:'wanderly-confirm-15', caption:'Booking confirmed', hotspot:{x:50,y:86,label:'Tap View my trips'}},
    ]},
  { id:'crave-order-lunch', app_id:'crave', app_name:'Crave', title:'Order lunch',
    description:'Find a nearby restaurant, build a cart, check out and follow the courier on the live tracking map.',
    category:'Food & Drink', platform:'iOS', popularity:86, created:'2026-10-15',
    steps:[
      {screen_id:'crave-home-01', caption:'Browse restaurants', hotspot:{x:32,y:56,label:'Tap Bella Napoli'}},
      {screen_id:'crave-restaurant-03', caption:'Add dishes', hotspot:{x:90,y:52,label:'Tap + to add'}},
      {screen_id:'crave-cart-04', caption:'Review your cart', hotspot:{x:50,y:93,label:'Tap Go to checkout'}},
      {screen_id:'crave-checkout-05', caption:'Place the order', hotspot:{x:50,y:93,label:'Tap Place order'}},
      {screen_id:'crave-map-07', caption:'Track the courier live', hotspot:{x:50,y:90,label:'View courier details'}},
    ]},
  { id:'tempo-create-playlist', app_id:'tempo', app_name:'Tempo', title:'Create a playlist',
    description:'Name a new playlist, pick songs from suggestions and land on the finished playlist, ready to shuffle.',
    category:'Music', platform:'iOS', popularity:84, created:'2026-10-15',
    steps:[
      {screen_id:'tempo-profile-08', caption:'Open your playlists', hotspot:{x:50,y:88,label:'Tap Playlists'}},
      {screen_id:'tempo-playlist-new-13', caption:'Name the playlist', hotspot:{x:50,y:92,label:'Tap Create playlist'}},
      {screen_id:'tempo-playlist-add-14', caption:'Choose songs', hotspot:{x:50,y:92,label:'Tap Add 3 songs'}},
      {screen_id:'tempo-playlist-06', caption:'Playlist ready', hotspot:{x:88,y:84,label:'Tap the play button'}},
    ]},
  { id:'finpulse-add-payment-method', app_id:'finpulse', app_name:'FinPulse', title:'Add a payment method',
    description:'From the wallet, add a new card: enter the details, verify with a one-time code and get a confirmation.',
    category:'Finance', platform:'Android', popularity:89, created:'2026-10-15',
    steps:[
      {screen_id:'finpulse-wallet-04', caption:'Open Wallet', hotspot:{x:50,y:32,label:'View your cards'}},
      {screen_id:'finpulse-payment-method-05', caption:'Add a new card', hotspot:{x:88,y:80,label:'Tap the + button'}},
      {screen_id:'finpulse-card-form-16', caption:'Enter card details', hotspot:{x:50,y:90,label:'Tap Continue'}},
      {screen_id:'finpulse-card-verify-17', caption:'Verify with the code', hotspot:{x:70,y:70,label:'Tap Verify card'}},
      {screen_id:'finpulse-card-done-18', caption:'Card added', hotspot:{x:50,y:68,label:'Tap Back to wallet'}},
    ]},
];
fs.writeFileSync(path.join(DATA, 'flows-a.json'), JSON.stringify(FLOWS, null, 1));
console.log('flows-a.json:', FLOWS.length, 'flows');

const APPS = [
  { id:'finpulse', name:'FinPulse', tagline:'Money, minus the stress', category:'Finance',
    platforms:['iOS','Android'], brand_color:'#22D3EE', icon:'assets/apps/finpulse.png', featured:true,
    description:'FinPulse is a fictional mobile bank that unites every account, card and budget in one calm dark interface. Instant euro transfers, smart savings goals and spending insights keep money effortless.' },
  { id:'pulsefit', name:'PulseFit', tagline:'Training that adapts to you', category:'Health & Fitness',
    platforms:['iOS','Android'], brand_color:'#A3E635', icon:'assets/apps/pulsefit.png', featured:false,
    description:'PulseFit is a fictional AI fitness coach with adaptive workout plans, live form feedback and deep activity stats. Dark, high-energy design built around streaks, rings and personal records.' },
  { id:'wanderly', name:'Wanderly', tagline:'Trips that plan themselves', category:'Travel',
    platforms:['iOS','Android'], brand_color:'#EA580C', icon:'assets/apps/wanderly.png', featured:true,
    description:'Wanderly is a fictional travel companion for booking flights, tracking prices and collecting trip stories. Warm cream and terracotta surfaces keep every step of the journey friendly and clear.' },
  { id:'crave', name:'Crave', tagline:'Good food, fast', category:'Food & Drink',
    platforms:['iOS','Android'], brand_color:'#F43F5E', icon:'assets/apps/crave.png', featured:false,
    description:'Crave is a fictional food-delivery app with live courier tracking, one-tap reorders and honest ETAs. Bright, appetising cards and a bold red-orange brand make hunger the only hard part.' },
  { id:'tempo', name:'Tempo', tagline:'Every song you love', category:'Music',
    platforms:['iOS','Android'], brand_color:'#A855F7', icon:'assets/apps/tempo.png', featured:false,
    description:'Tempo is a fictional music streaming app with hi-fi audio, collaborative playlists and a social layer for sharing tracks. Deep purple gradients and neon accents give it a nightclub glow.' },
];
fs.writeFileSync(path.join(DATA, 'apps-a.json'), JSON.stringify(APPS, null, 1));
console.log('apps-a.json:', APPS.length, 'apps');

const PATTERNS = [
  ['onboarding','Onboarding','Full-screen first-run carousel that teaches value props before signup.'],
  ['welcome','Welcome','Branded entry screen with a single clear call to action.'],
  ['login','Login','Credential entry with remember-me, biometrics and recovery paths.'],
  ['home','Home','The app hub: greeting, key metrics and shortcuts to top tasks.'],
  ['feed','Feed','Vertically scrolling content stream of cards from followed sources.'],
  ['search','Search','Query entry with filters, suggestions and ranked results.'],
  ['profile','Profile','User identity, stats and personal collections in one place.'],
  ['settings','Settings','Toggles, preferences and account controls grouped by topic.'],
  ['notifications','Notifications','Chronological inbox of alerts, updates and promos.'],
  ['wallet','Wallet','Overview of accounts, balances and stored value.'],
  ['payment-method','Payment Method','Manage cards and accounts used for paying.'],
  ['checkout','Checkout','Review order, choose payment and confirm purchase.'],
  ['cart','Cart','Editable list of selected items with totals before checkout.'],
  ['subscription','Subscription','Plan picker with pricing tiers and feature comparison.'],
  ['paywall','Paywall','Upsell screen converting free users with trial offers.'],
  ['empty-state','Empty State','Friendly illustration explaining a screen with no content yet.'],
  ['error-state','Error State','Clear failure explanation with retry and escape actions.'],
  ['calendar','Calendar','Month grid or date strip for picking and viewing dates.'],
  ['map','Map','Geographic view with pins, routes and location-based cards.'],
  ['chat','Chat','Message thread with bubbles, composer and quick replies.'],
  ['activity-stats','Activity/Stats','Charts and summaries of user behaviour over time.'],
].map(([id,name,description])=>({id,name,description}));
fs.writeFileSync(path.join(DATA, 'patterns-a.json'), JSON.stringify(PATTERNS, null, 1));
console.log('patterns-a.json:', PATTERNS.length, 'patterns');

const ELEMENTS = [
  ['button','Button','Primary, ghost and soft actions with clear labels.'],
  ['card','Card','Elevated container grouping related content.'],
  ['tab-bar','Tab Bar','iOS bottom navigation with icon and label tabs.'],
  ['bottom-sheet','Bottom Sheet','Slide-up panel presenting details over the current screen.'],
  ['modal','Modal','Centered dialog demanding a decision before continuing.'],
  ['search-bar','Search Bar','Rounded query field with icon and placeholder.'],
  ['carousel','Carousel','Horizontally snapping row of cards.'],
  ['toggle','Toggle','On/off switch for a single setting.'],
  ['slider','Slider','Draggable track for choosing a value in a range.'],
  ['progress-bar','Progress Bar','Linear fill showing completion toward a goal.'],
  ['avatar','Avatar','Circular identity mark with initials or photo.'],
  ['badge','Badge','Small pill highlighting status, counts or promos.'],
  ['chip','Chip','Compact filter or category selector.'],
  ['fab','FAB','Floating action button for the screen\u2019s primary action.'],
  ['segmented-control','Segmented Control','Inline switcher between two to four views.'],
  ['list-item','List Item','Row with icon, title, subtitle and optional chevron.'],
  ['text-field','Text Field','Labeled input with placeholder and icon support.'],
  ['checkbox','Checkbox','Multi-select square with label.'],
  ['radio','Radio','Single-select circle within a group.'],
  ['dropdown','Dropdown','Collapsed selector revealing options on tap.'],
  ['date-picker','Date Picker','Strip or grid for choosing calendar dates.'],
  ['chart','Chart','Bar, line, ring or donut visualisation of data.'],
  ['skeleton','Skeleton','Shimmering placeholder shown while content loads.'],
  ['toast','Toast','Transient confirmation message floating above content.'],
  ['banner','Banner','Inline informational strip with icon and dismiss.'],
  ['accordion','Accordion','Expandable Q&A rows revealing answers on tap.'],
  ['stepper','Stepper','Minus/plus control for numeric values.'],
  ['rating','Rating','Star display or input for scores.'],
].map(([id,name,description])=>({id,name,description}));
fs.writeFileSync(path.join(DATA, 'elements-a.json'), JSON.stringify(ELEMENTS, null, 1));
console.log('elements-a.json:', ELEMENTS.length, 'elements');

// ---- validation ----
const ids = new Set(screens.map(s=>s.id));
let ok = true;
for (const f of FLOWS) for (const st of f.steps)
  if (!ids.has(st.screen_id)){ console.error('MISSING SCREEN:', st.screen_id); ok=false; }
const schemaKeys = ['id','app_id','app_name','title','pattern','elements','platform','category','colors','tokens','text','image','width','height','popularity','created'];
for (const s of screens) for (const k of schemaKeys) if (!(k in s)){ console.error('screen missing key', k, s.id); ok=false; }
console.log('validation:', ok ? 'PASS' : 'FAIL');
