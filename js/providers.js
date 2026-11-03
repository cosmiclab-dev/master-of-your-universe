// Image providers for Master of Your Universe.
// Img.run({prompt, refs}) -> data URL. refs = data URLs to edit/follow (edit-capable providers only).
// Route "direct" calls the provider from the browser; "proxy" goes through /api/proxy (local server.py or Vercel).
(function () {
  const DEFAULTS = {
    provider: 'offline', route: 'auto', quality: 'high', coins: false, kiosk: false,
    keys: {gemini: '', openai: '', fal: '', unsloth: '', custom: ''},
    models: {gemini: 'gemini-3.1-flash-image', openai: 'gpt-image-1', falGen: 'fal-ai/qwen-image', falEdit: 'fal-ai/qwen-image-edit', unsloth: '', custom: ''},
    base: {gemini: 'https://generativelanguage.googleapis.com/v1beta', openai: 'https://api.openai.com/v1', fal: 'https://fal.run', unsloth: 'http://127.0.0.1:8888/v1', custom: ''},
    caps: {},
  };
  const NAMES = {offline: '3D only (no photos)', gemini: 'Nano Banana 2 (Gemini)', openai: 'OpenAI images', fal: 'fal.ai', unsloth: 'Unsloth on this laptop', custom: 'OpenAI-compatible API'};

  function merge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) a[k] = merge(a[k] || {}, b[k]); else a[k] = b[k]; } return a; }
  const load = () => { try { return merge(structuredClone(DEFAULTS), JSON.parse(localStorage.getItem('moyu-settings') || '{}')); } catch (e) { return structuredClone(DEFAULTS); } };
  let S = load();
  const save = s => { S = s; try { localStorage.setItem('moyu-settings', JSON.stringify(s)); } catch (e) {} };

  // ---------------------------------------------------------- transport
  const isHttp = () => location.protocol.startsWith('http');
  let serverOK = null, serverKeys = {};
  async function hasServer() {
    if (!isHttp()) return false; if (serverOK !== null) return serverOK;
    try { const r = await fetch('api/health', {cache: 'no-store'}); const j = r.ok ? await r.json() : {}; serverOK = j.ok === true; serverKeys = j.keys || {}; } catch (e) { serverOK = false; }
    return serverOK;
  }
  async function useProxy() { return S.route === 'proxy' || (S.route === 'auto' && await hasServer()); }
  const host = u => { try { return new URL(u).host; } catch (e) { return u; } };
  async function bufToB64(buf) { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  async function xfetch(url, init = {}) {
    const proxied = await useProxy();
    try {
      if (!proxied) return await fetch(url, init);
      let body64 = null; const headers = {...(init.headers || {})};
      if (init.body instanceof FormData) { const r = new Response(init.body); headers['Content-Type'] = r.headers.get('Content-Type'); body64 = await bufToB64(await r.arrayBuffer()); }
      else if (init.body) body64 = await bufToB64(new TextEncoder().encode(init.body));
      return await fetch('api/proxy', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({url, method: init.method || 'GET', headers, body64})});
    } catch (e) {
      if (/localhost|127\.0\.0\.1/.test(url) && !proxied) throw new Error(`Can't reach ${host(url)} from the browser. Start the game with “Start Game” so requests go through the local server.`);
      throw new Error(proxied ? 'The game server stopped. Restart it with “Start Game”.' : `Can't reach ${host(url)}. Check the internet connection, or start the game with “Start Game”.`);
    }
  }
  async function readJson(r) { const t = await r.text(); try { return JSON.parse(t); } catch (e) { return {raw: t.slice(0, 300)}; } }
  function errMsg(j, r) {
    const m = j?.error?.message || (typeof j?.error === 'string' && j.error) || j?.detail?.[0]?.msg || (typeof j?.detail === 'string' && j.detail) || j?.message || j?.raw || '';
    if (r.status === 401 || r.status === 403) return 'The API key was refused. Check it in Settings.' + (m ? ` (${m.slice(0, 120)})` : '');
    if (r.status === 429) return 'Too many requests or no credit left on this key.';
    if (/billing|FAILED_PRECONDITION|free tier/i.test(m)) return 'Billing is not switched on for this key. In Google AI Studio, open the key’s project and enable billing, then try again.';
    return m ? m.slice(0, 220) : `The service answered with error ${r.status}.`;
  }
  const blobToDataUrl = b => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(b); });
  const dataUrlToBlob = async u => (await fetch(u)).blob();
  const split = u => { const m = /^data:([^;]+);base64,(.*)$/.exec(u) || []; return {mime: m[1] || 'image/png', b64: m[2] || ''}; };
  async function toDataUrl(u, base) {
    if (!u) return null; if (u.startsWith('data:')) return u;
    if (!/^https?:/.test(u)) u = base.replace(/\/v1$/, '') + u;
    try { return await blobToDataUrl(await (await fetch(u)).blob()); } catch (e) { return blobToDataUrl(await (await xfetch(u)).blob()); }
  }
  // find an image in any of the usual response shapes
  async function pickImage(j, base) {
    const d = j?.data?.[0] || j?.images?.[0] || j?.image || j?.output?.[0] || j;
    const b64 = d?.b64_json || d?.b64 || d?.base64 || d?.image_base64;
    if (b64) return b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
    const u = d?.url || d?.image_url || (typeof d === 'string' ? d : null);
    if (u) return toDataUrl(u, base);
    throw new Error('The model answered but sent no image.');
  }

  // ---------------------------------------------------------- providers
  const P = {};
  P.gemini = {
    edits: true,
    async run({prompt, refs, final}) {
      if (!S.keys.gemini && !(await useProxy())) throw new Error('Add a Gemini API key in Settings.');
      const size = S.quality === 'fast' || !final ? '1K' : (await useProxy()) && !/^(localhost|127\.)/.test(location.hostname) ? '1K' : '2K';
      const body = JSON.stringify({contents: [{role: 'user', parts: [{text: prompt}, ...refs.map(u => { const d = split(u); return {inlineData: {mimeType: d.mime, data: d.b64}}; })]}],
        generationConfig: {responseModalities: ['IMAGE'], imageConfig: {aspectRatio: '16:9', imageSize: size}}});
      let last = '';
      for (const m of [...new Set([S.models.gemini, 'gemini-3.1-flash-image', 'gemini-3.1-flash-image-preview'].filter(Boolean))]) {
        const r = await xfetch(`${S.base.gemini}/models/${m}:generateContent`, {method: 'POST', headers: {'Content-Type': 'application/json', ...(S.keys.gemini ? {'x-goog-api-key': S.keys.gemini} : {})}, body});
        const j = await readJson(r);
        if (r.status === 404) { last = `Model “${m}” wasn't found.`; continue; }
        if (!r.ok) throw new Error(errMsg(j, r));
        const img = (j.candidates?.[0]?.content?.parts || []).filter(p => p.inlineData || p.inline_data).pop();
        if (!img) throw new Error(j.promptFeedback?.blockReason ? 'The model declined this prompt.' : 'No image came back. Try again.');
        const d = img.inlineData || img.inline_data; return `data:${d.mimeType || d.mime_type || 'image/png'};base64,${d.data}`;
      }
      throw new Error(last);
    },
    async test() { const r = await xfetch(`${S.base.gemini}/models?pageSize=200`, {headers: S.keys.gemini ? {'x-goog-api-key': S.keys.gemini} : {}}); const j = await readJson(r); if (!r.ok) throw new Error(errMsg(j, r));
      const img = (j.models || []).map(m => m.name.replace('models/', '')).filter(n => /image/.test(n)); return `Connected to Gemini. ${img.length ? 'Image models: ' + img.join(', ') : 'No image models listed for this key.'}`; },
  };
  function openaiLike(kind) {
    const base = () => (S.base[kind] || '').replace(/\/$/, ''), model = () => S.models[kind] || (kind === 'openai' ? 'gpt-image-1' : '');
    const auth = () => S.keys[kind] ? {Authorization: 'Bearer ' + S.keys[kind]} : {};
    // build the body from the fields this server says it accepts (read from its /openapi.json during Test)
    function genBody(prompt) {
      if (kind === 'openai') return {model: model(), prompt, size: '1536x1024', quality: S.quality === 'fast' ? 'medium' : 'high', n: 1};
      const f = S.caps[kind]?.fields; const want = {model: model(), prompt, n: 1, size: '1664x928', width: 1664, height: 928, seed: 42, response_format: 'b64_json', num_inference_steps: 40, steps: 40, guidance_scale: 1, cfg_scale: 1};
      if (!f || !f.length) return {model: model(), prompt, n: 1, size: '1664x928', response_format: 'b64_json'};
      return Object.fromEntries(Object.entries(want).filter(([k]) => f.includes(k)));
    }
    return {
      get edits() { return kind === 'openai' || !!S.caps[kind]?.edit; },
      async run({prompt, refs}) {
        if (!base()) throw new Error('Add the server address in Settings.');
        if (kind !== 'openai' && !model()) throw new Error('Pick the image model in Settings (press Test to list them).');
        let r;
        if (refs.length && this.edits) {
          const fd = new FormData(); fd.append('model', model()); fd.append('prompt', prompt); fd.append('n', '1');
          fd.append('size', kind === 'openai' ? '1536x1024' : '1664x928'); if (kind === 'openai') fd.append('quality', S.quality === 'fast' ? 'medium' : 'high'); else fd.append('response_format', 'b64_json');
          for (let i = 0; i < refs.length; i++) fd.append(kind === 'openai' ? 'image[]' : 'image', await dataUrlToBlob(refs[i]), `ref${i}.png`);
          r = await xfetch(base() + '/images/edits', {method: 'POST', headers: auth(), body: fd});
        } else {
          const post = b => xfetch(base() + '/images/generations', {method: 'POST', headers: {'Content-Type': 'application/json', ...auth()}, body: JSON.stringify(b)});
          r = await post(genBody(prompt));
          if (kind !== 'openai' && (r.status === 400 || r.status === 422) && !S.caps[kind]?.fields) r = await post({model: model(), prompt});
        }
        const j = await readJson(r);
        if (r.status === 404) throw new Error(`${host(base())} has no image endpoint at this address. Check the server address ends with /v1.`);
        if (!r.ok) throw new Error(errMsg(j, r));
        return pickImage(j, base());
      },
      async test() {
        if (!base()) throw new Error('Add the server address first.');
        const r = await xfetch(base() + '/models', {headers: auth()}); const j = await readJson(r);
        if (r.status === 401 || r.status === 403) throw new Error('The server answered but refused the API key.');
        if (!r.ok) throw new Error(errMsg(j, r));
        const ids = (j.data || []).map(m => m.id); P[kind].models = ids;
        let caps = '';
        if (kind !== 'openai') {
          try {
            const o = await readJson(await xfetch(base().replace(/\/v1$/, '') + '/openapi.json', {headers: auth()}));
            const paths = o.paths || {}, gp = Object.keys(paths).find(p => /images\/generations$/.test(p)), ep = Object.keys(paths).find(p => /images\/edits$/.test(p));
            let fields = null; const sch = gp && paths[gp].post?.requestBody?.content?.['application/json']?.schema;
            if (sch) { const ref = sch.$ref ? o.components?.schemas?.[sch.$ref.split('/').pop()] : sch; fields = Object.keys(ref?.properties || {}); }
            S.caps = {...S.caps, [kind]: {edit: !!ep, gen: !!gp, fields}}; save(S);
            caps = gp ? ` Image generation: ready${fields ? ` (fields: ${fields.join(', ')})` : ''}. Image edits: ${ep ? 'ready' : 'not offered, so photos are made from a text description'}.` : ' This server does not offer image generation.';
          } catch (e) { caps = ' (Could not read the server’s API description.)'; }
        }
        const img = ids.filter(i => /image|flux|sdxl|diffus|ernie|kontext/i.test(i));
        return `Connected to ${host(base())}. ${img.length ? 'Image models: ' + img.join(', ') : ids.length ? 'Models: ' + ids.slice(0, 8).join(', ') : 'No models loaded.'}.${caps}`;
      },
    };
  }
  P.openai = openaiLike('openai'); P.unsloth = openaiLike('unsloth'); P.custom = openaiLike('custom');
  P.fal = {
    edits: true,
    async run({prompt, refs}) {
      if (!S.keys.fal && !(await useProxy())) throw new Error('Add a fal.ai key in Settings.');
      const model = refs.length ? S.models.falEdit : S.models.falGen;
      const body = refs.length ? {prompt, image_url: refs[0], ...(/nano-banana|seedream|flux-2|gemini/.test(model) ? {image_urls: refs} : {})} : {prompt, image_size: 'landscape_16_9', num_images: 1};
      const r = await xfetch(`${S.base.fal}/${model}`, {method: 'POST', headers: {'Content-Type': 'application/json', ...(S.keys.fal ? {Authorization: 'Key ' + S.keys.fal} : {})}, body: JSON.stringify(body)});
      const j = await readJson(r); if (!r.ok) throw new Error(errMsg(j, r));
      return pickImage(j, S.base.fal);
    },
    async test() { if (!S.keys.fal && !(await useProxy())) throw new Error('Add a fal.ai key.'); return 'Key saved. fal.ai has no free check, so the first photo confirms it.'; },
  };
  P.offline = {edits: false, async run() { throw new Error('offline'); }, async test() { return 'No photo model. The game shows the 3D build only.'; }};

  // ---------------------------------------------------------- cache
  const mem = new Map(); let dbp = null;
  function db() { if (dbp) return dbp; dbp = new Promise(res => { try { const q = indexedDB.open('moyu', 2); q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains('img')) q.result.createObjectStore('img'); }; q.onsuccess = () => res(q.result); q.onerror = () => res(null); } catch (e) { res(null); } }); return dbp; }
  async function cacheGet(k) { if (mem.has(k)) return mem.get(k); const d = await db(); if (!d) return null; return new Promise(res => { try { const q = d.transaction('img').objectStore('img').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } }); }
  async function cachePut(k, v) { mem.set(k, v); const d = await db(); if (d) try { d.transaction('img', 'readwrite').objectStore('img').put(v, k); } catch (e) {} }
  async function cacheClear() { mem.clear(); const d = await db(); if (d) try { d.transaction('img', 'readwrite').objectStore('img').clear(); } catch (e) {} }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

  async function run(job) {
    const p = P[S.provider] || P.offline, refs = p.edits ? (job.refs || []) : [];
    const key = 'r:' + S.provider + ':' + JSON.stringify(S.models) + ':' + hash(job.prompt + '|' + refs.map(r => hash(r.slice(-4000))).join(','));
    const hit = await cacheGet(key); if (hit) return {url: hit, cached: true};
    const url = await p.run({prompt: refs.length ? job.prompt : (job.textPrompt || job.prompt), refs, final: !!job.final});
    await cachePut(key, url); return {url, cached: false};
  }
  // first run on the laptop: if keys.env has a Gemini key, switch photos on without any setup
  const ready = hasServer().then(ok => { if (ok && serverKeys.gemini && S.provider === 'offline' && !S.chosen) { S.provider = 'gemini'; S.route = 'auto'; save(S); } });
  window.Img = {
    ready, serverKeys: () => serverKeys,
    NAMES, get settings() { return S; }, save, load, run, hasServer, useProxy, cacheClear, hash,
    test: () => (P[S.provider] || P.offline).test(), providerModels: k => P[k]?.models || [],
    canEdit: () => !!(P[S.provider] || P.offline).edits, isOffline: () => S.provider === 'offline',
  };
})();
