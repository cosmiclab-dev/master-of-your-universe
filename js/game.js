// Master of Your Universe: game flow (spec v2).
(() => {
const D = window.GAME_DATA, OPT = {}, STEP = {};
D.options.forEach(o => OPT[o.id] = o); D.steps.forEach(s => STEP[s.step] = s);
const STOPS = [{k: 's1', n: 'Your team space', short: 'Team space', line: 'Where your team works together every day.'},
  {k: 's2', n: 'Your café', short: 'Café', line: 'Make it a place you’d come back to after the site.'},
  {k: 's3', n: 'Your meeting room', short: 'Meeting room', line: 'The room your team meets in.'}];
const LAYOUT = {s1: 's1.cluster', s2: 's2.cafe', s3: 's3.room'};
const DEMO = {'s1.cluster': ['s1.cluster.farm'], 's1.hood': ['s1.hood.break'], 's1.near': ['s1.near.lockers', 's1.near.plants', 's1.near.phonebooth'], 's2.cafe': ['s2.cafe.workcafe'],
  's2.seat': ['s2.seat.booths4', 's2.seat.sofas'], 's2.fun': ['s2.fun.pool'], 's2.next': ['s2.next.plantroom'], 's3.room': ['s3.room.twelve'], 's3.kit': ['s3.kit.video']};
const SVG = {
  clock: '<circle cx="24" cy="24" r="16"/><path d="M24 14v10l7 5"/>', star: '<path d="m24 6 5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z"/>', check: '<path d="m8 24 10 10 22-22"/>',
  chat: '<path d="M8 10h32v20H22l-8 8v-8H8z"/>', bolt: '<path d="M26 4 10 28h12l-4 16 18-26H24z"/>', menu: '<path d="M8 14h32M8 24h32M8 34h32"/>', coin: '<circle cx="24" cy="24" r="16"/><path d="M24 15v18M19 20h8a3.5 3.5 0 0 1 0 7h-6a3.5 3.5 0 0 0 0 7h8"/>',
  gear: '<circle cx="24" cy="24" r="6"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M11 37l4-4M33 15l4-4"/>', camera: '<path d="M6 16h8l4-5h12l4 5h8v22H6z"/><circle cx="24" cy="26" r="7"/>', cube: '<path d="M24 5 41 14v20L24 43 7 34V14zM24 24 41 14M24 24 7 14M24 24v19"/>',
  plus: '<path d="M24 10v28M10 24h28"/>', sales: '<path d="M8 36 18 24l8 6 14-16M30 14h10v10"/>', wrench: '<path d="M30 6a10 10 0 0 0-9 14L7 34l7 7 14-14a10 10 0 0 0 14-9l-6 6-6-2-2-6z"/>',
  building: '<path d="M10 42V8h20v34M30 18h8v24M16 14h4M16 22h4M16 30h4M10 42h30"/>',
};
const ICON_TEXT = {'s2.when': 'clock', 's2.report': 'chat', 's3.length': 'clock', 'close.productive': 'bolt'};
const svg = (k, c = '#fff', w = 3.4) => `<svg viewBox="0 0 48 48" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[k] || SVG.star}</svg>`;
const $ = s => document.querySelector(s), app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const stopOf = k => k.split('.')[0];
const clean = t => (t || '').replace(/[^\p{L}\p{N} ,.'-]/gu, '').trim().slice(0, 80);
const list = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a.at(-1);
const label = id => D.nameFix[id] || OPT[id]?.label || id;

const fresh = () => ({name: '', role: 'field', i: -1, picks: {}, free: {}, times: {}, born: {}, photo: {}, photoBusy: {}, photoErr: {}, view: {}, pinAt: {}, change: '', final: null, t0: 0, coached: false, started: Date.now()});
let G = fresh();
const pick1 = k => (G.picks[k] || [])[0];
const stepsOf = s => D.steps.filter(x => stopOf(x.step) === s);

// ============================================================ effects
const fx = $('#fx'), fctx = fx.getContext('2d'); let parts = [], fxOn = false;
function sizeFx() { fx.width = innerWidth * devicePixelRatio; fx.height = innerHeight * devicePixelRatio; } addEventListener('resize', sizeFx); sizeFx();
function confetti(n = 140, x = innerWidth / 2, y = innerHeight / 3) {
  const cols = ['#fac602', '#53ce17', '#39a3ff', '#ffffff', '#ff4d5e', '#ff9a1f'];
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9; parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, c: cols[i % cols.length], l: 110 + Math.random() * 60}); }
  if (!fxOn) tick();
}
function tick() {
  fxOn = parts.length > 0; fctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); fctx.clearRect(0, 0, innerWidth, innerHeight); if (!fxOn) return;
  parts = parts.filter(p => p.l-- > 0);
  for (const p of parts) { p.vy += .28; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.r); fctx.globalAlpha = Math.min(1, p.l / 40); fctx.fillStyle = p.c; fctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); fctx.restore(); }
  requestAnimationFrame(tick);
}
function toast(t, bad) { const d = document.createElement('div'); d.className = 'toast' + (bad ? ' bad' : ''); d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2000); }
function banner(small, big) { const d = document.createElement('div'); d.className = 'banner'; d.innerHTML = `<div class="in"><small>${esc(small)}</small><div class="ribbon"><span>${esc(big)}</span></div></div>`; document.body.appendChild(d); setTimeout(() => d.remove(), 1950); }
const enter = html => { Builder.stop(); app.innerHTML = html; app.firstElementChild?.classList.add('enter'); idle(); };

// ============================================================ title
function title() {
  G = fresh();
  enter(`<section class="screen title-screen"><canvas class="floorbg" id="floor" aria-hidden="true"></canvas>
    <button class="gbtn navy ibtn corner" id="fac" type="button" aria-label="Facilitator settings" title="Facilitator">${svg('gear')}</button>
    <div class="title-stack"><h1 class="logo" id="logo"><span class="l1">Master of</span><span class="l2">Your Universe</span></h1>
      <p class="tagline">Design the office you’d actually want to work in.</p>
      <button class="gbtn big" id="start" type="button">START</button></div></section>`);
  Builder.floor($('#floor'), DEMO, {drift: true, clear: true, pad: 0.95});
  $('#start').onclick = onboardName; $('#fac').onclick = () => facilitator();
  let t; $('#logo').onpointerdown = () => { t = setTimeout(() => facilitator(), 800); }; $('#logo').onpointerup = () => clearTimeout(t);
}

// ============================================================ onboarding
function onboardName() {
  enter(`<section class="screen center"><div class="card-panel ob-card">
    <div class="ob-dots"><i class="on"></i><i></i><i></i></div>
    <h2 class="dt h2">Who’s building?</h2><p class="lede">Pick a name and your role.</p>
    <div class="field"><label for="nm">Your name</label><input class="inp" id="nm" maxlength="16" placeholder="Type your name" value="${esc(G.name)}" autocomplete="off"></div>
    <div class="roles" id="roles">${[['field', 'Field engineer', 'wrench'], ['sales', 'Sales', 'sales'], ['office', 'Office based', 'building']].map(([v, l, ic]) => `<button type="button" class="role" data-v="${v}" aria-pressed="${G.role === v}">${svg(ic, '#fff', 3)}<span>${l}</span></button>`).join('')}</div>
    <button class="gbtn" id="next" type="button">NEXT</button></div></section>`);
  const nm = $('#nm'), go = () => { G.name = (nm.value || '').trim(); if (!G.name) { nm.classList.add('shake'); nm.focus(); setTimeout(() => nm.classList.remove('shake'), 400); return; } onboardFloor(); };
  $('#roles').onclick = e => { const b = e.target.closest('.role'); if (!b) return; G.role = b.dataset.v; document.querySelectorAll('.role').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  $('#next').onclick = go; nm.onkeydown = e => { if (e.key === 'Enter') go(); }; setTimeout(() => nm.focus(), 250);
}
function onboardFloor() {
  enter(`<section class="screen"><canvas class="floorbg" id="floor" aria-hidden="true"></canvas>
    <div class="ob-bottom"><div class="card-panel ob-card wide">
      <div class="ob-dots"><i class="on"></i><i class="on"></i><i></i></div>
      <h2 class="dt h2">This is your new floor</h2><p class="lede">It’s empty. Three spaces, about four minutes, and no wrong answers.</p>
      <div class="ob-stops">${STOPS.map((s, j) => `<span><b>${j + 1}</b>${s.short}</span>`).join('')}</div>
      <div class="row"><button class="gbtn" id="go" type="button">LET’S GO</button></div></div></div></section>`);
  Builder.floor($('#floor'), {}, {clear: true, pad: 0.86, glow: now => [['s1', 's2', 's3'][Math.floor(now / 900) % 3]]});
  $('#go').onclick = () => route('s1');
}

// ============================================================ route map between stops
function route(next) {
  const idx = STOPS.findIndex(s => s.k === next), done = STOPS.filter(s => pick1(LAYOUT[s.k])).map(s => s.k);
  const isClose = next === 'close', st = STOPS[idx];
  enter(`<section class="screen"><canvas class="floorbg" id="floor" aria-hidden="true"></canvas>
    <div class="ob-bottom"><div class="card-panel ob-card wide">
      <div class="ob-stops">${STOPS.map((s, j) => `<span class="${done.includes(s.k) ? 'done' : s.k === next ? 'on' : ''}"><b>${done.includes(s.k) ? '✓' : j + 1}</b>${s.short}</span>`).join('')}</div>
      <div class="eyebrow">${isClose ? 'All three spaces built' : `Stop ${idx + 1} of 3`}</div>
      <h2 class="dt h2">${isClose ? 'Nice work, ' + esc(G.name) : esc(st.n)}</h2><p class="lede">${isClose ? 'Two quick questions, then we make a photo of your favourite space.' : esc(st.line)}</p>
      <div class="row"><button class="gbtn ${isClose ? 'green' : ''}" id="go" type="button">${isClose ? 'SEE IT' : 'LET’S BUILD'}</button></div></div></div></section>`);
  Builder.floor($('#floor'), G.picks, {clear: true, pad: 0.86, glow: isClose ? [] : [next]});
  $('#go').onclick = () => { if (isClose) { G.i = D.steps.findIndex(s => s.step === 'close.productive'); return step(); } G.i = D.steps.findIndex(s => stopOf(s.step) === next); banner(`Stop ${idx + 1}`, st.short); step(); };
}

// ============================================================ HUD
const cost = id => D.cost[id] ?? (Object.values(LAYOUT).includes(id.split('.').slice(0, 2).join('.')) || !OPT[id]?.fragment ? 0 : 1);
const spent = s => Object.keys(G.picks).filter(k => stopOf(k) === s).flatMap(k => G.picks[k]).reduce((a, id) => a + cost(id), 0);
function hud(s) {
  const ideas = Object.values(G.picks).flat().filter(id => OPT[id]?.wildcard).length;
  const steps = stepsOf(s), pos = steps.findIndex(x => x.step === D.steps[G.i].step);
  const coins = Img.settings.coins && D.budget[s] ? D.budget[s] - spent(s) : null;
  return `<header class="hud">
    <div class="player"><div class="hex">${esc(G.name.charAt(0).toUpperCase())}</div><div><div class="pname">${esc(G.name)}</div><div class="rank">${G.role === 'field' ? 'FIELD ENGINEER' : G.role === 'sales' ? 'SALES' : 'OFFICE'}</div></div></div>
    <div class="progress"><div class="stopbar">${STOPS.map((x, j) => { const cur = x.k === s, done = s === 'close' || STOPS.findIndex(y => y.k === s) > j;
      return `${j ? `<span class="sline ${done ? 'done' : ''}"></span>` : ''}<span class="sdot ${cur ? 'on' : ''} ${done ? 'done' : ''}"><b>${done ? '✓' : j + 1}</b><span>${x.short}</span></span>`; }).join('')}</div>
      <div class="stepdots">${steps.map((x, j) => `<i class="${j < pos ? 'd' : j === pos ? 'c' : ''}"></i>`).join('')}</div></div>
    <div class="pills">${coins !== null ? `<div class="pill" id="coins" title="Space coins left"><span class="ico">${svg('coin', '#fac602', 3.6)}</span>${coins}</div>` : ''}
      <div class="pill" id="ideas" title="New ideas you picked"><span class="ico">${svg('star', '#fac602', 3.6)}</span>${ideas}</div>
      <button class="gbtn navy ibtn" id="menu" type="button" aria-label="Menu">${svg('menu')}</button></div></header>`;
}
function bindHud() { $('#menu').onclick = menu; }
function menu() {
  const m = $('#modal');
  m.innerHTML = `<div class="modal"><div class="card-panel sheet small enter"><h2 class="dt h2">Paused</h2><div class="menu-list">
    <button class="gbtn" id="m1" type="button">KEEP BUILDING</button><button class="gbtn navy" id="m2" type="button">START OVER</button><button class="gbtn blue sm" id="m3" type="button">FACILITATOR</button></div></div></div>`;
  m.hidden = false; const close = () => { m.hidden = true; m.innerHTML = ''; };
  $('#m1').onclick = close; $('#m2').onclick = () => { close(); title(); }; $('#m3').onclick = () => { close(); facilitator(); };
}

// ============================================================ a step
function step() {
  if (G.i >= D.steps.length) return change();
  const st = D.steps[G.i], k = st.step, s = stopOf(k), c = D.copy[k] || {};
  G.picks[k] ||= []; G.t0 = Date.now();
  const opts = D.options.filter(o => o.step === k);
  const t = k === 's2.report' && G.role !== 'field' ? D.reportOthers : c;
  const isClose = s === 'close', stepNo = stepsOf(s).findIndex(x => x.step === k) + 1;
  enter(`<section class="screen play">${hud(s)}
    <div class="stage">
      <div class="vpwrap"><div class="vp" id="vp"><canvas class="bcanvas" id="bc" aria-label="Your space, built live"></canvas><img class="vp-img" id="photo" alt="" hidden>
        <div class="pins" id="pins"></div><div class="vp-tag" id="tags"></div><div class="vtoggle" id="vtog"></div><button class="vchip" id="vchip" type="button" hidden></button></div></div>
      <aside class="card-panel tray">
        <div class="qhead"><div class="eyebrow">${isClose ? 'Last two questions' : STOPS.find(x => x.k === s).n + ' · ' + stepNo + ' of ' + stepsOf(s).length}</div><h2>${esc(t.title)}</h2>${t.sub ? `<p>${esc(t.sub)}</p>` : ''}</div>
        <div class="picks" id="pk"></div>
        <div class="opts ${k === 'close.favourite' ? 'stops' : ''}" id="opts">${k === 'close.favourite' ? favCards() : opts.map((o, j) => card(o, k, j)).join('')}</div>
        ${st.free_text ? `<div class="freebox"><span class="plus">${svg('plus', '#7fd3ff', 4)}</span><input class="inp" id="free" maxlength="80" placeholder="Your own idea (optional)" value="${esc(G.free[k] || '')}" aria-label="Your own idea"></div>` : ''}
        <div class="qfoot"><button class="gbtn navy" id="back" type="button">BACK</button><button class="gbtn" id="next" type="button">${esc(c.button || 'NEXT')}</button></div>
        <div class="coach" id="coach" hidden>Tap a setup to place it</div>
      </aside></div></section>`);
  bindHud();
  const box = $('#opts');
  box.onclick = e => { const b = e.target.closest('.opt'); if (b) toggle(k, b.dataset.id, st.max, b); };
  box.onmouseover = e => { const b = e.target.closest('.opt'); if (b && !isClose && b.dataset.id !== box.dataset.hover) { box.dataset.hover = b.dataset.id; ghost(k, b.dataset.id, st.max); } };
  box.onmouseleave = () => { box.dataset.hover = ''; if (!isClose) paint(s); };
  if (st.free_text) $('#free').oninput = e => { G.free[k] = e.target.value; foot(); };
  $('#back').onclick = () => { if (G.i === 0) return onboardFloor(); const prev = D.steps[G.i - 1]; G.i--; if (stopOf(prev.step) !== s) return route(s === 'close' ? 's3' : s); step(); };
  $('#next').onclick = next;
  if (!G.coached && k === 's1.cluster') $('#coach').hidden = false;
  foot(); paint(isClose ? 'close' : s);
}
function card(o, k, j) {
  const on = G.picks[k].includes(o.id), icon = o.fragment && window.Builder ? Builder.icon(o.id) : null;
  const chip = D.deskChip[o.id] ? `<span class="chip">${esc(D.deskChip[o.id])}</span>` : '';
  const c = Img.settings.coins && cost(o.id) ? `<span class="cost">${svg('coin', '#fac602', 4)}${cost(o.id)}</span>` : '';
  const th = icon ? `<div class="th"><img src="images/opt/${o.id}.png" data-fb="${icon}" onerror="this.onerror=null;this.src=this.dataset.fb" alt="">${chip}${c}</div>` : '';
  return `<button type="button" class="opt ${icon ? '' : 'text'} ${o.wildcard ? 'wild' : ''}" data-id="${o.id}" aria-pressed="${on}" style="animation-delay:${j * 35}ms">
    ${th}${o.wildcard ? '<span class="new">★ NEW IDEA</span>' : ''}<span class="tick">${svg('check', '#fff', 6)}</span>
    ${icon ? '' : `<span class="tico">${svg(ICON_TEXT[k] || 'star', '#7fd3ff', 3.4)}</span>`}
    <span class="nm">${esc(label(o.id))}</span>${D.benefit[o.id] ? `<span class="ds">${esc(D.benefit[o.id])}</span>` : ''}</button>`;
}
function favCards() {
  return STOPS.map((x, j) => { const id = 'close.favourite.' + x.k, on = G.picks['close.favourite'].includes(id), img = G.photo[x.k]?.url || Builder.snapshot(x.k, G.picks);
    return `<button type="button" class="opt" data-id="${id}" aria-pressed="${on}" style="animation-delay:${j * 60}ms"><div class="th"><img src="${img}" alt=""></div>
      <span class="tick">${svg('check', '#fff', 6)}</span><span class="nm">${esc(x.n)}</span><span class="ds">${esc(x.line)}</span></button>`; }).join('');
}
function foot() {
  const st = D.steps[G.i], p = G.picks[st.step];
  $('#pk').innerHTML = st.max > 1 ? Array.from({length: st.max}, (_, j) => `<i class="pp ${j < p.length ? 'f' : ''}"></i>`).join('') + `<span>${p.length} of ${st.max}</span>` : `<span>${p.length ? 'Picked' : 'Pick one'}</span>`;
  $('#next').disabled = p.length < st.min && !(G.free[st.step] || '').trim();
}
function toggle(k, id, max, el) {
  const p = G.picks[k], at = p.indexOf(id), s = stopOf(k);
  const nope = msg => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); toast(msg, true); };
  if (at >= 0) p.splice(at, 1);
  else {
    if (Img.settings.coins && D.budget[s] && spent(s) - (max === 1 && p[0] ? cost(p[0]) : 0) + cost(id) > D.budget[s]) return nope('Not enough space coins');
    if (max === 1) p.splice(0, p.length, id); else if (p.length < max) p.push(id); else return nope(`That’s ${max} already. Remove one first.`);
    G.born[id] = performance.now(); G.view[s] = '3d';
    if (OPT[id]?.wildcard) { toast('★ New idea!'); const r = el.getBoundingClientRect(); confetti(36, r.left + r.width / 2, r.top + 30); }
    if (!G.coached) { G.coached = true; $('#coach').hidden = true; }
  }
  document.querySelectorAll('.opt').forEach(b => b.setAttribute('aria-pressed', p.includes(b.dataset.id)));
  document.querySelector('.hud').outerHTML = hud(s); bindHud();
  if (at < 0 && OPT[id]?.wildcard) $('#ideas')?.classList.add('bump');
  foot(); $('#opts').dataset.hover = ''; paint(s === 'close' ? 'close' : s);
}
function next() {
  const st = D.steps[G.i], k = st.step, s = stopOf(k);
  G.times[k] = Math.round((Date.now() - G.t0) / 1000);
  G.i++;
  const nx = D.steps[G.i];
  if (s !== 'close' && (!nx || stopOf(nx.step) !== s)) photo(s);   // finishing a space: make its photo in the background
  if (!nx) return change();
  if (stopOf(nx.step) !== s) { if (s === 'close') return step(); confetti(90); return route(stopOf(nx.step) === 'close' ? 'close' : stopOf(nx.step)); }
  step();
}

// ============================================================ viewport: 3D build, pins, photo
function paint(s) {
  const bc = $('#bc'); if (!bc) return;
  if (s === 'close') {
    const fav = (pick1('close.favourite') || '').split('.').pop();
    Builder.floor(bc, G.picks, {pad: 0.9, glow: fav ? [fav] : []}); $('#pins').innerHTML = ''; $('#vtog').innerHTML = ''; return;
  }
  Builder.draw(bc, s, G.picks, G.born, {step: D.steps[G.i].step});
  pins(s); photoUI(s);
}
function ghost(k, id, max) {
  const s = stopOf(k), p = G.picks[k] || []; if (p.includes(id) || !OPT[id]?.fragment) return;
  if (max > 1 && p.length >= max) return;
  if (G.view[s] === 'photo') { G.view[s] = '3d'; photoUI(s); }
  Builder.draw($('#bc'), s, G.picks, G.born, {step: k, ghost: {k, id, max}});
}
function pinList(s) {
  const out = [];
  for (const st of stepsOf(s)) {
    const k = st.step, p = G.picks[k] || [];
    if (!p.length) continue;
    if (k === 's1.desk') out.push({key: k + ':' + p.join(','), tags: p, alt: [pick1('s1.cluster')], label: p.map(label).join(' · '), small: 'At each desk', w: p.some(id => OPT[id].wildcard)});
    else if (['s1.cluster', 's1.hood', 's2.cafe', 's2.next', 's3.room'].includes(k)) out.push({key: p[0], tags: p, label: label(p[0]), small: '', w: OPT[p[0]].wildcard});
    else if (OPT[p[0]].fragment) p.forEach(id => out.push({key: id, tags: [id], label: label(id), small: '', w: OPT[id].wildcard}));
  }
  return out;
}
function pins(s) {
  const box = $('#pins'); if (!box) return;
  if (G.view[s] === 'photo' && G.photo[s]) { box.innerHTML = ''; return; }
  const W = box.clientWidth || 800, H = box.clientHeight || 450, now = Date.now(), placed = [];
  const items = pinList(s).map(p => { const a = Builder.anchor(p.tags) || (p.alt && Builder.anchor(p.alt)); return a && {...p, x: a.x, y: a.y}; }).filter(Boolean);
  let n = 0;
  box.innerHTML = items.map(p => {
    G.pinAt[p.key] ??= now; const isNew = now - G.pinAt[p.key] < 2200; n++;
    let x = p.x / 100 * W, y = p.y / 100 * H;
    if (isNew) { for (let t = 0; t < 8; t++) { const hit = placed.find(q => Math.abs(q.x - x) < 140 && Math.abs(q.y - y) < 42); if (!hit) break; y = hit.y - 44; } placed.push({x, y}); }
    return `<div class="pin ${p.w ? 'w' : ''} ${isNew ? 'pop' : 'mini'}" style="left:${x / W * 100}%;top:${y / H * 100}%" tabindex="0"><span class="lab">${p.small ? `<small>${esc(p.small)}</small>` : ''}${esc(p.label)}</span><span class="dot">${n}</span></div>`;
  }).join('');
  clearTimeout(pins.t); pins.t = setTimeout(() => { box.querySelectorAll('.pin.pop').forEach(el => { el.classList.remove('pop'); el.classList.add('mini'); }); }, 2300);
  $('#tags').innerHTML = ['s2.when', 's2.report', 's3.length'].filter(k => stopOf(k) === s && G.picks[k]?.length).map(k => `<span class="chipv">${svg(ICON_TEXT[k], '#fff', 3.6)}${esc(G.picks[k].map(label).join(', '))}</span>`).join('');
}
const picksKey = s => JSON.stringify(Object.entries(G.picks).filter(([k]) => stopOf(k) === s).concat([['f', G.free['s1.near'] || '']]));
function photoUI(s) {
  const tog = $('#vtog'), chip = $('#vchip'), im = $('#photo'); if (!tog) return;
  const ph = G.photo[s], current = ph && ph.key === picksKey(s), show = G.view[s] === 'photo' && ph;
  im.hidden = !show; if (show && im.getAttribute('src') !== ph.url) im.src = ph.url;
  tog.innerHTML = Img.isOffline() || !pick1(LAYOUT[s]) ? '' : `<button type="button" class="seg2 ${show ? '' : 'on'}" data-v="3d">${svg('cube', 'currentColor', 3.4)}3D</button><button type="button" class="seg2 ${show ? 'on' : ''}" data-v="photo">${svg('camera', 'currentColor', 3.4)}${ph ? (current ? 'PHOTO' : 'UPDATE PHOTO') : 'MAKE PHOTO'}</button>`;
  tog.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; if (b.dataset.v === '3d') { G.view[s] = '3d'; paint(s); return; } if (ph && current) { G.view[s] = 'photo'; paint(s); } else photo(s, true); };
  chip.hidden = !(G.photoBusy[s] || G.photoErr[s]);
  chip.className = 'vchip' + (G.photoErr[s] ? ' err' : '');
  chip.innerHTML = G.photoBusy[s] ? '<span class="spinner"></span>Making a photo…' : G.photoErr[s] ? 'Photo unavailable · Retry' : '';
  chip.title = G.photoErr[s] || '';
  chip.onclick = () => { if (G.photoErr[s]) photo(s, true); };
}
// what's in a space, in words, for the image model
const DESCRIBE = {'s1.desk': 'Every desk has {list}.', 's1.hood': 'Around the desk cluster: {list}.', 's1.near': '{placed}.', 's2.seat': 'Seating: {placed}.', 's2.fun': '{placed}.', 's2.work': '{placed}.', 's2.next': 'In the back-right corner, behind a low glass wall: {list}.', 's3.kit': 'Inside the room: {list}.'};
function sceneText(s) {
  const L = D.diorama.layouts.find(l => l.option === pick1(LAYOUT[s])); if (!L) return '';
  const parts = [L.prompt.replace(/^Furnish this empty platform as /, '').split('. Use the whole platform')[0] + '.'];
  for (const k of Object.keys(DESCRIBE).filter(k => stopOf(k) === s)) {
    const p = G.picks[k] || []; if (!p.length) continue;
    parts.push(D.slots[k] ? DESCRIBE[k].replace('{placed}', p.map((id, j) => `${OPT[id].fragment} ${D.slots[k][j]?.loc || ''}`.trim()).join('; ')) : DESCRIBE[k].replace('{list}', list(p.map(id => OPT[id].fragment).filter(Boolean))));
  }
  if (s === 's1' && clean(G.free['s1.near'])) parts.push(`Also: ${clean(G.free['s1.near'])}.`);
  return parts.join(' ');
}
const onStop = s => $('#bc') && stopOf(D.steps[G.i]?.step || '') === s;
async function photo(s, show) {
  if (Img.isOffline() || !pick1(LAYOUT[s]) || G.photoBusy[s]) return;
  const key = picksKey(s); if (G.photo[s]?.key === key) { if (show) { G.view[s] = 'photo'; paint(s); } return; }
  G.photoBusy[s] = true; G.photoErr[s] = null; if (onStop(s)) photoUI(s);
  const snap = Builder.snapshot(s, G.picks);
  const prompt = `${D.diorama.look} Use the attached 3D model as the exact layout: keep every piece of furniture in the same place, size and colour, and keep the same camera angle and platform. Replace the simple blocks with real, detailed furniture and materials. The space: ${sceneText(s)}`;
  const textPrompt = `${D.diorama.look} On the platform: ${sceneText(s)}`;
  try { const r = await Img.run({prompt, textPrompt, refs: [snap]}); G.photo[s] = {url: r.url, key}; if (show || onStop(s)) G.view[s] = 'photo'; }
  catch (e) { G.photoErr[s] = e.message; console.warn('photo', e.message); }
  G.photoBusy[s] = false;
  if (onStop(s)) { paint(s); if (G.view[s] === 'photo') { const im = $('#photo'); im.classList.remove('wipe'); void im.offsetWidth; im.classList.add('wipe'); } }
}

// ============================================================ close: change one thing, reveal
const favStop = () => (pick1('close.favourite') || 'close.favourite.s1').split('.').pop();
function change() {
  const s = favStop(), st = STOPS.find(x => x.k === s);
  enter(`<section class="screen"><canvas class="floorbg" id="floor" aria-hidden="true"></canvas><div class="ob-bottom"><div class="card-panel ob-card wide">
    <div class="eyebrow">${esc(st.n)}</div><h2 class="dt h2">Change one thing?</h2><p class="lede">Optional. Say it your way, and we’ll add it to your photo.</p>
    <div class="sugg">${['More plants', 'More daylight', 'A quieter corner'].map(t => `<button type="button" class="chipbtn" data-t="${t}">${t}</button>`).join('')}</div>
    <input class="inp" id="chg" maxlength="80" placeholder="For example: a bigger window" value="${esc(G.change)}">
    <div class="row"><button class="gbtn navy" id="skip" type="button">SKIP</button><button class="gbtn green" id="go" type="button">MAKE MY PHOTO</button></div></div></div></section>`);
  Builder.floor($('#floor'), G.picks, {clear: true, pad: 0.86, glow: [s]});
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { $('#chg').value = b.dataset.t; });
  $('#skip').onclick = () => { G.change = ''; reveal(); }; $('#go').onclick = () => { G.change = clean($('#chg').value); reveal(); };
}
const CAP = {'s1.desk': 2, 's1.near': 3, 's2.seat': 2, 's2.fun': 2, 's2.work': 2, 's3.kit': 3};
function eyeLevel(s) {
  const frags = k => [...(G.picks[k] || [])].sort((a, b) => (OPT[b].wildcard ? 1 : 0) - (OPT[a].wildcard ? 1 : 0)).slice(0, CAP[k] || 9).map(id => OPT[id].fragment).filter(Boolean);
  const parts = [], add = (pre, a, post = '') => { if (a.length) parts.push(pre + list(a) + post + '.'); }, cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);
  if (s === 's1') { parts.push(`Scene: ${D.style.team} ${cap1(frags('s1.cluster')[0] || 'eight compact desks')}.`); add('At the desks: ', frags('s1.desk')); add('Around the team: ', frags('s1.hood')); add('Close to the team: ', frags('s1.near')); }
  else if (s === 's2') { parts.push(`Scene: ${cap1(frags('s2.cafe')[0] || 'a workcafé')}.`); add('Seating: ', frags('s2.seat')); add('For fun: ', frags('s2.fun')); add('To make it work: ', frags('s2.work')); add('Through an open doorway, ', frags('s2.next'), ' is visible'); }
  else { parts.push(`Scene: ${cap1(frags('s3.room')[0] || 'a meeting room')}.`); add('In the room: ', frags('s3.kit')); }
  if (G.change) parts.push(`Also: ${G.change}.`);
  return parts.join(' ');
}
async function reveal(again) {
  const s = favStop(), st = STOPS.find(x => x.k === s);
  if (!again) saveSession();
  enter(`<section class="screen center"><div class="final"><div class="rays"></div>
    <div class="eyebrow light">${esc(st.n)}</div><h1 class="dt h1">${esc(G.name)}’s ${esc(st.short.toLowerCase())}</h1>
    <div class="frame" id="frame"><img id="fimg" src="${G.photo[s]?.url || Builder.snapshot(s, G.picks)}" alt=""><div class="scan"></div>
      <div class="frame-chip" id="fchip">${Img.isOffline() ? '' : '<span class="spinner"></span>Making your photo…'}</div></div>
    <p class="note center-note">A concept, not a final design.</p>
    <div class="row" id="frow"><button class="gbtn green big" id="all" type="button">SEE ALL MY SPACES</button></div></div></section>`);
  $('#all').onclick = results;
  if (Img.isOffline()) { $('#frame .scan').remove(); $('#fchip').remove(); confetti(160); return; }
  const ref = G.photo[s]?.url || Builder.snapshot(s, G.picks);
  const prompt = D.final + eyeLevel(s) + ` ${D.style.shell} ${D.style.realism} ${D.style.camera.wide} ${D.style.negative}` + (again ? ` Alternative take ${Date.now() % 997}.` : '');
  const textPrompt = `Professional architectural interior photograph for a workplace design presentation, 16:9 frame. ${eyeLevel(s)} ${D.style.shell} ${D.style.realism} ${D.style.camera.wide} ${D.style.negative}` + (again ? ` Alternative take ${Date.now() % 997}.` : '');
  try {
    const r = await Img.run({prompt, textPrompt, refs: [ref]}); G.final = r.url;
    if (!$('#fimg')) return;
    $('#fimg').src = r.url; $('#fimg').classList.add('wipe'); $('#frame .scan')?.remove(); $('#fchip').remove(); confetti(180);
    $('#frow').insertAdjacentHTML('afterbegin', '<button class="gbtn navy" id="again" type="button">TRY ANOTHER LOOK</button>'); $('#again').onclick = () => reveal(true);
  } catch (e) { console.warn('reveal', e.message); if (!$('#fimg')) return; $('#frame .scan')?.remove(); $('#fchip').className = 'frame-chip soft'; $('#fchip').textContent = 'Here’s your space in 3D. The photo will come next time.'; confetti(120); }
}

// ============================================================ results
function results() {
  const chips = s => Object.keys(G.picks).filter(k => stopOf(k) === s && OPT[(G.picks[k] || [])[0]]?.fragment).flatMap(k => G.picks[k]).map(id => `<span class="${OPT[id]?.wildcard ? 'w' : ''}">${OPT[id]?.wildcard ? '★ ' : ''}${esc(label(id))}</span>`).join('');
  const ideas = [...Object.values(G.picks).flat().filter(id => OPT[id]?.wildcard).map(label), ...Object.values(G.free).map(clean).filter(Boolean), G.change].filter(Boolean);
  const imgs = STOPS.map(x => ({k: x.k, n: x.n, url: G.photo[x.k]?.url || Builder.snapshot(x.k, G.picks)}));
  enter(`<section class="screen results"><div class="rinner">
    <div class="rhead"><div><div class="eyebrow light">Master of your universe</div><h1 class="dt h1">You built it, ${esc(G.name)}</h1><p class="lede">${Object.values(G.picks).flat().length} choices · ${ideas.length} new idea${ideas.length === 1 ? '' : 's'}</p></div>
      <div class="row"><button class="gbtn blue" id="save" type="button">SAVE MY IMAGES</button><button class="gbtn green" id="again" type="button">PLAY AGAIN</button></div></div>
    ${G.final ? `<div class="frame"><img src="${G.final}" alt="Photo of your favourite space"></div>` : ''}
    <div class="rgrid">${imgs.map(x => `<div class="rcard"><img src="${x.url}" alt="${esc(x.n)}"><div class="rc"><h3>${esc(x.n)}${favStop() === x.k ? ' ★' : ''}</h3><div class="chips">${chips(x.k)}</div></div></div>`).join('')}</div>
    ${ideas.length ? `<div class="card-panel ideas"><h3>Your new ideas</h3><div class="chips">${ideas.map(t => `<span class="w">★ ${esc(t)}</span>`).join('')}</div></div>` : ''}
  </div></section>`);
  $('#again').onclick = title;
  $('#save').onclick = () => { [...(G.final ? [{url: G.final, n: 'my-photo'}] : []), ...imgs.map(x => ({url: x.url, n: 'my-' + x.k}))].forEach((x, i) => setTimeout(() => { const a = document.createElement('a'); a.href = x.url; a.download = x.n + (x.url.startsWith('data:image/jpeg') ? '.jpg' : '.png'); a.click(); }, i * 300)); };
  confetti(80);
}
function saveSession() {
  const rec = {at: new Date().toISOString(), name: G.name, role: G.role, picks: G.picks, free: G.free, times: G.times, change: G.change, favourite: favStop(), seconds: Math.round((Date.now() - G.started) / 1000), provider: Img.settings.provider};
  try { const all = JSON.parse(localStorage.getItem('moyu-sessions') || '[]'); all.push(rec); localStorage.setItem('moyu-sessions', JSON.stringify(all)); } catch (e) {}
  Img.hasServer().then(ok => ok && fetch('api/session', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(rec)}).catch(() => {}));
}

// ============================================================ facilitator mode
async function sessions() {
  let all = []; try { all = JSON.parse(localStorage.getItem('moyu-sessions') || '[]'); } catch (e) {}
  if (await Img.hasServer()) { try { const r = await fetch('api/sessions'); if (r.ok) { const srv = await r.json(); const seen = new Set(all.map(x => x.at)); srv.forEach(x => { if (!seen.has(x.at)) all.push(x); }); } } catch (e) {} }
  return all;
}
function facilitator(tab = 'photos') {
  const S = structuredClone(Img.settings), m = $('#modal');
  const field = (id, lab, val, type = 'text', ph = '', listId = '') => `<div class="field"><label for="${id}">${lab}</label><input class="inp" id="${id}" type="${type}" value="${esc(val)}" placeholder="${esc(ph)}" autocomplete="off" ${listId ? `list="${listId}"` : ''}></div>`;
  function provFields() {
    const p = S.provider, adv = k => `<details class="adv"><summary>Advanced</summary>${field('b', 'Endpoint', S.base[k], 'text')}</details>`;
    if (p === 'gemini') return `<div class="grid2">${field('k', 'Gemini API key', S.keys.gemini, 'password', 'From Google AI Studio')}${field('m', 'Model', S.models.gemini, 'text', 'gemini-3.1-flash-image')}</div>${adv('gemini')}<p class="note">Best for the client demo: it turns the 3D build into a photo and keeps the layout.</p>`;
    if (p === 'openai') return `<div class="grid2">${field('k', 'OpenAI API key', S.keys.openai, 'password', 'sk-…')}${field('m', 'Model', S.models.openai, 'text', 'gpt-image-1')}</div>${adv('openai')}`;
    if (p === 'fal') return `<div class="grid2">${field('k', 'fal.ai key', S.keys.fal, 'password')}${field('m', 'Model for new images', S.models.falGen, 'text', 'fal-ai/qwen-image')}${field('m2', 'Model for edits', S.models.falEdit, 'text', 'fal-ai/qwen-image-edit')}</div>${adv('fal')}`;
    if (p === 'unsloth' || p === 'custom') return `<div class="grid2">${field('b', 'Server address', S.base[p], 'text', p === 'unsloth' ? 'http://127.0.0.1:8888/v1' : 'https://…/v1')}${field('k', 'API key', S.keys[p], 'password', p === 'unsloth' ? 'sk-unsloth-…' : '')}${field('m', 'Image model', S.models[p], 'text', 'Press Test to list models', 'mlist')}</div>
      <datalist id="mlist">${Img.providerModels(p).map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      <p class="note">${p === 'unsloth' ? 'Start Unsloth Studio first, then open this game with “Start Game” so the browser can reach it. Test checks the server, lists models and reads which image options it supports.' : 'Any server with /images/generations (and /images/edits for best results), such as OpenArt or Together gateways.'}</p>`;
    return '<p class="note">No photos. Players see the 3D build, which works anywhere.</p>';
  }
  function read() {
    const v = id => $('#' + id)?.value.trim(), p = S.provider;
    if ($('#route')) S.route = $('#route').value; if ($('#qual')) S.quality = $('#qual').value;
    if (p === 'offline') return;
    if (v('k') !== undefined) S.keys[p] = v('k');
    if (p === 'fal') { S.models.falGen = v('m') || 'fal-ai/qwen-image'; S.models.falEdit = v('m2') || 'fal-ai/qwen-image-edit'; } else if (v('m') !== undefined) S.models[p] = v('m');
    if (v('b')) S.base[p] = v('b');
  }
  const say = (t, c) => { const el = $('#st'); if (!el) return; el.hidden = false; el.className = 'status ' + (c || ''); el.textContent = t; };
  function draw() {
    const body = tab === 'photos' ? `
      <div class="sec"><h3>Photo model</h3><div class="provs seg">${Object.entries(Img.NAMES).map(([k, n]) => `<button type="button" data-p="${k}" aria-pressed="${S.provider === k}">${n}</button>`).join('')}</div>
        <div style="margin-top:12px">${provFields()}</div>
        <div class="grid2" style="margin-top:10px"><div class="field"><label for="route">Send requests</label><select class="inp" id="route"><option value="auto">Automatic</option><option value="direct">From the browser</option><option value="proxy">Through the game server</option></select></div>
          <div class="field"><label for="qual">Quality</label><select class="inp" id="qual"><option value="high">High</option><option value="fast">Fast</option></select></div></div>
        <div class="row left" style="margin-top:12px"><button class="gbtn green sm" id="test" type="button">TEST CONNECTION</button><button class="gbtn blue sm" id="tryp" type="button">TRY A PHOTO</button><button class="gbtn sm" id="save" type="button">SAVE</button></div>
        <div class="status" id="st" hidden></div><div id="tryimg"></div></div>` : tab === 'insights' ? `<div class="sec" id="ins"><p class="note">Loading…</p></div>` : `
      <div class="sec"><h3>Game</h3><label class="sw"><input type="checkbox" id="coins" ${S.coins ? 'checked' : ''}> Space coins: a budget per space, never a score</label>
        <label class="sw"><input type="checkbox" id="kiosk" ${S.kiosk ? 'checked' : ''}> Kiosk: return to the title after 90 seconds with no taps</label>
        <div class="row left" style="margin-top:12px"><button class="gbtn sm" id="save2" type="button">SAVE</button><button class="gbtn navy sm" id="clr" type="button">CLEAR PHOTO CACHE</button></div><div class="status" id="st" hidden></div></div>`;
    m.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="Facilitator"><div class="card-panel sheet enter">
      <div class="sheet-head"><h2 class="dt h2">Facilitator</h2><div class="tabs seg">${[['photos', 'Photos'], ['insights', 'Insights'], ['game', 'Game']].map(([k, n]) => `<button type="button" data-tab="${k}" aria-pressed="${tab === k}">${n}</button>`).join('')}</div>
        <button class="gbtn blue round" id="x" type="button" aria-label="Close">✕</button></div>${body}</div></div>`;
    m.hidden = false;
    m.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { if (tab === 'photos') { read(); Img.save(S); } tab = b.dataset.tab; draw(); });
    $('#x').onclick = () => { if (tab === 'photos') { read(); Img.save(S); } m.hidden = true; m.innerHTML = ''; if (G.i >= 0 && D.steps[G.i]) step(); };
    if (tab === 'photos') {
      $('#route').value = S.route; $('#qual').value = S.quality;
      m.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { read(); S.provider = b.dataset.p; draw(); });
      $('#save').onclick = () => { read(); Img.save(S); say('Saved.', 'ok'); };
      $('#test').onclick = async () => { read(); Img.save(S); say('Testing…'); try { say(await Img.test(), 'ok'); const dl = $('#mlist'); if (dl) dl.innerHTML = Img.providerModels(S.provider).map(x => `<option value="${esc(x)}">`).join(''); } catch (e) { say(e.message, 'bad'); } };
      $('#tryp').onclick = async () => { read(); Img.save(S); if (Img.isOffline()) return say('Pick a photo model first.', 'bad'); say('Making a test photo… this can take up to a minute.');
        try { const r = await Img.run({prompt: D.diorama.master.prompt + ` Test ${Date.now() % 1000}.`, refs: []}); say('It works. This is what the model made:', 'ok'); $('#tryimg').innerHTML = `<img class="tryimg" src="${r.url}" alt="Test photo">`; } catch (e) { say(e.message, 'bad'); } };
    } else if (tab === 'insights') insights();
    else { $('#save2').onclick = () => { S.coins = $('#coins').checked; S.kiosk = $('#kiosk').checked; Img.save(S); say('Saved.', 'ok'); idle(); }; $('#clr').onclick = async () => { await Img.cacheClear(); say('Photo cache cleared.', 'ok'); }; }
  }
  async function insights() {
    const all = await sessions(), role = insights.role || 'all', rows = all.filter(r => role === 'all' || r.role === role), box = $('#ins'); if (!box) return;
    if (!all.length) { box.innerHTML = '<p class="note">No sessions yet. Every finished game appears here.</p>'; return; }
    const blocks = D.steps.map(st => {
      const counts = {}; rows.forEach(r => (r.picks?.[st.step] || []).forEach(id => counts[id] = (counts[id] || 0) + 1));
      const items = Object.entries(counts).sort((a, b) => b[1] - a[1]); if (!items.length) return '';
      return `<div class="ib"><h4>${esc(D.copy[st.step]?.title || st.title)}</h4>${items.map(([id, n]) => `<div class="brow"><span>${OPT[id]?.wildcard ? '★ ' : ''}${esc(label(id))}</span><i style="--w:${n / items[0][1] * 100}%"></i><b>${n}</b></div>`).join('')}</div>`;
    }).join('');
    const ideas = rows.flatMap(r => [...Object.values(r.free || {}), r.change].map(clean).filter(Boolean));
    box.innerHTML = `<div class="row left"><div class="seg c4" id="rolef">${[['all', 'Everyone'], ['field', 'Field'], ['sales', 'Sales'], ['office', 'Office']].map(([k, n]) => `<button type="button" data-r="${k}" aria-pressed="${role === k}">${n}</button>`).join('')}</div>
      <span class="note">${rows.length} of ${all.length} sessions</span><button class="gbtn blue sm" id="csv" type="button">EXPORT CSV</button></div>
      ${ideas.length ? `<div class="ib"><h4>Ideas in their own words</h4><div class="chips">${ideas.map(t => `<span class="w">${esc(t)}</span>`).join('')}</div></div>` : ''}<div class="igrid">${blocks}</div>`;
    box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { insights.role = b.dataset.r; insights(); });
    $('#csv').onclick = () => exportCsv(all);
  }
  draw();
}
function exportCsv(all) {
  const rows = [['time', 'name', 'role', 'question', 'answers', 'own_idea', 'seconds', 'favourite', 'change_one_thing']];
  all.forEach(r => Object.entries(r.picks || {}).forEach(([k, v]) => rows.push([r.at, r.name, r.role, D.copy[k]?.title || k, v.map(label).join(' | '), r.free?.[k] || '', r.times?.[k] || '', r.favourite, r.change || ''])));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'})); a.download = 'master-of-your-universe-sessions.csv'; a.click();
}

// ============================================================ kiosk idle reset
let idleT; function idle() { clearTimeout(idleT); if (Img.settings.kiosk && G.i !== -1) idleT = setTimeout(title, 90000); }
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, idle));
addEventListener('resize', () => { const st = D.steps[G.i]; if (st && $('#bc')) paint(stopOf(st.step) === 'close' ? 'close' : stopOf(st.step)); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) { $('#modal').hidden = true; $('#modal').innerHTML = ''; } });
title();
})();
