// Image providers for Master of Your Universe.
// One call for everything: Img.run({prompt, refs}) returns a data URL.
// refs = data URLs of images to edit or follow. With refs it's an edit, without it's a fresh generation.
// Route "direct" calls the provider from the browser; route "proxy" goes through /api/proxy (local server.py or Vercel).
(function () {
  const DEFAULTS = {
    provider: 'offline', route: 'auto', quality: 'high', coins: false,
    keys: {gemini: '', openai: '', fal: '', unsloth: '', custom: ''},
    models: {gemini: 'gemini-3.1-flash-image', openai: 'gpt-image-1', falGen: 'fal-ai/qwen-image', falEdit: 'fal-ai/qwen-image-edit', unsloth: '', custom: ''},
    base: {unsloth: 'http://127.0.0.1:8888/v1', custom: ''},
  };
  const NAMES = {offline: 'Offline (pre-made images only)', gemini: 'Nano Banana 2 (Google Gemini)', openai: 'OpenAI (gpt-image)', fal: 'fal.ai', unsloth: 'Unsloth (local)', custom: 'Any OpenAI-compatible API'};

  const load = () => { try { const s = JSON.parse(localStorage.getItem('moyu-settings') || '{}'); return deepMerge(structuredClone(DEFAULTS), s); } catch (e) { return structuredClone(DEFAULTS); } };
  function deepMerge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) a[k] = deepMerge(a[k] || {}, b[k]); else a[k] = b[k]; } return a; }
  let S = load();
  const save = s => { S = s; try { localStorage.setItem('moyu-settings', JSON.stringify(s)); } catch (e) {} };

  // ---------------------------------------------------------- helpers
  const isHttp = () => location.protocol.startsWith('http');
  let serverOK = null;
  async function hasServer() {
    if (!isHttp()) return false;
    if (serverOK !== null) return serverOK;
    try { const r = await fetch('api/health', {cache: 'no-store'}); serverOK = r.ok; } catch (e) { serverOK = false; }
    return serverOK;
  }
  async function useProxy() { return S.route === 'proxy' || (S.route === 'auto' && await hasServer()); }
  const dataUrlToBlob = async u => (await fetch(u)).blob();
  const blobToDataUrl = b => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(b); });
  const b64ToDataUrl = (b64, mime = 'image/png') => `data:${mime};base64,${b64}`;
  const splitDataUrl = u => { const m = /^data:([^;]+);base64,(.*)$/.exec(u); return {mime: m ? m[1] : 'image/png', b64: m ? m[2] : ''}; };
  async function bufToB64(buf) { const bytes = new Uint8Array(buf); let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }

  // fetch that can go through the proxy (keeps CORS and keys off the browser when a server is present)
  async function xfetch(url, init = {}) {
    if (!(await useProxy())) return fetch(url, init);
    let body64 = null, headers = {...(init.headers || {})};
    if (init.body instanceof FormData) { const r = new Response(init.body); headers['Content-Type'] = r.headers.get('Content-Type'); body64 = await bufToB64(await r.arrayBuffer()); }
    else if (init.body) body64 = btoa(unescape(encodeURIComponent(init.body)));
    return fetch('api/proxy', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({url, method: init.method || 'GET', headers, body64})});
  }
  async function readJson(r) { const t = await r.text(); try { return JSON.parse(t); } catch (e) { return {raw: t.slice(0, 300)}; } }
  const errMsg = (j, r) => j?.error?.message || j?.error || j?.detail?.[0]?.msg || j?.detail || j?.message || j?.raw || `HTTP ${r.status}`;
  async function urlToDataUrl(u) {
    if (u.startsWith('data:')) return u;
    try { return await blobToDataUrl(await (await fetch(u)).blob()); }
    catch (e) { const r = await xfetch(u); return blobToDataUrl(await r.blob()); }
  }

  // ---------------------------------------------------------- providers
  const P = {};
  P.gemini = {
    async run({prompt, refs}) {
      const key = S.keys.gemini; if (!key && !(await useProxy())) throw new Error('Add your Gemini API key in Settings.');
      const size = S.quality === 'high' ? (await useProxy() && !/^(localhost|127\.)/.test(location.hostname) ? '1K' : '2K') : '1K';
      const parts = [{text: prompt}, ...refs.map(u => { const d = splitDataUrl(u); return {inlineData: {mimeType: d.mime, data: d.b64}}; })];
      const body = JSON.stringify({contents: [{role: 'user', parts}], generationConfig: {responseModalities: ['IMAGE'], imageConfig: {aspectRatio: '16:9', imageSize: size}}});
      const models = [...new Set([S.models.gemini, 'gemini-3.1-flash-image', 'gemini-3.1-flash-image-preview'].filter(Boolean))];
      let last = '';
      for (const m of models) {
        const r = await xfetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {method: 'POST', headers: {'Content-Type': 'application/json', ...(key ? {'x-goog-api-key': key} : {})}, body});
        const j = await readJson(r);
        if (r.status === 404) { last = `Model ${m} not found`; continue; }
        if (!r.ok) throw new Error(errMsg(j, r));
        const img = (j.candidates?.[0]?.content?.parts || []).filter(p => p.inlineData || p.inline_data).pop();
        if (!img) throw new Error(j.candidates?.[0]?.finishReason ? `No image (${j.candidates[0].finishReason}). Try again.` : 'No image came back. Try again.');
        const d = img.inlineData || img.inline_data; return b64ToDataUrl(d.data, d.mimeType || d.mime_type);
      }
      throw new Error(last);
    },
    async test() { const r = await xfetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {headers: S.keys.gemini ? {'x-goog-api-key': S.keys.gemini} : {}}); const j = await readJson(r); if (!r.ok) throw new Error(errMsg(j, r));
      const img = (j.models || []).map(m => m.name.replace('models/', '')).filter(n => /image/.test(n)); return img.length ? `Connected. Image models: ${img.join(', ')}` : 'Connected.'; },
  };
  // OpenAI and any OpenAI-compatible server share one shape
  function openaiLike(kind) {
    const base = () => kind === 'openai' ? 'https://api.openai.com/v1' : (S.base[kind] || '').replace(/\/$/, '');
    const model = () => kind === 'openai' ? (S.models.openai || 'gpt-image-1') : S.models[kind];
    const auth = () => S.keys[kind] ? {Authorization: 'Bearer ' + S.keys[kind]} : {};
    return {
      async run({prompt, refs}) {
        if (!base()) throw new Error('Add the server address in Settings.');
        const size = kind === 'openai' ? '1536x1024' : '1664x928', q = S.quality === 'high' ? 'high' : 'medium';
        let r;
        if (!refs.length) {
          const body = {model: model(), prompt, size, n: 1};
          if (kind === 'openai') body.quality = q; else Object.assign(body, {response_format: 'b64_json', seed: 42, width: 1664, height: 928});
          const post = b => xfetch(base() + '/images/generations', {method: 'POST', headers: {'Content-Type': 'application/json', ...auth()}, body: JSON.stringify(b)});
          r = await post(body);
          if (kind !== 'openai' && (r.status === 400 || r.status === 422)) r = await post({model: model(), prompt});
        } else {
          const fd = new FormData(); fd.append('model', model()); fd.append('prompt', prompt); fd.append('size', size); fd.append('n', '1');
          if (kind === 'openai') fd.append('quality', q); else fd.append('response_format', 'b64_json');
          for (let i = 0; i < refs.length; i++) fd.append(refs.length > 1 || kind === 'openai' ? 'image[]' : 'image', await dataUrlToBlob(refs[i]), `ref${i}.png`);
          r = await xfetch(base() + '/images/edits', {method: 'POST', headers: auth(), body: fd});
        }
        const j = await readJson(r);
        if (r.status === 404) throw new Error(`This server has no ${refs.length ? '/images/edits' : '/images/generations'} endpoint. Check the image API is switched on.`);
        if (!r.ok) throw new Error(errMsg(j, r));
        const d = j.data?.[0] || j.images?.[0] || j.output?.[0] || j;
        const b64 = d?.b64_json || d?.b64 || d?.image_base64 || d?.base64 || (typeof d === 'string' && !/^https?:/.test(d) ? d : null);
        if (b64) return b64.startsWith('data:') ? b64 : b64ToDataUrl(b64);
        const u = d?.url || d?.image_url || (typeof d === 'string' ? d : null);
        if (u) return urlToDataUrl(/^https?:|^data:/.test(u) ? u : base().replace(/\/v1$/, '') + u);
        throw new Error('No image came back: ' + JSON.stringify(j).slice(0, 160));
      },
      async test() { const r = await xfetch(base() + '/models', {headers: auth()}); const j = await readJson(r); if (!r.ok) throw new Error(errMsg(j, r));
        const ids = (j.data || []).map(m => m.id); P[kind].models = ids;
        let caps = '';
        if (kind !== 'openai') { try { const o = await readJson(await xfetch(base().replace(/\/v1$/, '') + '/openapi.json', {headers: auth()})); const paths = Object.keys(o.paths || {});
          if (paths.length) { const gen = paths.some(p => /images\/generations/.test(p)), edit = paths.some(p => /images\/edits/.test(p)); S.caps = {...(S.caps || {}), [kind]: {edit}}; save(S);
            caps = ` Image generation: ${gen ? 'yes' : 'NO'}. Image edits: ${edit ? 'yes' : 'no, so each stage is rendered fresh from the same camera prompt'}.`; } } catch (e) {} }
        const img = ids.filter(i => /image|flux|sd|diffus|qwen-?image|ernie/i.test(i));
        return `Connected. ${img.length ? 'Image models: ' + img.join(', ') : 'Models: ' + ids.slice(0, 10).join(', ')}.${caps}`; },
    };
  }
  P.openai = openaiLike('openai'); P.unsloth = openaiLike('unsloth'); P.custom = openaiLike('custom');
  P.fal = {
    async run({prompt, refs}) {
      const key = S.keys.fal; if (!key && !(await useProxy())) throw new Error('Add your fal.ai key in Settings.');
      const model = refs.length ? S.models.falEdit : S.models.falGen;
      const body = refs.length ? {prompt, image_url: refs[0], ...(refs.length > 1 || /nano-banana|seedream|flux-2/.test(model) ? {image_urls: refs} : {})} : {prompt, image_size: 'landscape_16_9', num_images: 1};
      const r = await xfetch('https://fal.run/' + model, {method: 'POST', headers: {'Content-Type': 'application/json', ...(key ? {Authorization: 'Key ' + key} : {})}, body: JSON.stringify(body)});
      const j = await readJson(r); if (!r.ok) throw new Error(errMsg(j, r));
      const u = j.images?.[0]?.url || j.image?.url; if (!u) throw new Error('No image came back.');
      return urlToDataUrl(u);
    },
    async test() { if (!S.keys.fal && !(await useProxy())) throw new Error('Add your fal.ai key.'); return 'Key saved. fal has no free check, so the first render confirms it.'; },
  };
  P.offline = {async run() { throw new Error('offline'); }, async test() { return 'Offline mode: the game uses the images in the images folder and shows pins for every pick.'; }};

  // ---------------------------------------------------------- cache (IndexedDB, memory fallback)
  const mem = new Map(); let dbp = null;
  function db() { if (dbp) return dbp; dbp = new Promise(res => { try { const q = indexedDB.open('moyu', 1); q.onupgradeneeded = () => q.result.createObjectStore('img'); q.onsuccess = () => res(q.result); q.onerror = () => res(null); } catch (e) { res(null); } }); return dbp; }
  async function cacheGet(k) { if (mem.has(k)) return mem.get(k); const d = await db(); if (!d) return null; return new Promise(res => { try { const q = d.transaction('img').objectStore('img').get(k); q.onsuccess = () => { if (q.result) mem.set(k, q.result); res(q.result || null); }; q.onerror = () => res(null); } catch (e) { res(null); } }); }
  async function cachePut(k, v) { mem.set(k, v); const d = await db(); if (!d) return; try { d.transaction('img', 'readwrite').objectStore('img').put(v, k); } catch (e) {} }
  async function cacheClear() { mem.clear(); const d = await db(); if (d) try { d.transaction('img', 'readwrite').objectStore('img').clear(); } catch (e) {} }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

  // a static file in /images wins over everything
  const fileCache = {};
  function fileImage(id) {
    if (id in fileCache) return fileCache[id];
    return fileCache[id] = new Promise(res => { const im = new Image(); im.onload = () => res(`images/${id}.png`); im.onerror = () => res(null); im.src = `images/${id}.png`; });
  }
  async function toDataUrl(src) { if (!src || src.startsWith('data:')) return src; try { return await blobToDataUrl(await (await fetch(src)).blob()); } catch (e) { return null; } }

  async function run(job) {
    const p = P[S.provider] || P.offline;
    const key = 'r:' + S.provider + ':' + (S.models[S.provider] || S.models.falEdit || '') + ':' + hash(job.prompt + '|' + (job.refKeys || []).join(','));
    const hit = await cacheGet(key); if (hit) return {url: hit, cached: true};
    const url = await p.run(job);
    await cachePut(key, url);
    return {url, cached: false};
  }

  window.Img = {
    NAMES, get settings() { return S; }, save, load, run, test: () => (P[S.provider] || P.offline).test(), hasServer, useProxy,
    providerModels: k => P[k]?.models || [],
    // Unsloth's API has /images/generations but no /images/edits, so it renders each stage fresh unless a test found edits
    canEdit: () => S.provider === 'unsloth' || S.provider === 'custom' ? !!S.caps?.[S.provider]?.edit : S.provider !== 'offline', fileImage, cacheGet, cachePut, cacheClear, hash, toDataUrl, isOffline: () => S.provider === 'offline',
  };
})();
