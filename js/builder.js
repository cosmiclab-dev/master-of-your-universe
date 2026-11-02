// Master of Your Universe: live 3D builder. One fixed camera per stop; every pick appears in its own spot.
(() => {
let BORN = {}, PICKS = {};
// ============================================================ iso engine
const P = {oak:'#cfae84', oakD:'#a98660', white:'#ecebe6', sage:'#9cb29a', navy:'#425a7c', felt:'#aaa69e', char:'#4a4f56', steel:'#9aa1a8',
  glass:'rgba(196,222,236,0.30)', screen:'#22272e', green:'#6c9363', green2:'#86aa78', pot:'#e6e2da', gold:'#c9a24a', cork:'#b88f63',
  carpet:'#c3bcb1', red:'#b5583f', blue:'#55779f', deck:'#9b7a58', felt2:'#6f7a8a', pink:'#cfa0a8'};
let OUT = [], TAG = 'base', FLAGS = {};
function B(x, y, z, w, d, h, c, o = {}) {
  const flat = h <= 0.05 && z <= 0.06;
  if (!flat && !o.layer && (w > 1.2 || d > 1.2)) {           // slice long boxes so painter's sort stays right
    const nx = Math.ceil(w / 1), ny = Math.ceil(d / 1);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++)
      OUT.push({x: x + i * w / nx, y: y + j * d / ny, z, w: w / nx, d: d / ny, h, c, tag: TAG, ...o});
    return;
  }
  OUT.push({x, y, z, w, d, h, c, tag: TAG, flat, ...o});
}
const flat = (x, y, w, d, c, z = 0.012) => B(x, y, z, w, d, 0.02, c);
function withTag(t, f) { const old = TAG; TAG = t; f(); TAG = old; }

function shade(c, f) {
  if (c.startsWith('rgba')) return c;
  const n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const m = v => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function projector(cam, W, H) { return (x, y, z) => [((x - y) * 0.866 - cam.x) * cam.s + W / 2, ((x + y) * 0.5 - z - cam.y) * cam.s + H / 2]; }
function poly(ctx, pts, fill) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
const easeBack = t => { const c = 1.7; t = Math.min(1, Math.max(0, t)); return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// ============================================================ furniture kit
function table(x, y, w, d, top = 0.72, c = P.oak) { B(x + w / 2 - 0.06, y + d / 2 - 0.06, 0, 0.12, 0.12, top, P.char); B(x, y, top, w, d, 0.06, c); }
function stool(x, y, h = 0.75, c = P.char) { B(x, y, 0, 0.34, 0.34, h, c); }
function chair(x, y, back, c = P.char) {      // back: side of the backrest
  B(x, y, 0, 0.46, 0.46, 0.44, c);
  if (back === 'n') B(x, y, 0.44, 0.46, 0.08, 0.45, c); if (back === 's') B(x, y + 0.38, 0.44, 0.46, 0.08, 0.45, c);
  if (back === 'w') B(x, y, 0.44, 0.08, 0.46, 0.45, c); if (back === 'e') B(x + 0.38, y, 0.44, 0.08, 0.46, 0.45, c);
}
function plant(x, y, s = 1) { B(x, y, 0, 0.42 * s, 0.42 * s, 0.4 * s, P.pot); B(x - 0.06 * s, y - 0.06 * s, 0.4 * s, 0.54 * s, 0.54 * s, 0.55 * s, P.green); B(x + 0.06 * s, y + 0.06 * s, 0.95 * s, 0.3 * s, 0.3 * s, 0.25 * s, P.green2); }
function sofa(x, y, w, d, back, c = P.navy) {
  B(x, y, 0, w, d, 0.42, c);
  const t = 0.2, hb = 0.42;
  if (back === 'n') B(x, y, hb, w, t, 0.4, c); if (back === 's') B(x, y + d - t, hb, w, t, 0.4, c);
  if (back === 'w') B(x, y, hb, t, d, 0.4, c); if (back === 'e') B(x + w - t, y, hb, t, d, 0.4, c);
}
function screenOn(x, y, z, w, d, h, glow) { B(x, y, z, w, d, h, glow ? '#3d7bd6' : P.screen, glow ? {glow: 1} : {}); }
function room(x0, y0, x1, y1, h = 2.5, o = {}) {
  flat(x0, y0, x1 - x0, y1 - y0, o.floor || P.carpet, 0.02);
  B(x0, y0, 0, x1 - x0, 0.08, h, o.back || P.white);
  B(x0, y0, 0, 0.08, y1 - y0, h, o.side || P.white);
  B(x0, y1 - 0.06, 0, x1 - x0, 0.06, h, P.glass);
  B(x1 - 0.06, y0, 0, 0.06, y1 - y0, h, P.glass);
}
// desk in local coords: u along the desk, v from desk back toward the chair; dir = way the person faces
function desk(ox, oy, dir, i = 0, extra = {}) {
  const L = (u, v, z, lw, ld, h, c, o) => {
    let X, Y, W, Dd;
    if (dir === 'n') { X = ox + u; Y = oy + v; W = lw; Dd = ld; }
    else if (dir === 's') { X = ox + 1.4 - u - lw; Y = oy + 1.6 - v - ld; W = lw; Dd = ld; }
    else if (dir === 'w') { X = ox + v; Y = oy + 1.4 - u - lw; W = ld; Dd = lw; }
    else { X = ox + 1.6 - v - ld; Y = oy + u; W = ld; Dd = lw; }
    B(X, Y, z, W, Dd, h, c, o);
  };
  const F = FLAGS, raised = (F.heightadj && i % 2) || (F.smartdesk && i % 3 === 0) || extra.raised;
  const top = raised ? 1.02 : 0.72;
  if (extra.castors) [[0.05, 0.05], [1.25, 0.05], [0.05, 0.55], [1.25, 0.55]].forEach(([u, v]) => L(u, v, 0, 0.1, 0.1, 0.08, '#151515'));
  L(0.06, 0.06, 0, 0.07, 0.58, top, P.white); L(1.27, 0.06, 0, 0.07, 0.58, top, P.white);
  L(0, 0, top, 1.4, 0.7, 0.05, P.oak);
  withTag('s1.desk.monitor', () => F.monitor ? (L(0.22, 0.08, top + 0.05, 0.44, 0.05, 0.32, P.screen), L(0.74, 0.08, top + 0.05, 0.44, 0.05, 0.32, P.screen)) : 0);
  if (!F.monitor) L(0.45, 0.08, top + 0.05, 0.5, 0.05, 0.32, P.screen);
  withTag('s1.desk.accshelf', () => F.accshelf && (L(0.04, 0.0, top + 0.37, 1.32, 0.12, 0.03, P.oakD), L(1.12, 0.0, top + 0.4, 0.12, 0.1, 0.16, P.green)));
  withTag('s1.desk.shelving', () => F.shelving && i % 2 === 0 && L(1.42, 0.08, 0, 0.32, 0.5, 1.1, P.oakD));
  withTag('s1.desk.whiteboard', () => F.whiteboard && L(0.02, 0.1, top + 0.05, 0.04, 0.45, 0.42, '#ffffff'));
  withTag('s1.desk.baghook', () => F.baghook && L(0.25, 0.64, top - 0.42, 0.3, 0.12, 0.36, P.red));
  withTag('s1.desk.nameplate', () => F.nameplate && L(0.55, 0.6, top + 0.05, 0.3, 0.05, 0.07, '#ffffff'));
  withTag('s1.desk.smartdesk', () => F.smartdesk && L(0.1, 0.66, top + 0.02, 1.2, 0.03, 0.03, '#7fe9ff', {glow: 1}));
  if (extra.screen) extra.screen(L, top);
  L(0.47, 0.92, 0, 0.46, 0.46, 0.44, P.char); L(0.47, 1.34, 0.44, 0.46, 0.08, 0.46, P.char);
}

// ============================================================ zones + slots
const Z = {s1: [0, 0, 13.3, 14], s2: [13.3, 0, 23.3, 14], s3: [23.3, 0, 30, 14], all: [0, 0, 30, 14]};
const NEAR = [{x: 0.35, y: 4.2, w: 0.9, d: 4.8}, {x: 11.95, y: 4.2, w: 0.9, d: 4.8}, {x: 3.6, y: 3.6, w: 5.6, d: 0.95}, {x: 3.6, y: 9.4, w: 5.6, d: 0.95}];
const SEAT = [{x: 14, y: 10.6, w: 2.8, d: 2.8}, {x: 17, y: 10.6, w: 2.8, d: 2.8}, {x: 20.2, y: 10.4, w: 2.8, d: 3.0}];
const FUN = [{x: 20.2, y: 6.2, w: 2.8, d: 2.8}, {x: 14, y: 7.9, w: 2.8, d: 2.3}, {x: 17, y: 7.9, w: 2.8, d: 2.3}];
const WORK = [{x: 20.2, y: 5.0, w: 2.8, d: 0.7}, {x: 14, y: 6.9, w: 2.8, d: 0.7}, {x: 17, y: 6.9, w: 2.8, d: 0.7}];
const ROOMS = {'s3.room.booth': [25.6, 5.2, 26.9, 6.5], 's3.room.four': [24.6, 3.9, 27.9, 7.2], 's3.room.mid': [24.2, 3.3, 28.9, 7.7],
  's3.room.twelve': [23.9, 2.6, 29.5, 8.7], 's3.room.huddle': [24.7, 4, 28, 7.2], 's3.room.flexi': [24, 3, 29.3, 8.2]};
// strip helpers: place along the long side of a slot
const along = r => r.w >= r.d;
function seg(r, a, b, th, z, h, c, off = 0, o) { along(r) ? B(r.x + a * r.w, r.y + off, z, (b - a) * r.w, th, h, c, o) : B(r.x + off, r.y + a * r.d, z, th, (b - a) * r.d, h, c, o); }
function at(r, t, off = 0) { return along(r) ? [r.x + t * r.w, r.y + off] : [r.x + off, r.y + t * r.d]; }

// ============================================================ recipes (one per option)
const R = {};
// ---- desk clusters
const rows = (screen, raisedAlt) => { for (let i = 0; i < 4; i++) { desk(3.7 + i * 1.45, 4.9, 's', i, {screen}); desk(3.7 + i * 1.45, 6.5, 'n', i + 1, {screen}); } };
R['s1.cluster.cocoon'] = () => rows((L) => { L(0, -0.07, 0, 1.4, 0.07, 1.4, P.sage); L(1.38, -0.07, 0, 0.07, 0.95, 1.4, P.sage); });
R['s1.cluster.screened'] = () => rows((L, top) => L(0, -0.03, top + 0.05, 1.4, 0.04, 0.42, P.glass));
R['s1.cluster.focuspod'] = () => { for (let i = 0; i < 6; i++) desk(2.6 + i * 1.55, 5.6, 'n', i, {screen: (L) => { L(0, -0.07, 0, 1.4, 0.07, 1.5, P.navy); L(-0.07, -0.07, 0, 0.07, 1.0, 1.5, P.felt2); L(1.4, -0.07, 0, 0.07, 1.0, 1.5, P.felt2); }}); };
R['s1.cluster.farm'] = () => {
  B(3.6, 6.2, 0, 0.12, 1.0, 0.72, P.char); B(9.2, 6.2, 0, 0.12, 1.0, 0.72, P.char);
  B(3.4, 6.15, 0.72, 6.1, 1.1, 0.09, P.oak); B(6.3, 6.6, 0.81, 0.4, 0.2, 0.04, P.char);
  for (let i = 0; i < 4; i++) { chair(3.9 + i * 1.45, 5.45, 'n'); chair(3.9 + i * 1.45, 7.4, 's'); B(4.0 + i * 1.45, 6.25, 0.81, 0.4, 0.05, 0.3, P.screen); B(4.0 + i * 1.45, 6.95, 0.81, 0.4, 0.05, 0.3, P.screen); }
  B(4, 6.6, 2.4, 5, 0.12, 0.08, P.char);
};
R['s1.cluster.pinwheel'] = () => {
  B(5.75, 5.9, 0, 1.4, 1.4, 0.95, P.oak); plant(6.2, 6.35, 1.1);
  [[5.0, 4.1, 'n'], [6.5, 4.1, 'n'], [5.0, 7.45, 's'], [6.5, 7.45, 's']].forEach(([x, y, d], i) => desk(x, y, d, i));
  [[3.4, 4.85, 'w'], [3.4, 6.35, 'w'], [8.15, 4.85, 'e'], [8.15, 6.35, 'e']].forEach(([x, y, d], i) => desk(x, y, d, i + 4));
};
R['s1.cluster.moveit'] = () => {
  [4.3, 5.75, 7.2].forEach((x, i) => desk(x, 7.1, 'n', i, {castors: 1}));
  desk(2.5, 4.6, 'e', 3, {castors: 1}); desk(2.5, 6.0, 'e', 4, {castors: 1});
  desk(8.7, 4.6, 'w', 5, {castors: 1}); desk(8.7, 6.0, 'w', 6, {castors: 1});
  B(5.0, 4.5, 0.5, 2.6, 0.06, 1.2, '#ffffff'); B(5.1, 4.5, 0, 0.06, 0.06, 0.5, P.steel); B(7.4, 4.5, 0, 0.06, 0.06, 0.5, P.steel);
};
// ---- desk add-ons (icons only; in the world they decorate every desk)
['monitor', 'accshelf', 'shelving', 'heightadj', 'whiteboard', 'baghook', 'nameplate', 'smartdesk'].forEach(k => R['s1.desk.' + k] = () => desk(0, 0, 'n', 1));
// ---- neighbourhoods
const booth = (x, y) => { sofa(x, y, 2.0, 0.6, 'n', P.sage); table(x + 0.3, y + 0.75, 1.4, 0.6); sofa(x, y + 1.5, 2.0, 0.6, 's', P.sage); };
const quietDesks = () => { for (let i = 0; i < 3; i++) desk(4.2 + i * 1.6, 0.6, 'n', i + 7, {screen: (L) => L(-0.07, -0.05, 0, 0.07, 0.8, 1.3, P.felt2)}); };
R['s1.hood.rooms'] = () => {
  room(0.5, 0.5, 3.5, 3.3); table(1.4, 1.4, 1.2, 0.8); chair(1.5, 0.85, 'n'); chair(2.1, 0.85, 'n'); chair(1.5, 2.3, 's'); chair(2.1, 2.3, 's');
  room(9.6, 0.5, 12.8, 3.3); table(10.6, 1.4, 1.2, 0.8); chair(10.7, 0.85, 'n'); chair(11.3, 0.85, 'n'); chair(10.7, 2.3, 's'); chair(11.3, 2.3, 's');
  sofa(9.6, 11.0, 2.8, 0.6, 'n', P.navy); sofa(9.6, 11.6, 0.6, 1.6, 'w', P.navy); table(10.6, 11.9, 1.0, 0.8);
};
R['s1.hood.mix'] = () => { quietDesks(); booth(0.6, 10.9); table(9.8, 1.0, 2.6, 1.3); [10, 10.8, 11.6].forEach(x => { chair(x, 0.45, 'n'); chair(x, 2.4, 's'); });
  table(10.4, 11.4, 0.9, 0.9, 1.05); [[10, 11], [11.4, 11], [10, 12.4], [11.4, 12.4]].forEach(([x, y]) => stool(x, y)); };
R['s1.hood.break'] = () => { quietDesks(); booth(0.6, 10.9); table(9.8, 1.0, 2.6, 1.3); [10, 10.8, 11.6].forEach(x => { chair(x, 0.45, 'n'); chair(x, 2.4, 's'); });
  B(9.6, 10.9, 0, 2.6, 0.6, 1.0, P.white); B(9.6, 10.9, 1.0, 2.6, 0.6, 0.05, P.oak); B(10, 10.95, 1.05, 0.3, 0.3, 0.12, P.gold); B(10.5, 10.95, 1.05, 0.25, 0.25, 0.2, P.red);
  sofa(9.8, 12.3, 1.8, 0.7, 's', P.sage); plant(12.2, 11.9, 1.2); plant(12.3, 10.9); };
R['s1.hood.homebase'] = () => { flat(2.4, 3.3, 9.4, 7.0, '#d9a774', 0.016);
  B(2.6, 3.5, 3.0, 9.0, 6.6, 0.08, P.oak, {a: 0.22});
  for (let i = 0; i < 6; i++) B(1.0 + i * 0.55, 0.5, 0, 0.5, 0.55, 1.9, i % 2 ? P.oak : P.oakD);
  screenOn(5.0, 0.5, 0.9, 2.2, 0.08, 1.2, true); B(7.8, 0.5, 0, 4.4, 0.08, 2.2, '#ffffff'); };
// ---- close to the team (slot items)
R['s1.near.lockers'] = r => { for (let i = 0; i < 6; i++) seg(r, i / 6 + 0.004, (i + 1) / 6 - 0.004, 0.6, 0, 1.9, i % 2 ? P.oak : P.oakD); };
R['s1.near.writingwall'] = r => { seg(r, 0.02, 0.98, 0.08, 0, 2.2, '#ffffff'); seg(r, 0.2, 0.5, 0.02, 1.3, 0.03, P.blue, 0.08); seg(r, 0.3, 0.7, 0.02, 1.6, 0.03, P.red, 0.08); };
R['s1.near.mobilewb'] = r => { [[0.08, 0.45], [0.55, 0.92]].forEach(([a, b]) => { seg(r, a, b, 0.06, 0.5, 1.1, '#ffffff', 0.3); seg(r, a, a + 0.03, 0.08, 0, 0.5, P.steel, 0.3); seg(r, b - 0.03, b, 0.08, 0, 0.5, P.steel, 0.3); }); };
R['s1.near.awards'] = r => { seg(r, 0.1, 0.9, 0.35, 0, 0.95, P.oak); [0.18, 0.38, 0.58, 0.76].forEach(t => seg(r, t, t + 0.05, 0.15, 0.95, 0.28, P.gold, 0.1, {glow: 1})); };
R['s1.near.pinboard'] = r => { seg(r, 0.12, 0.88, 0.06, 0.6, 1.2, P.cork); [[0.2, P.white], [0.4, P.pink], [0.6, P.gold], [0.75, P.white]].forEach(([t, c]) => seg(r, t, t + 0.08, 0.02, 1.1 + (t * 10 % 3) * 0.15, 0.22, c, 0.06)); };
R['s1.near.plants'] = r => { [0.15, 0.45, 0.75].forEach(t => plant(...at(r, t, 0.15), 1.25)); };
R['s1.near.phonebooth'] = r => { const [x, y] = at(r, 0.35); B(x, y, 0, 1.0, 1.0, 2.2, P.sage); along(r) ? B(x, y + 0.98, 0.1, 1.0, 0.04, 1.9, P.glass) : B(x + 0.98, y, 0.1, 0.04, 1.0, 1.9, P.glass); };
R['s1.near.huddlescreen'] = r => { screenOn(...(along(r) ? [r.x + 0.1 * r.w, r.y] : [r.x, r.y + 0.1 * r.d]), 0.75, along(r) ? 0.36 * r.w : 0.08, along(r) ? 0.08 : 0.36 * r.d, 0.95, true); seg(r, 0.26, 0.29, 0.08, 0, 0.75, P.steel); seg(r, 0.55, 0.92, 0.75, 0, 1.05, P.oak); };
R['s1.near.kitstorage'] = r => { [0, 0.33, 0.66].forEach(t => { seg(r, t + 0.02, t + 0.31, 0.6, 0, 2.0, P.steel); seg(r, t + 0.07, t + 0.2, 0.4, 2.0, 0.25, P.red, 0.05); }); };
R['s1.near.purifier'] = r => { seg(r, 0.44, 0.52, 0.38, 0, 1.1, '#ffffff', 0.2); seg(r, 0.44, 0.52, 0.38, 1.1, 0.04, P.steel, 0.2); };
R['s1.near.repairbar'] = r => { seg(r, 0.02, 0.98, 0.7, 0, 1.0, P.oak); seg(r, 0.08, 0.92, 0.5, 1.0, 0.02, '#4f6b5c', 0.12); seg(r, 0.06, 0.94, 0.05, 1.0, 0.9, '#d8cfbd'); [0.15, 0.35, 0.55, 0.75].forEach(t => seg(r, t, t + 0.04, 0.03, 1.3 + t * 0.4, 0.25, P.red, 0.05)); seg(r, 0.7, 0.8, 0.2, 1.02, 0.4, P.char, 0.2); };
// ---- workcafé types (core area x14..19.8, y0.4..6.6)
R['s2.cafe.workcafe'] = () => { B(14, 0.5, 0, 3, 0.7, 1.0, P.white); B(14, 0.5, 1.0, 3, 0.7, 0.05, P.oak); B(14.3, 0.6, 1.05, 0.5, 0.4, 0.45, P.char);
  [2.7, 4.7].forEach(y => { B(14.4, y, 0.72, 5, 0.8, 0.06, P.oak); B(14.6, y + 0.3, 0, 0.1, 0.2, 0.72, P.char); B(19.1, y + 0.3, 0, 0.1, 0.2, 0.72, P.char); for (let i = 0; i < 5; i++) { stool(14.6 + i * 0.95, y - 0.5); stool(14.6 + i * 0.95, y + 0.95); } }); };
R['s2.cafe.clubhouse'] = () => { screenOn(15.4, 0.45, 0.9, 3.0, 0.08, 1.4, true); sofa(15.0, 3.4, 3.6, 0.8, 's', P.navy); sofa(14.1, 1.6, 0.8, 1.8, 'w', P.navy); sofa(18.7, 1.6, 0.8, 1.8, 'e', P.navy); table(16.1, 2.1, 1.4, 0.8, 0.4);
  B(15.5, 4.9, 0, 2.6, 1.4, 0.78, '#6a4a33'); B(15.6, 5.0, 0.78, 2.4, 1.2, 0.03, '#2f7d4f'); };
R['s2.cafe.allday'] = () => { B(14, 0.5, 0, 5.6, 0.75, 1.0, P.white); [[14.3, P.gold], [15.1, P.red], [15.9, P.green2], [16.7, '#ffffff'], [17.5, P.gold], [18.3, P.pink]].forEach(([x, c]) => B(x, 0.6, 1.0, 0.5, 0.45, 0.12, c));
  [14.6, 16.6, 18.6].forEach(x => [2.6, 4.8].forEach(y => { table(x, y, 0.9, 0.9); chair(x - 0.55, y + 0.2, 'w'); chair(x + 1.0, y + 0.2, 'e'); })); };
R['s2.cafe.pitstop'] = () => { for (let i = 0; i < 3; i++) { B(14 + i * 0.8, 0.5, 0, 0.75, 0.7, 2.0, '#cfe6f2'); B(14.05 + i * 0.8, 1.19, 0.1, 0.65, 0.03, 1.8, '#9fd7ff', {glow: 1}); }
  for (let i = 0; i < 5; i++) B(16.6 + i * 0.6, 0.5, 0, 0.56, 0.6, 1.8, P.navy); for (let i = 0; i < 5; i++) B(16.75 + i * 0.6, 1.08, 1.2, 0.2, 0.03, 0.1, '#7dffa8', {glow: 1});
  B(14.4, 3.2, 0, 5.2, 0.5, 1.05, P.oak); for (let i = 0; i < 6; i++) stool(14.6 + i * 0.85, 3.9, 0.7); B(14.1, 5.4, 0, 1.2, 0.4, 1.6, P.char); };
// ---- room next door (x20.2..23, y0.4..4.6)
const NX = [20.2, 0.4, 23, 4.6];
R['s2.next.wellness'] = () => { room(...NX, 2.5, {floor: '#cfc6d8', side: P.sage}); sofa(21.0, 1.4, 0.8, 1.6, 'w', P.sage); B(22.2, 1.3, 0, 0.4, 0.4, 0.5, P.oak); B(22.3, 1.4, 0.5, 0.2, 0.2, 0.5, P.gold, {glow: 1}); };
R['s2.next.massage'] = () => { room(...NX, 2.5, {floor: '#d8cbbb'}); [21.0, 22.0].forEach(x => { B(x, 1.6, 0, 0.75, 1.3, 0.55, '#4b4f57'); B(x, 1.6, 0.55, 0.75, 0.3, 0.75, '#4b4f57'); }); plant(22.4, 3.6); };
R['s2.next.showers'] = () => { room(...NX, 2.5, {floor: '#c7d3d8'}); [20.6, 21.6].forEach(x => B(x, 0.6, 0, 0.9, 0.9, 2.1, P.glass)); B(20.6, 3.0, 0, 2.0, 0.4, 0.45, P.oak); for (let i = 0; i < 3; i++) B(22.4, 0.7 + i * 0.6, 0, 0.5, 0.55, 1.8, i % 2 ? P.oak : P.oakD); };
R['s2.next.fitness'] = () => { room(...NX, 2.5, {floor: '#3a3f45'}); [0.8, 2.2].forEach(y => { B(20.8, y, 0, 1.5, 0.7, 0.25, P.char); B(20.8, y, 0.25, 0.1, 0.7, 1.0, P.steel); }); B(22.4, 1.0, 0, 0.4, 2.2, 0.9, P.steel); [1.2, 1.7, 2.2, 2.7].forEach(y => B(22.45, y, 0.9, 0.3, 0.2, 0.15, P.char)); };
R['s2.next.mothers'] = () => { room(...NX, 2.5, {floor: '#e2cfc6', side: P.pink}); sofa(20.9, 1.5, 0.9, 0.9, 'w', P.pink); B(22.2, 0.6, 0, 0.6, 0.55, 0.9, P.white); B(22.2, 0.6, 0.9, 0.6, 0.55, 0.04, P.oak); B(22.2, 1.4, 0, 0.6, 0.55, 0.85, '#e9eef2'); };
R['s2.next.plantroom'] = () => { room(...NX, 2.5, {floor: '#bfd6b4', back: 'rgba(170,230,190,0.3)', side: 'rgba(170,230,190,0.3)'}); [[20.5, 0.7], [21.3, 0.7], [22.2, 0.7], [20.5, 1.6], [22.3, 1.7], [20.6, 3.2], [22.3, 3.3]].forEach(([x, y], i) => plant(x, y, 1 + (i % 3) * 0.3)); B(21.2, 2.4, 0, 1.2, 0.45, 0.45, P.oak); };
// ---- where you sit (seat slots)
R['s2.seat.longtables'] = r => { B(r.x + 0.2, r.y + 1.0, 0.72, r.w - 0.4, 0.8, 0.06, P.oak); B(r.x + 0.4, r.y + 1.3, 0, 0.1, 0.2, 0.72, P.char); B(r.x + r.w - 0.5, r.y + 1.3, 0, 0.1, 0.2, 0.72, P.char); for (let i = 0; i < 3; i++) { stool(r.x + 0.4 + i * 0.85, r.y + 0.45); stool(r.x + 0.4 + i * 0.85, r.y + 1.95); B(r.x + 0.55 + i * 0.85, r.y + 1.3, 0.78, 0.12, 0.12, 0.05, '#7dffa8', {glow: 1}); } };
R['s2.seat.booths4'] = r => booth(r.x + 0.4, r.y + 0.5);
R['s2.seat.counter'] = r => { B(r.x + 0.2, r.y + 0.4, 0, r.w - 0.4, 0.6, 1.0, P.white); B(r.x + 0.2, r.y + 0.4, 1.0, r.w - 0.4, 0.6, 0.05, P.oak); for (let i = 0; i < 4; i++) stool(r.x + 0.35 + i * 0.6, r.y + 1.25); };
R['s2.seat.farm'] = r => { B(r.x + 0.4, r.y + 1.2, 0, 0.1, 0.6, 0.75, P.char); B(r.x + r.w - 0.5, r.y + 1.2, 0, 0.1, 0.6, 0.75, P.char); B(r.x + 0.2, r.y + 1.0, 0.75, r.w - 0.4, 0.9, 0.08, P.oak); B(r.x + 0.3, r.y + 0.4, 0, r.w - 0.6, 0.38, 0.45, P.oakD); B(r.x + 0.3, r.y + 2.1, 0, r.w - 0.6, 0.38, 0.45, P.oakD); };
R['s2.seat.sofas'] = r => { flat(r.x + 0.2, r.y + 0.3, r.w - 0.4, r.d - 0.6, '#9fb2c9', 0.02); sofa(r.x + 0.3, r.y + 0.4, 2.0, 0.8, 'n', P.felt2); sofa(r.x + 0.3, r.y + 1.2, 0.8, 1.2, 'w', P.felt2); table(r.x + 1.3, r.y + 1.5, 0.8, 0.7, 0.4); };
R['s2.seat.focuspod'] = r => { B(r.x + 0.8, r.y + 0.8, 0, 1.1, 1.1, 2.2, P.navy); B(r.x + 0.8, r.y + 1.88, 0.1, 1.1, 0.04, 1.9, P.glass); B(r.x + 0.95, r.y + 1.86, 1.2, 0.8, 0.03, 0.05, '#fff1b8', {glow: 1}); };
R['s2.seat.pod4'] = r => { B(r.x + 0.3, r.y + 0.5, 0, 2.2, 1.8, 2.3, P.felt); B(r.x + 0.3, r.y + 2.28, 0.1, 2.2, 0.04, 2.0, P.glass); };
R['s2.seat.terrace'] = r => { flat(r.x + 0.1, r.y + 0.1, r.w - 0.2, r.d - 0.2, P.deck, 0.03); [[0.2, 0.2], [r.w - 0.8, 0.2]].forEach(([dx, dy]) => { B(r.x + dx, r.y + dy, 0, 0.6, 0.6, 0.5, P.char); B(r.x + dx + 0.05, r.y + dy + 0.05, 0.5, 0.5, 0.5, 0.45, P.green); }); table(r.x + 1.0, r.y + 1.4, 0.8, 0.8); chair(r.x + 0.4, r.y + 1.55, 'w', P.steel); chair(r.x + 1.95, r.y + 1.55, 'e', P.steel); };
R['s2.seat.stepped'] = r => { [[0.3, 1.2], [0.95, 0.8], [1.6, 0.4]].forEach(([dy, h], i) => { B(r.x + 0.2, r.y + dy, 0, r.w - 0.4, 0.65, h, P.oak); [0.3, 1.2, 2.0].forEach((dx, j) => B(r.x + dx, r.y + dy + 0.15, h, 0.45, 0.4, 0.1, [P.sage, P.navy, P.gold][(i + j) % 3])); }); };
// ---- add the fun (fun slots)
const mid = r => [r.x + r.w / 2, r.y + r.d / 2];
R['s2.fun.pool'] = r => { const [cx, cy] = mid(r); B(cx - 1.2, cy - 0.65, 0, 2.4, 1.3, 0.78, '#6a4a33'); B(cx - 1.1, cy - 0.55, 0.78, 2.2, 1.1, 0.03, '#2f7d4f'); B(cx - 0.3, cy - 0.1, 0.81, 0.08, 0.08, 0.06, '#ffffff'); B(cx + 0.3, cy, 0.81, 0.08, 0.08, 0.06, P.red); };
R['s2.fun.foosball'] = r => { const [cx, cy] = mid(r); B(cx - 0.65, cy - 0.4, 0, 1.3, 0.8, 0.9, '#7a5236'); B(cx - 0.6, cy - 0.35, 0.9, 1.2, 0.7, 0.02, '#3f8f4f'); [-0.4, -0.1, 0.2, 0.5].forEach(dx => B(cx + dx, cy - 0.55, 0.95, 0.04, 1.1, 0.04, P.steel)); };
R['s2.fun.pingpong'] = r => { const [cx, cy] = mid(r); B(cx - 1.0, cy - 0.1, 0, 0.1, 0.2, 0.72, P.char); B(cx + 0.9, cy - 0.1, 0, 0.1, 0.2, 0.72, P.char); B(cx - 1.3, cy - 0.7, 0.72, 2.6, 1.4, 0.05, P.blue); B(cx - 0.02, cy - 0.7, 0.77, 0.04, 1.4, 0.14, '#ffffff'); };
R['s2.fun.chess'] = r => { const [cx, cy] = mid(r); table(cx - 0.45, cy - 0.45, 0.9, 0.9); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) B(cx - 0.36 + i * 0.18, cy - 0.36 + j * 0.18, 0.78, 0.18, 0.18, 0.015, (i + j) % 2 ? '#2b2b2b' : '#f4efe4'); chair(cx - 1.05, cy - 0.23, 'w'); chair(cx + 0.6, cy - 0.23, 'e'); };
R['s2.fun.puzzles'] = r => { B(r.x + 0.2, r.y + 0.2, 0, r.w - 0.4, 0.4, 1.4, P.oak); [P.red, P.blue, P.gold, P.green, P.pink, P.navy].forEach((c, i) => B(r.x + 0.3 + i * 0.38, r.y + 0.25, 0.7 + (i % 2) * 0.35, 0.3, 0.3, 0.3, c)); table(r.x + 0.8, r.y + 1.1, 1.2, 0.8, 0.45); [P.gold, P.sage, P.pink, P.blue].forEach((c, i) => B(r.x + 0.9 + (i % 2) * 0.5, r.y + 1.15 + (i > 1) * 0.35, 0.51, 0.45, 0.3, 0.015, c)); };
R['s2.fun.tv'] = r => { screenOn(r.x + 0.5, r.y + 0.2, 0.7, 1.8, 0.08, 1.0, true); B(r.x + 0.5, r.y + 0.25, 0, 1.8, 0.4, 0.6, P.oakD); sofa(r.x + 0.4, r.y + 1.3, 2.0, 0.75, 's', P.felt2); };
R['s2.fun.videogame'] = r => { screenOn(r.x + 0.5, r.y + 0.2, 0.6, 1.8, 0.08, 1.0, true); B(r.x + 0.6, r.y + 0.3, 0, 1.6, 0.4, 0.5, P.char); B(r.x + 1.2, r.y + 0.35, 0.5, 0.4, 0.25, 0.08, '#e8e8e8'); [[0.4, P.pink], [1.3, P.gold]].forEach(([dx, c]) => { B(r.x + dx, r.y + 1.2, 0, 0.8, 0.8, 0.35, c); B(r.x + dx + 0.12, r.y + 1.32, 0.35, 0.56, 0.56, 0.2, c); }); };
// ---- make it work (work slots, thin strips)
R['s2.work.charging'] = r => { seg(r, 0.04, 0.96, 0.45, 0, 1.0, P.oak); [0.15, 0.35, 0.55, 0.75].forEach(t => seg(r, t, t + 0.05, 0.12, 1.0, 0.06, '#7dffa8', 0.15, {glow: 1})); };
R['s2.work.mobileboards'] = r => R['s1.near.mobilewb']({...r, d: 0.5});
R['s2.work.sharescreen'] = r => { const [x, y] = at(r, 0.3); screenOn(x, y, 0.8, 1.0, 0.08, 0.6, true); B(x + 0.45, y, 0, 0.08, 0.08, 0.8, P.steel); };
R['s2.work.coffeebar'] = r => { seg(r, 0.04, 0.75, 0.6, 0, 1.0, P.white); seg(r, 0.04, 0.75, 0.6, 1.0, 0.05, P.oak); seg(r, 0.1, 0.28, 0.45, 1.05, 0.45, P.char); [0.4, 0.48, 0.56].forEach(t => seg(r, t, t + 0.03, 0.1, 1.05, 0.1, '#ffffff', 0.2)); };
R['s2.work.pantry'] = r => { seg(r, 0.04, 0.5, 0.5, 0, 1.8, P.oak); [P.red, P.gold, P.green2, P.blue].forEach((c, i) => seg(r, 0.06 + i * 0.1, 0.13 + i * 0.1, 0.3, 0.6 + (i % 2) * 0.5, 0.25, c, 0.05)); seg(r, 0.55, 0.8, 0.6, 0, 1.9, '#e9eef2'); };
R['s2.work.lockers'] = r => { for (let i = 0; i < 6; i++) seg(r, i / 6 + 0.004, (i + 1) / 6 - 0.004, 0.6, 0, 1.8, i % 2 ? P.navy : '#2b4670'); };
R['s2.work.purifier'] = r => { [0.2, 0.7].forEach(t => { seg(r, t, t + 0.12, 0.38, 0, 1.1, '#ffffff', 0.1); seg(r, t, t + 0.12, 0.38, 1.1, 0.04, P.steel, 0.1); }); };
// ---- meeting rooms
R['s3.room.booth'] = () => { const [x0, y0] = ROOMS['s3.room.booth']; B(x0, y0, 0, 1.3, 1.3, 2.3, P.navy); B(x0, y0 + 1.28, 0.1, 1.3, 0.04, 2.0, P.glass); stool(x0 + 1.5, y0 + 0.5); };
R['s3.room.four'] = () => { const [a, b, c, d] = ROOMS['s3.room.four']; room(a, b, c, d); table(a + 1.1, b + 1.1, 1.1, 1.1); chair(a + 0.5, b + 1.4, 'w'); chair(a + 2.3, b + 1.4, 'e'); chair(a + 1.4, b + 0.5, 'n'); chair(a + 1.4, b + 2.3, 's'); };
R['s3.room.mid'] = () => { const [a, b, c, d] = ROOMS['s3.room.mid']; room(a, b, c, d); B(a + 0.9, b + 1.6, 0.72, 2.9, 1.2, 0.06, P.oak); B(a + 2.3, b + 2.1, 0, 0.12, 0.2, 0.72, P.char); for (let i = 0; i < 4; i++) { chair(a + 1.0 + i * 0.7, b + 1.0, 'n'); chair(a + 1.0 + i * 0.7, b + 2.9, 's'); } };
R['s3.room.twelve'] = () => { const [a, b, c, d] = ROOMS['s3.room.twelve']; room(a, b, c, d); B(a + 0.9, b + 2.4, 0.72, 3.8, 1.3, 0.06, P.oak); B(a + 2.7, b + 2.9, 0, 0.12, 0.3, 0.72, P.char); for (let i = 0; i < 6; i++) { chair(a + 0.95 + i * 0.62, b + 1.8, 'n'); chair(a + 0.95 + i * 0.62, b + 3.8, 's'); } };
R['s3.room.huddle'] = () => { const [a, b] = ROOMS['s3.room.huddle']; sofa(a + 0.3, b + 0.3, 2.6, 0.7, 'n', P.sage); sofa(a + 0.3, b + 1.0, 0.7, 1.8, 'w', P.sage); sofa(a + 2.2, b + 1.0, 0.7, 1.8, 'e', P.sage); table(a + 1.2, b + 1.3, 0.9, 0.9); B(a + 1.5, b + 1.6, 2.4, 0.3, 0.3, 0.2, P.gold, {glow: 1}); };
R['s3.room.flexi'] = () => { const [a, b, c, d] = ROOMS['s3.room.flexi']; flat(a, b, c - a, d - b, P.carpet, 0.02); B(a, b, 0, c - a, 0.08, 2.5, P.white); B(a, b, 0, 0.08, d - b, 2.5, P.white);
  for (let i = 0; i < 3; i++) B(a + 0.3 + i * 0.25, d - 0.1, 0, 0.9, 0.08, 2.4, '#cfd6de'); B(c - 0.08, b, 0, 0.06, d - b, 2.5, P.glass);
  B(a + 1.4, b + 1.8, 0.72, 2.4, 1.1, 0.06, P.oak); [[a + 1.6, b + 2.0], [a + 3.5, b + 2.6]].forEach(([x, y]) => B(x, y, 0, 0.1, 0.1, 0.72, P.char)); for (let i = 0; i < 3; i++) { chair(a + 1.5 + i * 0.75, b + 1.2, 'n'); chair(a + 1.5 + i * 0.75, b + 3.0, 's'); } };
// ---- what's in the room (kit, placed in the chosen room)
const RR = () => ROOMS[PICKS['s3.room']?.[0]] || ROOMS['s3.room.four'];
R['s3.kit.video'] = () => { const [a, b, c] = RR(); screenOn((a + c) / 2 - 0.8, b + 0.1, 0.9, 1.6, 0.08, 0.95, true); B((a + c) / 2 - 0.4, b + 0.1, 1.9, 0.8, 0.1, 0.1, P.char); };
R['s3.kit.writingwall'] = () => { const [a, b, , d] = RR(); B(a + 0.1, b + 0.4, 0.4, 0.06, Math.min(2.4, d - b - 0.8), 1.7, '#ffffff'); };
R['s3.kit.standing'] = () => { const [, , c, d] = RR(); B(c - 1.2, d - 1.0, 0, 0.9, 0.6, 1.05, P.oak); };
R['s3.kit.soft'] = () => { const [a, , , d] = RR(); sofa(a + 0.2, d - 1.0, 1.4, 0.75, 's', P.felt2); };
R['s3.kit.daylight'] = () => { const [a, b, c, d] = RR(); flat(a + 0.3, b + 0.3, c - a - 0.6, d - b - 0.6, 'rgba(255,226,140,0.35)', 0.03); B(a + 0.2, b + 0.2, 2.6, c - a - 0.4, d - b - 0.4, 0.05, 'rgba(255,240,190,0.35)'); };
R['s3.kit.sound'] = () => { const [a, b, c] = RR(); for (let i = 0; i < 3; i++) B(a + 0.4 + i * (c - a - 0.8) / 3, b + 0.1, 0.6, (c - a - 0.8) / 3 - 0.15, 0.06, 1.4, P.navy); };
R['s3.kit.purifier'] = () => { const [, b, c] = RR(); B(c - 0.6, b + 0.3, 0, 0.35, 0.35, 1.1, '#ffffff'); };
R['s3.kit.pinup'] = () => { const [a, b, , d] = RR(); B(a + 0.1, b + 0.3, 0.5, 0.06, Math.min(2.6, d - b - 0.6), 1.6, P.cork); [0.6, 1.2, 1.8].forEach(dy => B(a + 0.16, b + dy, 1.0, 0.02, 0.4, 0.5, '#ffffff')); };

// ============================================================ scene

// soft studio renderer: plinth, contact shadows, graded faces, thin top highlights
function drawBoxes(ctx, boxes, pr, now, afterBase) {
  const order = boxes.map(b => ({b, k: b.layer ? -1e6 + (b.ord || 0) : b.flat ? -1e5 + b.x + b.y : b.x + b.w / 2 + b.y + b.d / 2 + b.z})).sort((a, b) => a.k - b.k);
  const anim = b => { const born = now != null ? BORN[b.tag] : null; if (!born) return [0, 1]; const t = (now - born) / 520; return t < 1 ? [(1 - easeBack(t)) * 2.2, Math.min(1, t * 2.2)] : [0, 1]; };
  const quad = (pts, fill) => poly(ctx, pts, fill);
  let shadowsDone = false;
  const shadows = () => {
    const cv = ctx.canvas, off = document.createElement('canvas'); off.width = cv.width; off.height = cv.height;
    const o = off.getContext('2d'); o.setTransform(ctx.getTransform()); o.fillStyle = 'rgba(28,36,48,0.2)';
    for (const {b} of order) { if (b.layer || b.flat || b.z > 0.15 || b.h < 0.2 || b.c.startsWith('rgba')) continue;
      const [dz] = anim(b); if (dz > 0.3) continue;
      const s = Math.min(b.h, 2.2) * 0.38, {x, y, w, d} = b;
      o.beginPath(); [pr(x, y, 0.02), pr(x + w, y, 0.02), pr(x + w, y + d + s, 0.02), pr(x - s * 0.25, y + d + s, 0.02), pr(x - s * 0.25, y + s, 0.02)].forEach((p, i) => i ? o.lineTo(p[0], p[1]) : o.moveTo(p[0], p[1])); o.closePath(); o.fill(); }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'blur(5px)'; ctx.globalAlpha = 0.8; ctx.drawImage(off, 0, 0); ctx.restore(); shadowsDone = true;
  };
  for (const {b} of order) {
    if (!shadowsDone && !b.layer && !b.flat) { afterBase && afterBase(); shadows(); }
    const [dz, alpha] = anim(b); const {x, y, w, d, h} = b, z = b.z + dz;
    ctx.globalAlpha = alpha * (b.a ?? 1);
    if (b.glow) { ctx.shadowColor = b.c; ctx.shadowBlur = 12; }
    const glass = b.c.startsWith('rgba');
    const L = [pr(x, y + d, z), pr(x + w, y + d, z), pr(x + w, y + d, z + h), pr(x, y + d, z + h)];
    const R = [pr(x + w, y, z), pr(x + w, y + d, z), pr(x + w, y + d, z + h), pr(x + w, y, z + h)];
    const T = [pr(x, y, z + h), pr(x + w, y, z + h), pr(x + w, y + d, z + h), pr(x, y + d, z + h)];
    if (h > 0.03) {
      if (glass) { quad(L, b.c); quad(R, b.c); }
      else for (const [F, f] of [[L, 0.8], [R, 0.92]]) { const g = ctx.createLinearGradient(0, F[3][1], 0, F[0][1]); g.addColorStop(0, shade(b.c, f)); g.addColorStop(1, shade(b.c, f * 0.86)); quad(F, g); }
    }
    quad(T, shade(b.c, 1.06));
    if (h > 0.03 || glass) { ctx.strokeStyle = glass ? 'rgba(235,248,255,0.6)' : 'rgba(255,255,255,0.28)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(...T[3]); ctx.lineTo(...T[0]); ctx.lineTo(...T[1]); ctx.stroke(); }
    ctx.shadowBlur = 0;
  }
  if (!shadowsDone) { afterBase && afterBase(); }
  ctx.globalAlpha = 1;
}

const ZB = {s1: [0, 0, 13.3, 14], s2: [13.3, 0, 23.3, 14], s3: [23.3, 0, 30, 14]};
const FLOOR = {s1: '#d2cdc4', s2: '#ddd2bf', s3: '#d3d6d8'};
function scene(stop, picks, free) {
  OUT = []; TAG = 'base'; PICKS = picks || {};
  FLAGS = {}; (PICKS['s1.desk'] || []).forEach(id => FLAGS[id.split('.').pop()] = true);
  const [x0, y0, x1, y1] = ZB[stop];
  B(x0 - 0.5, y0 - 0.5, -0.45, x1 - x0 + 1, y1 - y0 + 1, 0.45, '#dcdad5', {layer: 1, ord: 0});
  flat(x0, y0, x1 - x0, y1 - y0, FLOOR[stop], 0.01);
  for (let x = x0; x < x1 - 0.1; x += 1.5) { const w = Math.min(1.5, x1 - x); B(x, y0, 0, 0.07, 0.1, 2.6, P.char); B(x + 0.07, y0 + 0.02, 0, w - 0.07, 0.06, 2.6, P.glass); }
  B(x0, y0, 0, 0.12, y1 - y0, 2.6, '#e9e7e2');
  const run = (id, arg) => { if (R[id]) withTag(id, () => R[id](arg)); };
  const one = k => PICKS[k]?.[0] && run(PICKS[k][0]);
  const slots = (k, list) => (PICKS[k] || []).forEach((id, i) => list[i] && run(id, list[i]));
  if (stop === 's1') { one('s1.cluster'); one('s1.hood'); slots('s1.near', NEAR); }
  if (stop === 's2') { one('s2.cafe'); one('s2.next'); slots('s2.seat', SEAT); slots('s2.fun', FUN); slots('s2.work', WORK); }
  if (stop === 's3') { one('s3.room'); (PICKS['s3.kit'] || []).forEach(id => run(id)); }
  return OUT;
}
function camFor(stop, W, H) {
  const [x0, y0, x1, y1] = ZB[stop];
  const pts = [[x0 - .5, y0 - .5, 2.8], [x1 + .5, y0 - .5, 2.8], [x1 + .5, y1 + .5, -.45], [x0 - .5, y1 + .5, -.45], [x0 - .5, y0 - .5, -.45], [x1 + .5, y1 + .5, 2.8]].map(([x, y, z]) => [(x - y) * 0.866, (x + y) * 0.5 - z]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
  const s = Math.min(W * 0.86 / (mxx - mnx), H * 0.82 / (mxy - mny));
  return {x: (mnx + mxx) / 2, y: (mny + mxy) / 2 - 0.2, s};
}
function paint(ctx, W, H, stop, picks, now) {
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, W * 0.75); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#dfe4ec');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const boxes = scene(stop, picks), cam = camFor(stop, W, H), pr = projector(cam, W, H), [x0, y0, x1, y1] = ZB[stop];
  const c = pr((x0 + x1) / 2, (y0 + y1) / 2, -0.6); ctx.save(); ctx.filter = 'blur(18px)'; ctx.fillStyle = 'rgba(30,40,60,0.18)'; ctx.beginPath(); ctx.ellipse(c[0], c[1] + cam.s * 0.6, cam.s * (x1 - x0 + y1 - y0) * 0.48, cam.s * (x1 - x0 + y1 - y0) * 0.17, 0, 0, 7); ctx.fill(); ctx.restore();
  drawBoxes(ctx, boxes, pr, now, () => {
    ctx.strokeStyle = '#2fc3e8'; ctx.lineWidth = 2; ctx.beginPath();
    [[x0 - .5, y1 + .5], [x1 + .5, y1 + .5], [x1 + .5, y0 - .5]].forEach(([x, y], i) => { const p = pr(x, y, 0); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }); ctx.stroke();
  });
  return {boxes, pr};
}
let loop = null; const SNAP = new Map();
const Builder = {
  // draw into a canvas; animates newly placed items (born = {optionId: time})
  draw(canvas, stop, picks, born) {
    BORN = born || {};
    const dpr = Math.min(2, devicePixelRatio || 1), W = canvas.clientWidth || 960, H = canvas.clientHeight || 540;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    const ctx = canvas.getContext('2d'); cancelAnimationFrame(loop);
    const frame = () => { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const now = performance.now(); const r = paint(ctx, W, H, stop, picks, now); Builder.last = {r, W, H};
      if (Object.values(BORN).some(t => now - t < 700) && document.body.contains(canvas)) loop = requestAnimationFrame(frame); };
    frame();
  },
  // where an item sits on screen, in % of the canvas, for its pin
  anchor(tags) {
    const L = Builder.last; if (!L) return null;
    const bs = L.r.boxes.filter(b => tags.some(t => b.tag === t || b.tag.startsWith(t + '.'))); if (!bs.length) return null;
    let sx = 0, sy = 0, top = Infinity; for (const b of bs) { const p = L.r.pr(b.x + b.w / 2, b.y + b.d / 2, b.z + b.h); sx += p[0]; sy += p[1]; top = Math.min(top, p[1]); }
    return {x: sx / bs.length / L.W * 100, y: (top + (sy / bs.length - top) * 0.3) / L.H * 100};
  },
  snapshot(stop, picks, w = 1280, h = 720) { const key = stop + JSON.stringify(Object.entries(picks).filter(([k]) => k.startsWith(stop + '.'))); if (SNAP.has(key)) return SNAP.get(key); const c = document.createElement('canvas'); c.width = w; c.height = h; BORN = {}; paint(c.getContext('2d'), w, h, stop, picks, null); const u = c.toDataURL('image/jpeg', 0.9); SNAP.set(key, u); return u; },
};
window.Builder = Builder;
})();
