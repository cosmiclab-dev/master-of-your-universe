// Vercel function: forwards image requests to the providers. Keys can live in Vercel env vars
// (GEMINI_API_KEY, OPENAI_API_KEY, FAL_KEY) so players never see them.
const ALLOW = [/^generativelanguage\.googleapis\.com$/, /^api\.openai\.com$/, /^fal\.run$/, /(^|\.)fal\.media$/, /(^|\.)fal\.ai$/, /^api\.cloudflare\.com$/, /^image\.pollinations\.ai$/,
  ...(process.env.PROXY_EXTRA_HOSTS || '').split(',').filter(Boolean).map(h => new RegExp('^' + h.trim().replace(/\./g, '\\.') + '$'))];
const ENV = {
  'generativelanguage.googleapis.com': ['x-goog-api-key', process.env.GEMINI_API_KEY],
  'api.openai.com': ['Authorization', process.env.OPENAI_API_KEY && 'Bearer ' + process.env.OPENAI_API_KEY],
  'fal.run': ['Authorization', process.env.FAL_KEY && 'Key ' + process.env.FAL_KEY],
  'api.cloudflare.com': ['Authorization', process.env.CLOUDFLARE_API_TOKEN && 'Bearer ' + process.env.CLOUDFLARE_API_TOKEN],
};
export const config = { maxDuration: 60 };
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let { url, method = 'GET', headers = {}, body64 } = req.body || {};
  if (url && url.includes('{account}')) url = url.replace('{account}', process.env.CLOUDFLARE_ACCOUNT_ID || '');
  let host; try { host = new URL(url).hostname; } catch { return res.status(400).json({ error: 'bad url' }); }
  if (!ALLOW.some(r => r.test(host))) return res.status(403).json({ error: `${host} is not allowed. Add it to PROXY_EXTRA_HOSTS.` });
  const h = Object.fromEntries(Object.entries(headers).filter(([, v]) => v));
  const env = ENV[host];
  if (env && env[1] && !Object.keys(h).some(k => /^(authorization|x-goog-api-key)$/i.test(k))) h[env[0]] = env[1];
  const r = await fetch(url, { method, headers: h, body: body64 ? Buffer.from(body64, 'base64') : undefined });
  const buf = Buffer.from(await r.arrayBuffer());
  res.status(r.status).setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
  return res.send(buf);
}
