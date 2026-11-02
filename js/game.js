// Master of Your Universe: game flow, live diorama viewport, close and final render.
(() => {
const D = window.GAME_DATA, OPT = {}, STEP = {};
D.options.forEach(o => OPT[o.id] = o); D.steps.forEach(s => STEP[s.step] = s);
const STOPS = [{k: 's1', n: 'My team space', sub: 'Where you team up'}, {k: 's2', n: 'My workcafé', sub: 'Where you land after the site'}, {k: 's3', n: 'My meeting room', sub: 'Where you meet'}];
const LAYOUT = {s1: 's1.cluster', s2: 's2.cafe', s3: 's3.room'};
const EDIT_STEPS = Object.keys(D.edit);
const SHORT = {'s1.cluster': 'Desks', 's1.desk': 'At each desk', 's1.hood': 'Neighbourhood', 's1.near': 'Close by', 's2.cafe': 'Café', 's2.seat': 'Seating', 's2.fun': 'Fun', 's2.work': 'Makes it work', 's2.next': 'Next door', 's3.room': 'Room', 's3.kit': 'In the room'};
const DESC = {
  's1.cluster.cocoon': 'High curved screens, quieter', 's1.cluster.pinwheel': 'Desks around a centre, facing out', 's1.cluster.farm': 'One long table for the team',
  's1.cluster.screened': 'Sit-stand desks, screens between', 's1.cluster.focuspod': 'A screened desk for deep work', 's1.cluster.moveit': 'On wheels: the team rearranges',
  's1.hood.rooms': 'Team clusters with small closed and half-open rooms close by', 's1.hood.mix': 'Fewer desks, more choice: booths, quiet desks, open tables, a huddle spot',
  's1.hood.break': 'As before, plus a team break corner: snacks, plants, a sofa', 's1.hood.homebase': 'The team’s own zone around a shared table: lockers, screen, writing wall',
  's2.cafe.workcafe': 'Long work tables with power, booths for 4, a coffee counter and a games corner', 's2.cafe.clubhouse': 'Sofas and lounge chairs, a big TV for music and sports, games at the centre',
  's2.cafe.allday': 'One space that changes through the day: breakfast, then work and huddles, then evening snacks', 's2.cafe.pitstop': 'By the entrance, to land in after the site: quick food, charging, lockers, a bench to write up',
  's3.room.booth': 'Calls and one-to-ones', 's3.room.four': 'Small closed room, screen', 's3.room.mid': 'Closed room for a project group', 's3.room.twelve': 'Large room for the whole team',
  's3.room.huddle': 'Round half-open pod by the team', 's3.room.flexi': 'Walls slide back: meetings by day, ping-pong after',
};
const BIG = {'s3.room.booth': '1-2', 's3.room.four': '4', 's3.room.mid': '6-8', 's3.room.twelve': '12', 's3.room.huddle': 'Open', 's3.room.flexi': '★'};
const SVG = {
  desk: '<path d="M6 18h36v5H6zM10 23v15M38 23v15M18 12h12v6H18z"/>', chair: '<path d="M14 26h20v6H14zM16 32v8M32 32v8M16 26V12h16v14"/>',
  plant: '<path d="M16 30h16l-2 12H18zM24 30V14M24 20c-6-1-9-6-9-10 5 0 9 3 9 8M24 18c5-1 8-5 8-9-5 0-8 3-8 7"/>', screen: '<path d="M6 10h36v22H6zM24 32v6M16 40h16"/>',
  locker: '<path d="M10 6h28v36H10zM24 6v36M18 16v4M30 16v4"/>', room: '<path d="M8 14 24 6l16 8v20l-16 8-16-8zM24 22v20M8 14l16 8 16-8"/>',
  cup: '<path d="M10 16h22v12a10 10 0 0 1-10 10h-2a10 10 0 0 1-10-10zM32 20h4a5 5 0 0 1 0 10h-4M16 6v6M22 6v6"/>', game: '<path d="M10 16h28a6 6 0 0 1 6 6v6a6 6 0 0 1-10 4l-3-3H17l-3 3a6 6 0 0 1-10-4v-6a6 6 0 0 1 6-6zM14 20v8M10 24h8M32 22h0M36 26h0"/>',
  clock: '<circle cx="24" cy="24" r="16"/><path d="M24 14v10l7 5"/>', door: '<path d="M12 6h24v36H12zM30 24h0M8 42h32"/>', star: '<path d="m24 6 5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z"/>',
  bolt: '<path d="M26 4 10 28h12l-4 16 18-26H24z"/>', check: '<path d="m8 24 10 10 22-22"/>', gear: '<circle cx="24" cy="24" r="6"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M11 37l4-4M33 15l4-4"/>',
  back: '<path d="M20 10 8 22l12 12M8 22h20a12 12 0 0 1 0 24"/>', coin: '<circle cx="24" cy="24" r="16"/><path d="M24 14v20M18 19h9a4 4 0 0 1 0 8h-6a4 4 0 0 0 0 8h9"/>',
};
const ICON_OF = {'s1.cluster': 'desk', 's1.desk': 'screen', 's1.hood': 'room', 's1.near': 'locker', 's2.cafe': 'cup', 's2.seat': 'chair', 's2.fun': 'game', 's2.work': 'bolt', 's2.next': 'door',
  's2.when': 'clock', 's2.report': 'screen', 's3.room': 'room', 's3.length': 'clock', 's3.kit': 'screen', 'close.productive': 'star', 'close.favourite': 'star'};
const svg = (k, stroke = '#fff', w = 3.2) => `<svg viewBox="0 0 48 48" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[k] || SVG.star}</svg>`;
const $ = s => document.querySelector(s), app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const stopOf = k => k.split('.')[0];
const pick1 = k => (G.picks[k] || [])[0];
const shot = s => G.img[s] || (window.Builder && G.picks[LAYOUT[s]]?.length ? Builder.snapshot(s, G.picks) : null);
const clean = t => (t || '').replace(/[^\p{L}\p{N} ,.'-]/gu, '').trim().slice(0, 80);
const list = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a.at(-1);

const G = {name: '', role: 'field', i: -1, picks: {}, free: {}, times: {}, done: new Set(), img: {}, imgKey: {}, ver: {s1: 0, s2: 0, s3: 0}, status: {}, seen: new Set(), change: '', final: null, t0: 0, view: {}, born: {}};

// ============================================================ effects
const fx = $('#fx'), fctx = fx.getContext('2d'); let parts = [];
function sizeFx() { fx.width = innerWidth * devicePixelRatio; fx.height = innerHeight * devicePixelRatio; }
addEventListener('resize', sizeFx); sizeFx();
function confetti(n = 140, x = innerWidth / 2, y = innerHeight / 3) {
  const cols = ['#fac602', '#53ce17', '#39a3ff', '#ffffff', '#ff4d5e', '#ff9a1f'];
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9; parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, c: cols[i % cols.length], l: 120 + Math.random() * 60}); }
  if (!fxRunning) tick();
}
let fxRunning = false;
function tick() {
  fxRunning = parts.length > 0; if (!fxRunning) { fctx.clearRect(0, 0, fx.width, fx.height); return; }
  fctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); fctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.l-- > 0);
  for (const p of parts) { p.vy += .28; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.r); fctx.globalAlpha = Math.min(1, p.l / 40); fctx.fillStyle = p.c; fctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); fctx.restore(); }
  requestAnimationFrame(tick);
}
function toast(t, bad) { const d = document.createElement('div'); d.className = 'toast' + (bad ? ' bad' : ''); d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2000); }
function banner(small, big) { const d = document.createElement('div'); d.className = 'banner'; d.innerHTML = `<div class="in"><small>${esc(small)}</small><div class="ribbon"><span>${esc(big)}</span></div></div>`; document.body.appendChild(d); setTimeout(() => d.remove(), 1950); }

// ============================================================ title
function title() {
  G.i = -1;
  app.innerHTML = `<section class="screen center enter">
    <button class="gbtn blue ibtn corner" id="gear" type="button" aria-label="Settings">${svg('gear')}</button>
    <h1 class="logo"><span class="l1">Master of</span><span class="l2">Your Universe</span></h1>
    <p class="tagline">Your squad needs a new base. Build where you team up, where you land after the site, and where you meet.</p>
    <div class="card-panel title-panel">
      <div class="field"><label for="nm">Your builder name</label><input class="inp" id="nm" maxlength="18" placeholder="Type your name" value="${esc(G.name)}" autocomplete="off"></div>
      <div class="field"><label>Your role</label><div class="seg c3" id="roles">
        ${[['field', 'Field engineer'], ['sales', 'Sales'], ['office', 'Office based']].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${G.role === v}">${l}</button>`).join('')}</div></div>
      <button class="gbtn big" id="play" type="button">PLAY</button>
      ${Img.isOffline() ? `<div style="background:#0a2a6b;border-radius:14px;padding:12px;display:flex;gap:10px;align-items:center"><span style="font-weight:800;flex:1">No image model connected yet, so you’ll only see pins. Connect one to see your office rendered.</span><button class="gbtn sm" id="setup" type="button">SET UP</button></div>`
        : `<p class="note" style="text-align:center;margin:0">Image model: ${esc(Img.NAMES[Img.settings.provider])}</p>`}
    </div></section>`;
  $('#gear').onclick = settings; if ($('#setup')) $('#setup').onclick = settings;
  $('#roles').onclick = e => { const b = e.target.closest('button'); if (!b) return; G.role = b.dataset.v; $('#roles').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  const go = () => { G.name = ($('#nm').value || '').trim() || 'Builder'; route('s1'); };
  $('#play').onclick = go; $('#nm').onkeydown = e => { if (e.key === 'Enter') go(); };
  setTimeout(() => $('#nm')?.focus(), 300);
}

// ============================================================ route map
function route(next) {
  const nodes = [{k: 's1', x: 250, y: 300}, {k: 's2', x: 520, y: 180}, {k: 's3', x: 790, y: 300}];
  const doneStops = STOPS.filter(s => G.done.has(LAYOUT[s.k])).map(s => s.k);
  const idx = next === 'close' ? 3 : nodes.findIndex(n => n.k === next);
  const from = idx === 0 ? {x: 110, y: 430} : nodes[idx - 1] || nodes[2];
  const to = idx < 3 ? nodes[idx] : {x: 900, y: 430};
  app.innerHTML = `<section class="screen center enter"><div class="route-wrap">
    <h1 class="logo" style="margin:0"><span class="l1" style="font-size:clamp(26px,3.6vw,44px)">${next === 'close' ? 'All three stops built!' : idx === 0 ? 'A brand-new floor. Nothing built yet.' : 'Next stop'}</span></h1>
    <svg class="route-svg" viewBox="0 0 1000 520" role="img" aria-label="The route through your new floor">
      <defs><linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f8ff"/><stop offset="1" stop-color="#dbe6f7"/></linearGradient></defs>
      <rect x="40" y="40" width="920" height="440" rx="28" fill="url(#fl)" stroke="#0a2a6b" stroke-width="8"/>
      <g fill="none" stroke="#9fb6d8" stroke-width="3" stroke-dasharray="10 10"><rect x="80" y="80" width="300" height="360" rx="16"/><rect x="400" y="80" width="250" height="360" rx="16"/><rect x="670" y="80" width="250" height="360" rx="16"/></g>
      <g font-family="Lilita One, Arial Black, sans-serif" font-size="22" fill="#6d87b3" text-anchor="middle"><text x="230" y="120">TEAM SPACE</text><text x="525" y="120">WORKCAFÉ</text><text x="795" y="120">MEETING ROOM</text></g>
      <path id="rp" class="route-path" d="M110 430 C 180 400, 200 340, 250 300 S 430 160, 520 180 S 700 330, 790 300 S 880 400, 900 430" fill="none" stroke="#1474e0" stroke-width="10"/>
      ${nodes.map((n, j) => { const done = doneStops.includes(n.k), on = n.k === next;
        return `<g transform="translate(${n.x} ${n.y})"><g class="stop-node ${on ? 'pulse' : ''}"><polygon points="0,-46 40,-23 40,23 0,46 -40,23 -40,-23" fill="${done ? '#53ce17' : on ? '#fac602' : '#40436c'}" stroke="#0a2a6b" stroke-width="7"/>
          <text y="14" text-anchor="middle" font-family="Lilita One, Arial Black, sans-serif" font-size="40" fill="#fff" stroke="#13204a" stroke-width="6" paint-order="stroke">${done ? '✓' : j + 1}</text></g></g>`; }).join('')}
      <g id="av"><circle r="26" fill="#1474e0" stroke="#fff" stroke-width="6"/><text y="10" text-anchor="middle" font-family="Lilita One, Arial Black, sans-serif" font-size="28" fill="#fff">${esc(G.name.charAt(0).toUpperCase())}</text></g>
    </svg>
    <button class="gbtn big ${next === 'close' ? 'green' : ''}" id="go" type="button">${next === 'close' ? 'SEE IT' : 'GO TO STOP ' + (idx + 1)}</button>
  </div></section>`;
  // avatar walks from the last stop to the next one
  const p = $('#rp'), av = $('#av'), L = p.getTotalLength();
  const near = pt => { let best = 0, bd = 1e9; for (let s = 0; s <= L; s += 6) { const q = p.getPointAtLength(s), d = (q.x - pt.x) ** 2 + (q.y - pt.y) ** 2; if (d < bd) { bd = d; best = s; } } return best; };
  const a = near(from), b = near(to), t0 = performance.now();
  (function walk(t) { const k = Math.min(1, (t - t0) / 1400), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2, q = p.getPointAtLength(a + (b - a) * e); av.setAttribute('transform', `translate(${q.x} ${q.y - 34})`); if (k < 1 && document.body.contains(av)) requestAnimationFrame(walk); })(t0);
  $('#go').onclick = () => { if (next === 'close') { G.i = D.steps.findIndex(s => s.step === 'close.productive'); step(); } else { G.i = D.steps.findIndex(s => stopOf(s.step) === next); banner('Stop ' + (idx + 1), STOPS[idx].n); step(); } };
}

// ============================================================ stop screen
function hud(s) {
  const ideas = Object.values(G.picks).flat().filter(id => OPT[id]?.wildcard).length;
  const stepsOfStop = D.steps.filter(x => stopOf(x.step) === stopOf(D.steps[G.i].step)), pos = stepsOfStop.findIndex(x => x.step === D.steps[G.i].step);
  const coins = Img.settings.coins && D.budget[s] ? D.budget[s] - spent(s) : null;
  return `<header class="hud">
    <div class="player"><div class="hex">${esc(G.name.charAt(0).toUpperCase())}</div><div><div class="pname">${esc(G.name)}</div><div class="rank">BUILDER <span style="color:#fff">${G.role === 'field' ? 'FIELD' : G.role === 'sales' ? 'SALES' : 'OFFICE'}</span></div></div></div>
    <div class="progress"><div class="stopbar">${STOPS.map((x, j) => { const cur = x.k === s, done = STOPS.findIndex(y => y.k === s) > j || s === 'close';
      return `${j ? `<span class="sline ${done ? 'done' : ''}"></span>` : ''}<span class="sdot ${cur ? 'on' : ''} ${done ? 'done' : ''}"><b>${done ? '✓' : j + 1}</b><span>${x.n.replace('My ', '')}</span></span>`; }).join('')}</div>
      <div class="bar" aria-label="Progress in this stop"><i style="width:${Math.round(((pos + 1) / stepsOfStop.length) * 100)}%"></i></div></div>
    <div class="pills">${coins !== null ? `<div class="pill" id="coins"><span class="ico">${svg('coin', '#fac602', 3.6)}</span>${coins}</div>` : ''}
      <div class="pill" id="ideas" title="New ideas you picked"><span class="ico">${svg('star', '#fac602', 3.6)}</span>${ideas}</div>
      <button class="gbtn blue ibtn" id="gear" type="button" aria-label="Settings">${svg('gear')}</button></div></header>`;
}
const cost = id => D.cost[id] ?? (Object.values(LAYOUT).includes(id.split('.').slice(0, 2).join('.')) || !OPT[id]?.fragment ? 0 : 1);
const spent = s => Object.keys(G.picks).filter(k => stopOf(k) === s).flatMap(k => G.picks[k]).reduce((a, id) => a + cost(id), 0);

function step() {
  if (G.i >= D.steps.length) return change();
  const st = D.steps[G.i], k = st.step, s = stopOf(k);
  G.picks[k] ||= []; G.t0 = Date.now();
  const opts = D.options.filter(o => o.step === k);
  let title = st.title; if (k === 's2.report' && G.role !== 'field') title = st.alt_title;
  if (k === 'close.favourite') title = 'Which stop would make your work better?';
  const visualStop = s === 'close' ? 'close' : s;
  app.innerHTML = `<section class="screen">${hud(visualStop)}
    <div class="stage">
      <div class="vpwrap"><div class="vp" id="vp">${s === 'close' ? triptych() : '<canvas class="bcanvas" id="bc" aria-label="Your office, built live"></canvas>'}<div class="vtoggle" id="vtog"></div><div class="pins" id="pins"></div><div class="vp-tag" id="tags"></div><div class="vp-status" id="vst" hidden></div><div class="flash" id="flash"></div></div></div>
      <div class="card-panel qpanel">
        <div class="qhead"><div class="eye">${s === 'close' ? 'See it' : STOPS.find(x => x.k === s).n} · step ${D.steps.filter(x => stopOf(x.step) === s).findIndex(x => x.step === k) + 1} of ${D.steps.filter(x => stopOf(x.step) === s).length}</div>
          <h2>${esc(title)}</h2><p>${esc(D.hint[k] || '')}</p></div>
        <div class="picks" id="pk"></div>
        <div class="opts ${k === 'close.favourite' ? 'stops' : ''}" id="opts">${k === 'close.favourite' ? favCards() : opts.map((o, j) => optCard(o, k, j)).join('')}</div>
        ${st.free_text ? `<div class="freebox"><input class="inp" id="free" maxlength="80" placeholder="Something else? Type it" value="${esc(G.free[k] || '')}" aria-label="Something else"></div>` : ''}
        <div class="qfoot"><button class="gbtn navy" id="back" type="button">BACK</button><button class="gbtn" id="next" type="button">BUILD</button></div>
      </div></div></section>`;
  $('#gear').onclick = settings;
  $('#opts').onclick = e => { const b = e.target.closest('.opt'); if (b) toggle(k, b.dataset.id, st.max, b); };
  if (st.free_text) $('#free').oninput = e => { G.free[k] = e.target.value; foot(); };
  $('#back').onclick = () => { if (G.i === 0) return title(); const prev = D.steps[G.i - 1]; G.i--; if (stopOf(prev.step) !== s && s !== 'close') return route(s); step(); };
  $('#next').onclick = next;
  foot();
  if (s !== 'close') { paintViewport(s); pins(s); }
  thumbs();
}
function optCard(o, k, j) {
  const on = G.picks[k].includes(o.id), lay = D.diorama.layouts.find(l => l.option === o.id);
  const visual = !!o.fragment || !!lay;
  const chip = D.deskChip[o.id] ? `<span class="chip">${esc(D.deskChip[o.id])}</span>` : D.verbs[o.id] ? `<span class="chip">${esc(D.verbs[o.id])}</span>` : '';
  const c = Img.settings.coins && cost(o.id) ? `<span class="cost">${svg('coin', '#fac602', 4)}${cost(o.id)}</span>` : '';
  const th = !visual ? '' : `<div class="th" data-th="${o.id}">${BIG[o.id] ? `<span class="big">${BIG[o.id]}</span>` : svg(ICON_OF[k])}${chip}${c}</div>`;
  return `<button type="button" class="opt ${visual ? '' : 'text'} ${o.wildcard ? 'wild' : ''}" data-id="${o.id}" aria-pressed="${on}" style="animation-delay:${j * 40}ms">
    ${th}${o.wildcard ? '<span class="new">★ NEW IDEA</span>' : ''}<span class="tick">${svg('check', '#fff', 6)}</span>
    <span class="nm">${esc(o.label)}</span>${DESC[o.id] ? `<span class="ds">${esc(DESC[o.id])}</span>` : ''}</button>`;
}
// thumbnails: the layout diorama if we have it, otherwise the reference photo from the image library
async function thumbs() {
  for (const el of document.querySelectorAll('[data-th]')) {
    const id = el.dataset.th, lay = D.diorama.layouts.find(l => l.option === id);
    let src = lay ? (await Img.fileImage(lay.id)) || (await Img.cacheGet('base:' + lay.id)) : null;
    if (!src) { const lib = D.library.find(i => i.tags[0] === id) || D.library.find(i => i.tags.includes(id)); if (lib) src = await Img.fileImage(lib.id); }
    if (src && document.body.contains(el)) { const im = new Image(); im.alt = ''; im.src = src; im.onload = () => { el.querySelector('svg,.big')?.remove(); el.prepend(im); }; }
  }
}
function foot() {
  const st = D.steps[G.i], p = G.picks[st.step];
  $('#pk').innerHTML = (st.max > 1 ? Array.from({length: st.max}, (_, j) => `<i class="pp ${j < p.length ? 'f' : ''}"></i>`).join('') + `<span>${p.length}/${st.max}</span>` : '<span>PICK 1</span>');
  $('#next').disabled = p.length < st.min && !(G.free[st.step] || '').trim();
  const nx = D.steps[G.i + 1];
  $('#next').textContent = st.step === 'close.favourite' ? 'NEXT' : !nx ? 'FINISH' : stopOf(nx.step) !== stopOf(st.step) ? (stopOf(st.step) === 'close' ? 'NEXT' : 'FINISH STOP') : D.edit[st.step] || LAYOUT[stopOf(st.step)] === st.step ? 'BUILD' : 'NEXT';
}
function toggle(k, id, max, el) {
  const p = G.picks[k], at = p.indexOf(id), s = stopOf(k);
  if (at >= 0) p.splice(at, 1);
  else {
    if (Img.settings.coins && D.budget[s] && spent(s) - (max === 1 && p[0] ? cost(p[0]) : 0) + cost(id) > D.budget[s]) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return toast('Not enough space coins', true); }
    if (max === 1) p.splice(0, p.length, id);
    else if (p.length < max) p.push(id);
    else { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return toast(`Only ${max}. Remove one first.`, true); }
    G.born[id] = performance.now(); G.view[s] = '3d';
    if (OPT[id]?.wildcard) { toast('★ New idea unlocked!'); const r = el.getBoundingClientRect(); confetti(40, r.left + r.width / 2, r.top + 30); }
  }
  document.querySelectorAll('.opt').forEach(b => b.setAttribute('aria-pressed', p.includes(b.dataset.id)));
  const top = hud(s === 'close' ? 'close' : s); document.querySelector('.hud').outerHTML = top; $('#gear').onclick = settings;
  if (at < 0 && OPT[id]?.wildcard) $('#ideas')?.classList.add('bump');
  foot();
  if (s !== 'close') { if (at >= 0) G.view[s] = '3d'; paintViewport(s); if (k === LAYOUT[s]) { G.done.add(k); build(s); } }
}
function next() {
  const st = D.steps[G.i], k = st.step, s = stopOf(k);
  G.times[k] = Math.round((Date.now() - G.t0) / 1000);
  if (s !== 'close') { const was = G.done.has(k); G.done.add(k); if (D.edit[k] && (G.picks[k].length || clean(G.free[k]))) build(s); else if (!was && k === LAYOUT[s]) build(s); }
  G.i++;
  const nx = D.steps[G.i];
  if (!nx) return change();
  if (stopOf(nx.step) !== s) { if (s === 'close') return step(); confetti(90); return route(stopOf(nx.step) === 'close' ? 'close' : stopOf(nx.step)); }
  step();
}

// ============================================================ the live diorama
function pinList(s) {
  const out = [];
  for (const st of D.steps.filter(x => stopOf(x.step) === s)) {
    const k = st.step, p = G.picks[k] || [];
    if (D.fixedPin[k] && p.length) { const q = D.fixedPin[k]; out.push({key: k + ':' + p.join(','), x: q.x, y: q.y, small: SHORT[k], label: k === 's1.desk' ? p.map(id => OPT[id].label).join(' · ') : OPT[p[0]].label, w: p.some(id => OPT[id].wildcard)}); }
    else if (D.slots[k]) { p.forEach((id, j) => { const q = D.slots[k][j]; if (q) out.push({key: id + '@' + j, x: q.x, y: q.y, small: SHORT[k], label: OPT[id].label, w: OPT[id].wildcard}); });
      const f = clean(G.free[k]); const q = D.slots[k][p.length]; if (f && q) out.push({key: 'free:' + f, x: q.x, y: q.y, small: 'Your idea', label: f, w: true}); }
    else if (k === 's3.kit') p.forEach(id => { const q = D.kitPin[id.split('.').pop()]; if (q) out.push({key: id, x: q.x, y: q.y, small: SHORT[k], label: OPT[id].label, w: OPT[id].wildcard}); });
  }
  return out;
}
const PIN_TAGS = k => k === 's1.desk' ? (G.picks['s1.desk'] || []) : null;
function place(p, s) {
  if (G.view[s] === 'render' && G.img[s]) return p;
  const tags = p.key.startsWith('free:') ? null : p.key.includes(':') ? (PIN_TAGS(p.key.split(':')[0]) || p.key.split(':')[1].split(',')) : [p.key.split('@')[0]];
  let a = tags && window.Builder ? Builder.anchor(tags) : null;
  if (!a && p.key.startsWith('s1.desk')) a = Builder.anchor([pick1('s1.cluster')]);
  return a ? {...p, x: Math.max(6, Math.min(94, a.x)), y: Math.max(14, Math.min(96, a.y))} : p;
}
function pins(s) {
  const box = $('#pins'); if (!box) return;
  // keep labels from piling on top of each other
  const W = box.clientWidth || 800, H = box.clientHeight || 450, placed = [];
  const spread = p => { let x = p.x / 100 * W, y = p.y / 100 * H; for (let n = 0; n < 12; n++) { const hit = placed.find(q => Math.abs(q.x - x) < 150 && Math.abs(q.y - y) < 46); if (!hit) break; y = hit.y - 48; if (y < 60) { y = hit.y + 48; x += 40; } } placed.push({x, y}); return {...p, x: x / W * 100, y: y / H * 100}; };
  box.innerHTML = pinList(s).map(p0 => place(p0, s)).sort((a, b) => b.y - a.y).map(spread).map(p => { const isNew = !G.seen.has(p.key); G.seen.add(p.key);
    return `<div class="pin ${p.w ? 'w' : ''} ${isNew ? 'pop' : ''}" style="left:${p.x}%;top:${p.y}%"><span class="lab"><small>${esc(p.small)}</small>${esc(p.label)}</span><span class="stem"></span><span class="dot"></span></div>`; }).join('');
  const tags = ['s2.when', 's2.report', 's3.length'].filter(k => stopOf(k) === s && G.picks[k]?.length).map(k => `<span class="chipv">${esc((k === 's2.report' ? 'Report here: ' : k === 's2.when' ? 'Used: ' : 'Meetings: ') + G.picks[k].map(id => OPT[id].label).join(', '))}</span>`);
  $('#tags').innerHTML = tags.join('');
}
function status(s, kind, text) {
  G.status[s] = kind ? {kind, text} : null;
  const el = $('#vst'); if (!el || stopOf(D.steps[G.i]?.step || '') !== s) return;
  $('#vperr')?.remove();
  if (kind === 'err') $('#vp').insertAdjacentHTML('beforeend', `<div id="vperr" style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(8,30,80,.82);padding:24px;text-align:center"><div style="max-width:520px;display:flex;flex-direction:column;gap:12px;align-items:center">
    <span class="dt sm" style="font-size:26px">The image model didn’t answer</span><span style="font-weight:800;color:#dbeaff">${esc(text)}</span>
    <div class="row"><button class="gbtn sm" id="vpset" type="button">OPEN SETTINGS</button><button class="gbtn green sm" id="vpretry" type="button">TRY AGAIN</button></div></div></div>`);
  if (kind === 'err') { $('#vpset').onclick = settings; $('#vpretry').onclick = () => build(s); }
  if (!kind) { el.hidden = true; $('#vp .scan')?.remove(); return; }
  el.hidden = false; el.className = 'vp-status' + (kind === 'err' ? ' err' : '');
  el.innerHTML = (kind === 'busy' ? '<span class="spinner"></span>' : '') + esc(text);
  if (kind === 'busy' && !$('#vp .scan')) $('#vp').insertAdjacentHTML('afterbegin', '<div class="scan"></div>');
  if (kind !== 'busy') $('#vp .scan')?.remove();
}
function paintViewport(s, animate) {
  const vp = $('#vp'); if (!vp || stopOf(D.steps[G.i]?.step || '') !== s) return;
  vp.querySelectorAll('.vp-img,.blueprint').forEach(e => e.remove());
  const bc = $('#bc'); if (bc && window.Builder) Builder.draw(bc, s, G.picks, G.born);
  const showRender = G.view[s] === 'render' && G.img[s];
  $('#vtog').innerHTML = `<button type="button" class="gbtn sm ${showRender ? 'navy' : 'blue'}" data-v="3d">3D BUILD</button><button type="button" class="gbtn sm ${showRender ? 'blue' : 'navy'}" data-v="render" ${G.img[s] ? '' : 'disabled title="Appears when the image model has rendered this stop"'}>AI RENDER</button>`;
  $('#vtog').onclick = e => { const b = e.target.closest('[data-v]'); if (!b || b.disabled) return; G.view[s] = b.dataset.v; paintViewport(s); };
  if (showRender) { const im = new Image(); im.className = 'vp-img' + (animate ? ' wipe' : ''); im.alt = 'Your ' + STOPS.find(x => x.k === s).n.replace('My ', ''); im.src = G.img[s]; vp.prepend(im);
    if (animate) { $('#flash').classList.remove('go'); void vp.offsetWidth; $('#flash').classList.add('go'); } }
  const st = G.status[s]; status(s, st?.kind, st?.text);
  pins(s);
}
function blueprint(s) {
  return `<div class="blueprint"><svg viewBox="0 0 800 450" aria-hidden="true"><g fill="none" stroke="#9fb3d1" stroke-width="2">
    <path d="M400 110 L690 245 L400 380 L110 245 Z" fill="#f7f9fc" stroke="#7f98bf" stroke-width="3"/><path d="M110 245 v14 L400 394 L690 259 v-14" stroke="#7f98bf" stroke-width="3"/>
    <path d="M110 245 L400 110 v-70 L110 175 Z M400 110 L690 245 v-70 L400 40 Z" fill="#eef3fa"/>
    ${Array.from({length: 9}, (_, i) => `<path d="M${110 + i * 36.25} ${245 - i * 16.9} L${400 + i * 36.25} ${380 - i * 16.9}" stroke-dasharray="4 6"/>`).join('')}</g></svg>
    <p>${Img.isOffline() ? 'Add an image model in Settings to see your picks built for real. Your pins still count.' : G.picks[LAYOUT[s]]?.length ? 'Building…' : 'Pick a layout to start building.'}</p></div>`;
}
// master empty platform -> layout -> each confirmed step as an AI edit, all on the same camera
async function master() {
  const m = D.diorama.master, f = await Img.fileImage(m.id);
  if (f) { const d = await Img.toDataUrl(f); if (d) return d; }
  const c = await Img.cacheGet('base:' + m.id); if (c) return c;
  const r = await Img.run({prompt: m.prompt, refs: [], refKeys: []});
  await Img.cachePut('base:' + m.id, r.url); saveToServer(m.id, r.url); return r.url;
}
async function layoutImage(L) {
  const f = await Img.fileImage(L.id);
  if (f) return {url: (await Img.toDataUrl(f)) || f, key: 'file:' + L.id};
  const c = await Img.cacheGet('base:' + L.id); if (c) return {url: c, key: 'base:' + L.id};
  if (Img.isOffline()) return null;
  if (!Img.canEdit()) { const r = await Img.run({prompt: `${D.diorama.look} On the platform: ${L.prompt.replace(/^Furnish this empty platform as /, '').split('. Use the whole platform')[0]}.`, refs: [], refKeys: []});
    await Img.cachePut('base:' + L.id, r.url); saveToServer(L.id, r.url); return {url: r.url, key: 'base:' + L.id}; }
  const m = await master();
  const r = await Img.run({prompt: L.prompt, refs: [m], refKeys: ['base:' + D.diorama.master.id]});
  await Img.cachePut('base:' + L.id, r.url); saveToServer(L.id, r.url);
  return {url: r.url, key: 'base:' + L.id};
}
const DESCRIBE = {'s1.desk': 'Every desk has {list}.', 's1.hood': 'Around the desk cluster: {list}.', 's1.near': '{placed}.', 's2.seat': 'Seating: {placed}.', 's2.fun': '{placed}.', 's2.work': '{placed}.',
  's2.next': 'In the back-right corner, behind a low glass wall: {list}.', 's3.kit': 'Inside the room: {list}.'};
function describe(k) {
  const p = G.picks[k] || [], f = clean(G.free[k]); if (!p.length && !f) return '';
  let t = p.length ? (D.slots[k] ? DESCRIBE[k].replace('{placed}', p.map((id, j) => `${OPT[id].fragment} ${D.slots[k][j]?.loc || ''}`.trim()).join('; ')) : DESCRIBE[k].replace('{list}', list(p.map(id => OPT[id].fragment).filter(Boolean)))) : '';
  return (t + (f ? ` Also: ${f}.` : '')).trim();
}
function scenePrompt(s, upto) {
  const L = D.diorama.layouts.find(l => l.option === pick1(LAYOUT[s]));
  const txt = L.prompt.replace(/^Furnish this empty platform as /, '').split('. Use the whole platform')[0];
  const extra = EDIT_STEPS.filter(k => stopOf(k) === s && G.done.has(k) && (!upto || EDIT_STEPS.indexOf(k) <= EDIT_STEPS.indexOf(upto))).map(describe).filter(Boolean).join(' ');
  return `${D.diorama.look} On the platform: ${txt}. ${extra}`.trim();
}
function instruction(k) {
  const p = G.picks[k] || [], f = clean(G.free[k]);
  if (!p.length && !f) return null;
  let t = '';
  if (p.length) { t = D.slots[k] ? D.edit[k].replace('{placed}', p.map((id, j) => `${OPT[id].fragment} ${D.slots[k][j]?.loc || ''}`.trim()).join('; ')) : D.edit[k].replace('{list}', list(p.map(id => OPT[id].fragment).filter(Boolean))); }
  if (f) t += ' ' + D.freeTextEdit.replace('{text}', f);
  return t.trim();
}
async function build(s) {
  const ver = ++G.ver[s], lid = pick1(LAYOUT[s]);
  if (!lid) return;
  const L = D.diorama.layouts.find(l => l.option === lid);
  if (!Img.isOffline() && !Img.canEdit()) {   // generate-only model: render the whole stage in one go, same camera prompt, fixed seed
    const f = await Img.fileImage(L.id), anyEdits = EDIT_STEPS.some(k => stopOf(k) === s && G.done.has(k) && describe(k));
    if (f && !anyEdits) { G.img[s] = f; G.view[s] = 'render'; status(s, null); paintViewport(s, true); return; }
    status(s, 'busy', anyEdits ? 'Rendering your ' + STOPS.find(x => x.k === s).n.replace('My ', '') + '…' : 'Setting up ' + OPT[lid].label + '…');
    try { const r = await Img.run({prompt: scenePrompt(s), refs: [], refKeys: []}); if (ver !== G.ver[s]) return;
      G.img[s] = r.url; G.view[s] = 'render'; G.imgKey[s] = Img.hash(scenePrompt(s)); if (!anyEdits) { Img.cachePut('base:' + L.id, r.url); saveToServer(L.id, r.url); }
      status(s, null); paintViewport(s, true); }
    catch (e) { if (ver === G.ver[s]) { status(s, 'err', e.message.slice(0, 220)); paintViewport(s); } }
    return;
  }
  status(s, 'busy', 'Setting up ' + OPT[lid].label + '…');
  let base;
  try { base = await layoutImage(L); } catch (e) { if (ver === G.ver[s]) { status(s, 'err', 'Image model: ' + e.message); paintViewport(s); } return; }
  if (ver !== G.ver[s]) return;
  if (!base) { G.img[s] = null; status(s, 'info', '3D build · connect an image model for photo renders'); paintViewport(s); return; }
  if (G.img[s] !== base.url) { G.img[s] = base.url; G.view[s] = 'render'; paintViewport(s, true); }
  let img = base.url, key = base.key;
  for (const k of EDIT_STEPS.filter(k => stopOf(k) === s && G.done.has(k))) {
    const ins = instruction(k); if (!ins) continue;
    if (Img.isOffline()) { status(s, 'info', '3D build · connect an image model for photo renders'); return; }
    if (!img.startsWith('data:')) { status(s, 'err', 'Start the game with Start Game to edit images'); return; }
    status(s, 'busy', 'Building ' + (SHORT[k] || '').toLowerCase() + '…');
    const prompt = `Edit this image of an office diorama. ${ins} ${D.diorama.keep}`;
    try { const r = await Img.run({prompt, refs: [img], refKeys: [key]}); key = Img.hash(key + '|' + prompt); img = r.url; }
    catch (e) { if (ver === G.ver[s]) status(s, 'err', e.message.slice(0, 140)); return; }
    if (ver !== G.ver[s]) return;
    G.img[s] = img; G.view[s] = 'render'; paintViewport(s, true);
  }
  G.imgKey[s] = key; status(s, null);
}
async function saveToServer(id, url) { if (await Img.hasServer()) fetch('api/save-image', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id, dataUrl: url})}).catch(() => {}); }

// ============================================================ close: three stops side by side
function triptych() {
  return `<div class="blueprint" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px;align-items:center">${STOPS.map(x => shot(x.k)
    ? `<img src="${shot(x.k)}" alt="${esc(x.n)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;box-shadow:0 4px 0 #0a2a6b">`
    : `<div style="aspect-ratio:16/9;border-radius:12px;background:#dfe7f2;display:grid;place-items:center;font:400 18px var(--display);color:#5a6b86">${esc(x.n)}</div>`).join('')}</div>`;
}
function favCards() {
  return STOPS.map((x, j) => { const id = 'close.favourite.' + x.k, on = G.picks['close.favourite'].includes(id);
    return `<button type="button" class="opt" data-id="${id}" aria-pressed="${on}" style="animation-delay:${j * 60}ms"><div class="th">${shot(x.k) ? `<img src="${shot(x.k)}" alt="" style="object-fit:contain;background:#eef2f8">` : svg(['desk', 'cup', 'room'][j])}</div>
      <span class="tick">${svg('check', '#fff', 6)}</span><span class="nm">${esc(x.n)}</span><span class="ds">${esc(x.sub)}</span></button>`; }).join('');
}
function favStop() { return (pick1('close.favourite') || 'close.favourite.s1').split('.').pop(); }
function change() {
  const s = favStop(), n = STOPS.find(x => x.k === s).n;
  app.innerHTML = `<section class="screen center enter"><div class="card-panel" style="width:min(640px,100%);display:flex;flex-direction:column;gap:14px">
    <div class="qhead"><div class="eye">Before the reveal</div><h2>Change one thing in ${esc(n.toLowerCase())}?</h2><p>Optional. Say it in your own words, and the AI adds it to your render.</p></div>
    <input class="inp" id="chg" maxlength="80" placeholder="For example: more plants, quieter corner" value="${esc(G.change)}">
    <div class="seg c3">${['More plants', 'More daylight', 'A quieter corner'].map(t => `<button type="button" data-t="${t}" aria-pressed="false">${t}</button>`).join('')}</div>
    <div class="qfoot"><button class="gbtn navy" id="skip" type="button">SKIP</button><button class="gbtn green" id="go" type="button">RENDER IT</button></div></div></section>`;
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { $('#chg').value = b.dataset.t; });
  $('#skip').onclick = () => { G.change = ''; final(); };
  $('#go').onclick = () => { G.change = clean($('#chg').value); final(); };
}

// ============================================================ final photoreal render
const CAP = {'s1.desk': 2, 's1.near': 3, 's2.seat': 2, 's2.fun': 2, 's2.work': 2, 's3.kit': 3};
function frags(k) { return [...(G.picks[k] || [])].sort((a, b) => (OPT[b].wildcard ? 1 : 0) - (OPT[a].wildcard ? 1 : 0)).slice(0, CAP[k] || 9).map(id => OPT[id].fragment).filter(Boolean); }
function eyeLevel(s) {
  const parts = [], cam = {s1: 'high', s2: 'wide', s3: 'medium'}[s], add = (pre, a, post = '') => { if (a.length) parts.push(pre + list(a) + post + '.'); };
  const cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);
  if (s === 's1') { parts.push(`Scene: ${D.style.team} ${cap1(frags('s1.cluster')[0] || 'eight compact desks')}.`); add('At the desks: ', frags('s1.desk')); add('Around the team: ', frags('s1.hood')); add('Close to the team: ', frags('s1.near')); }
  else if (s === 's2') { parts.push(`Scene: ${cap1(frags('s2.cafe')[0] || 'a workcafé')}.`); add('Seating: ', frags('s2.seat')); add('For fun: ', frags('s2.fun')); add('To make it work: ', frags('s2.work')); add('Through an open doorway, ', frags('s2.next'), ' is visible'); }
  else { parts.push(`Scene: ${cap1(frags('s3.room')[0] || 'a meeting room')}.`); add('In the room: ', frags('s3.kit')); }
  if (G.change) parts.push(`Also: ${G.change}.`);
  return {scene: parts.join(' '), cam};
}
function finalPrompt(s, withRef) {
  const {scene, cam} = eyeLevel(s), st = D.style;
  const camTxt = st.camera[cam === 'high' ? 'wide' : cam];
  return (withRef ? D.final : 'Professional architectural interior photograph for a workplace design presentation, 16:9 frame. ') + `${scene} ${st.shell} ${st.realism} ${camTxt} ${st.negative}`;
}
async function final(again) {
  const s = favStop(), n = STOPS.find(x => x.k === s).n;
  app.innerHTML = `<section class="screen center"><div class="final enter"><div class="rays"></div>
    <h1 class="logo" style="margin:0"><span class="l1" style="font-size:clamp(24px,3.4vw,40px)">Your future ${esc(n.replace('My ', ''))}</span></h1>
    <div class="frame" id="frame"><div class="wait"><span class="dt" style="font-size:28px">RENDERING…</span><div class="bar"><i></i></div><span style="color:#cfe0ff;font-weight:800">A photoreal render of your picks. About 20 to 60 seconds.</span></div></div>
    <div class="row" id="frow" hidden><button class="gbtn navy" id="again" type="button">RENDER AGAIN</button><button class="gbtn green big" id="all" type="button">SEE ALL</button></div></div></section>`;
  saveSession();
  const sh = shot(s), ref = Img.canEdit() && sh && sh.startsWith('data:') ? sh : null;
  const prompt = finalPrompt(s, !!ref) + (again ? ` Variation ${Date.now() % 1000}.` : '');
  let ok = false;
  if (!Img.isOffline()) {
    try { const r = await Img.run({prompt, refs: ref ? [ref] : [], refKeys: ref ? [G.imgKey[s] || 'img'] : []}); G.final = r.url; ok = true; }
    catch (e) { $('#frame').innerHTML = `<div class="wait"><span class="dt sm" style="font-size:24px">The render didn’t come back</span><span style="font-weight:800">${esc(e.message.slice(0, 200))}</span><button class="gbtn sm" id="fix" type="button">OPEN SETTINGS</button></div>`; $('#fix').onclick = settings; }
  } else {
    $('#frame').innerHTML = `<div class="wait">${shot(s) ? `<img src="${shot(s)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#eef2f8">` : ''}<span class="dt sm" style="font-size:22px;position:relative">Offline mode</span><button class="gbtn sm" id="fix" type="button" style="position:relative">ADD AN IMAGE MODEL</button></div>`; $('#fix').onclick = settings;
  }
  if (ok) { $('#frame').innerHTML = `<img class="vp-img wipe" src="${G.final}" alt="Photoreal render of ${esc(n)}">`; confetti(180); }
  $('#frow').hidden = false;
  $('#again').onclick = () => final(true); $('#all').onclick = results;
}

// ============================================================ results
function results() {
  const chips = s => Object.keys(G.picks).filter(k => stopOf(k) === s).flatMap(k => G.picks[k]).map(id => `<span class="${OPT[id]?.wildcard ? 'w' : ''}">${OPT[id]?.wildcard ? '★ ' : ''}${esc(OPT[id]?.label)}</span>`).join('');
  const dl = (u, name) => u && u.startsWith('data:') ? `<a class="gbtn sm blue" href="${u}" download="${name}.png" style="text-decoration:none;text-align:center">SAVE IMAGE</a>` : '';
  app.innerHTML = `<section class="screen results"><div class="rinner enter">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><h1 class="logo" style="margin:0;text-align:left"><span class="l1">${esc(G.name)}, master of</span><span class="l2" style="font-size:clamp(40px,6vw,76px)">Your Universe</span></h1>
      <div style="margin-left:auto" class="row"><button class="gbtn navy" id="set" type="button">SETTINGS</button><button class="gbtn green" id="again" type="button">PLAY AGAIN</button></div></div>
    ${G.final ? `<div class="frame"><img src="${G.final}" alt="Photoreal render of your favourite stop"></div><div class="row">${dl(G.final, 'my-future-' + favStop())}</div>` : ''}
    <div class="rgrid">${STOPS.map(x => `<div class="rcard">${shot(x.k) ? `<img src="${shot(x.k)}" alt="${esc(x.n)}">` : '<div class="ph">Not built</div>'}
      <div class="rc"><h3>${esc(x.n)}${favStop() === x.k ? ' ★' : ''}</h3><div class="chips">${chips(x.k)}</div>${dl(shot(x.k), 'my-' + x.k)}</div></div>`).join('')}</div>
    <div class="rcard"><div class="rc"><h3>What matters most</h3><div class="chips">${chips('close')}</div></div></div>
  </div></section>`;
  $('#set').onclick = settings;
  $('#again').onclick = () => { Object.assign(G, {i: -1, picks: {}, free: {}, times: {}, done: new Set(), img: {}, imgKey: {}, status: {}, seen: new Set(), change: '', final: null}); title(); };
}
function saveSession() {
  const rec = {at: new Date().toISOString(), name: G.name, role: G.role, picks: G.picks, free: G.free, times: G.times, change: G.change, favourite: favStop(), provider: Img.settings.provider};
  try { const all = JSON.parse(localStorage.getItem('moyu-sessions') || '[]'); all.push(rec); localStorage.setItem('moyu-sessions', JSON.stringify(all)); } catch (e) {}
  Img.hasServer().then(ok => ok && fetch('api/session', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(rec)}).catch(() => {}));
}

// ============================================================ settings
function settings() {
  const S = structuredClone(Img.settings), m = $('#modal');
  const field = (id, label, val, type = 'text', ph = '', listId = '') => `<div class="field"><label for="${id}">${label}</label><input class="inp" id="${id}" type="${type}" value="${esc(val)}" placeholder="${esc(ph)}" autocomplete="off" ${listId ? `list="${listId}"` : ''}></div>`;
  function provFields() {
    const p = S.provider;
    if (p === 'gemini') return `<div class="grid2">${field('k', 'Gemini API key', S.keys.gemini, 'password', 'From Google AI Studio')}${field('m', 'Model', S.models.gemini, 'text', 'gemini-3.1-flash-image')}</div><p class="note">Nano Banana 2. Edits and the final render send the current image along, so the camera stays fixed.</p>`;
    if (p === 'openai') return `<div class="grid2">${field('k', 'OpenAI API key', S.keys.openai, 'password', 'sk-…')}${field('m', 'Model', S.models.openai, 'text', 'gpt-image-1')}</div>`;
    if (p === 'fal') return `<div class="grid2">${field('k', 'fal.ai key', S.keys.fal, 'password')}${field('m', 'Model for new images', S.models.falGen, 'text', 'fal-ai/qwen-image')}${field('m2', 'Model for edits', S.models.falEdit, 'text', 'fal-ai/qwen-image-edit')}</div><p class="note">Any fal image model works. Use an edit model that takes image_url.</p>`;
    if (p === 'unsloth' || p === 'custom') return `<div class="grid2">${field('b', 'Server address', S.base[p], 'text', p === 'unsloth' ? 'http://127.0.0.1:8888/v1' : 'https://…/v1')}${field('k', 'API key', S.keys[p], 'password', p === 'unsloth' ? 'sk-unsloth-…' : '')}${field('m', 'Image model', S.models[p], 'text', 'Press Test to list models', 'mlist')}</div>
      <datalist id="mlist">${Img.providerModels(p).map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      <p class="note">${p === 'unsloth' ? 'Unsloth Studio on this laptop. Start the game with Start Game so requests go through the local server. Pick the Qwen-Image 2.1 model after pressing Test.' : 'For OpenArt, Together, Replicate gateways or any server that speaks the OpenAI images API (/images/generations and /images/edits).'}</p>`;
    return '<p class="note">No AI calls. The game uses images saved in the images folder and shows a pin for every pick.</p>';
  }
  function read() {
    const v = id => $('#' + id)?.value.trim(), p = S.provider;
    if (v('k') !== undefined) S.keys[p] = v('k');
    if (p === 'fal') { S.models.falGen = v('m') || 'fal-ai/qwen-image'; S.models.falEdit = v('m2') || 'fal-ai/qwen-image-edit'; }
    else if (v('m') !== undefined) S.models[p] = v('m');
    if (v('b') !== undefined) S.base[p] = v('b');
    S.route = $('#route').value; S.quality = $('#qual').value; S.coins = $('#coins').checked;
  }
  function draw() {
    m.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="Settings"><div class="card-panel sheet enter">
      <div style="display:flex;align-items:center;gap:12px"><h2>Settings</h2><button class="gbtn blue round" id="x" type="button" aria-label="Close" style="margin-left:auto">✕</button></div>
      <div class="sec"><h3>Image model</h3><div class="provs seg">${Object.entries(Img.NAMES).map(([k, n]) => `<button type="button" data-p="${k}" aria-pressed="${S.provider === k}">${n}</button>`).join('')}</div>
        <div style="margin-top:12px">${provFields()}</div>
        <div class="grid2" style="margin-top:10px"><div class="field"><label for="route">Send requests</label><select class="inp" id="route"><option value="auto">Automatic</option><option value="direct">Straight from this browser</option><option value="proxy">Through the game server</option></select></div>
          <div class="field"><label for="qual">Quality</label><select class="inp" id="qual"><option value="high">High (slower)</option><option value="fast">Fast</option></select></div></div>
        <div class="row" style="justify-content:flex-start;margin-top:12px"><button class="gbtn green sm" id="test" type="button">TEST CONNECTION</button><button class="gbtn sm" id="save" type="button">SAVE</button></div>
        <div class="status" id="st" hidden></div></div>
      <div class="sec"><h3>Game</h3><label class="sw"><input type="checkbox" id="coins" ${S.coins ? 'checked' : ''}> Space coins (optional budget per stop, never a score)</label></div>
      <div class="sec"><h3>Image pack · ${D.diorama.layouts.length + 1} dioramas</h3><p class="note" style="margin:0 0 10px">The empty platform plus one diorama per layout, all from one camera. Generate them once and every player gets an instant start.</p>
        <div class="pack" id="pack"></div><div class="row" style="justify-content:flex-start;margin-top:10px"><button class="gbtn sm" id="gen" type="button">GENERATE MISSING</button><button class="gbtn navy sm" id="clr" type="button">CLEAR CACHE</button></div></div>
      <div class="sec"><h3>Sessions</h3><p class="note" style="margin:0 0 10px" id="scount"></p><button class="gbtn blue sm" id="csv" type="button">EXPORT CSV</button></div>
    </div></div>`;
    m.hidden = false;
    $('#route').value = S.route; $('#qual').value = S.quality;
    m.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { read(); S.provider = b.dataset.p; draw(); });
    $('#x').onclick = () => { m.hidden = true; m.innerHTML = ''; if (G.i === -1 && $('.title-panel')) title(); else if (G.i >= 0 && D.steps[G.i] && stopOf(D.steps[G.i].step) !== 'close') build(stopOf(D.steps[G.i].step)); };
    $('#save').onclick = () => { read(); Img.save(S); say('Saved.', 'ok'); };
    $('#test').onclick = async () => { read(); Img.save(S); say('Testing…'); try { say(await Img.test(), 'ok'); if (S.provider === 'unsloth' || S.provider === 'custom') { const dl = $('#mlist'); if (dl) dl.innerHTML = Img.providerModels(S.provider).map(x => `<option value="${esc(x)}">`).join(''); } } catch (e) { say(e.message, 'bad'); } };
    $('#gen').onclick = genPack; $('#clr').onclick = async () => { await Img.cacheClear(); say('Cache cleared.', 'ok'); pack(); };
    $('#csv').onclick = exportCsv;
    let n = 0; try { n = JSON.parse(localStorage.getItem('moyu-sessions') || '[]').length; } catch (e) {} $('#scount').textContent = `${n} session${n === 1 ? '' : 's'} saved on this device.`;
    pack();
  }
  const say = (t, c) => { const el = $('#st'); if (!el) return; el.hidden = false; el.className = 'status ' + (c || ''); el.textContent = t; };
  async function pack() {
    const rows = [D.diorama.master, ...D.diorama.layouts];
    const out = [];
    for (const r of rows) { const f = await Img.fileImage(r.id), c = f ? null : await Img.cacheGet('base:' + r.id);
      out.push(`<div>${f || c ? `<img src="${f || c}" alt="">` : '<img alt="">'}<span>${esc(r.id)} · ${esc(r.title)}</span><span class="st ${f || c ? 'ok' : ''}">${f ? 'file' : c ? 'cached' : 'missing'}</span><button class="gbtn navy sm" type="button" data-copy="${r.id}" style="padding:6px 10px">COPY PROMPT</button></div>`); }
    if ($('#pack')) { $('#pack').innerHTML = out.join(''); $('#pack').onclick = e => { const b = e.target.closest('[data-copy]'); if (!b) return; const r = rows.find(x => x.id === b.dataset.copy); navigator.clipboard?.writeText(r.prompt).then(() => toast('Prompt copied')).catch(() => toast('Copy blocked', true)); }; }
  }
  async function genPack() {
    read(); Img.save(S);
    if (Img.isOffline()) return say('Pick an image model first.', 'bad');
    try {
      say('Generating the empty platform…'); await master(); pack();
      for (const [i, L] of D.diorama.layouts.entries()) { say(`Generating ${i + 1} of ${D.diorama.layouts.length}: ${L.title}…`); await layoutImage(L); pack(); }
      say('All dioramas ready.', 'ok');
    } catch (e) { say(e.message, 'bad'); }
  }
  draw();
}
function exportCsv() {
  let all = []; try { all = JSON.parse(localStorage.getItem('moyu-sessions') || '[]'); } catch (e) {}
  const rows = [['time', 'name', 'role', 'step', 'picks', 'free_text', 'seconds', 'favourite', 'change_one_thing']];
  all.forEach(r => Object.entries(r.picks).forEach(([k, v]) => rows.push([r.at, r.name, r.role, k, v.map(id => OPT[id]?.label || id).join(' | '), r.free?.[k] || '', r.times?.[k] || '', r.favourite, r.change || ''])));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'})); a.download = 'master-of-your-universe-sessions.csv'; a.click();
}

addEventListener('resize', () => { const st = D.steps[G.i]; if (st && stopOf(st.step) !== 'close' && $('#bc')) paintViewport(stopOf(st.step)); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) { $('#modal').hidden = true; $('#modal').innerHTML = ''; } });
title();
})();
