// Integration test for the public API, run against a local server that uses the JSON-file database (no MONGO_URI).
// It needs tiny limits so every limit can be hit. Start the server first (fresh `data/` folder), then run this file:
//
//   rm -rf data && AUTH_SECRET=test-secret-test-secret API_RATE_PER_MIN=1000 API_DAILY_QUOTA=60 API_MAX_KEYS=3 \
//     MAX_LINKS_PER_USER=4 CAPTCHA_PROVIDER=off HEALTH_TOKEN=hh-token npx next start -p 3120
//   node tests/api.integration.js
const fs = require('fs'); const path = require('path');
const B = process.env.BASE_URL || 'http://localhost:3120'; const DB = path.join(process.cwd(), 'data', 'db.json');
let pass = 0, failN = 0; const ok = (name, cond, extra='') => { cond ? pass++ : failN++; console.log(cond ? '✓' : '✗ FAIL', name, cond ? '' : extra); };
const jar = {};
const sess = async (path, opts = {}) => { const r = await fetch(B+path, { redirect:'manual', ...opts, headers:{ 'Content-Type':'application/json', cookie: Object.entries(jar).map(([k,v])=>k+'='+v).join('; '), ...(opts.headers||{}) } }); for (const c of r.headers.getSetCookie()) { const [kv] = c.split(';'); const [k,...v] = kv.split('='); /Max-Age=0/i.test(c) ? delete jar[k] : jar[k] = v.join('='); } let body=null; try { body = await r.json() } catch {} return { status:r.status, body, headers:r.headers, r } };
const api = async (key, path, opts = {}) => { const r = await fetch(B+'/api/v1'+path, { ...opts, headers: { ...(key ? { Authorization:'Bearer '+key } : {}), 'Content-Type':'application/json', ...(opts.headers||{}) } }); let body=null; try { body = await r.json() } catch {} return { status:r.status, body, h:(n)=>r.headers.get(n) } };
(async () => {
  const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/140.0 Safari/537.36' };
  console.log('--- setup');
  ok('register', (await sess('/api/auth/register',{method:'POST',body:JSON.stringify({name:'John Doe',email:'john@example.com',password:'password123'})})).status === 201);
  const mk = async (b) => sess('/api/account/keys', { method:'POST', body: JSON.stringify(b) });
  const rw = await mk({ name:'Full access', scopes:['links:read','links:write'], expiresInDays:null });
  ok('create key', rw.status === 201 && /^sk_smol\.[A-Za-z0-9_-]{64}$/.test(rw.body.secret), JSON.stringify(rw.body));
  const KEY = rw.body.secret;
  ok('key response never contains the hash', !JSON.stringify(rw.body.key).includes('hash'));
  ok('secret is NOT stored on disk (only its hash)', !fs.readFileSync(DB,'utf8').includes(KEY));
  const ro = await mk({ name:'Read only', scopes:['links:read'], expiresInDays:30, dailyLimit:3 });
  ok('create read-only key with daily limit 3', ro.status === 201 && ro.body.key.dailyLimit === 3);
  const qk = await mk({ name:'Quota test', scopes:['links:read'], dailyLimit:5 }); const QK = qk.body.secret;
  const fourth = await mk({ name:'Fourth', scopes:['links:read'] });
  ok('max keys per account enforced (3)', qk.status === 201 && fourth.status === 403, fourth.body?.error);
  ok('validation: no scopes rejected', (await mk({ name:'x', scopes:[] })).status === 400);
  ok('validation: junk scope ignored -> rejected', (await mk({ name:'x', scopes:['admin'] })).status === 400);
  ok('validation: daily limit above account limit rejected', (await mk({ name:'x', scopes:['links:read'], dailyLimit: 999 })).status === 400);
  const RO = ro.body.secret;

  console.log('--- authentication');
  ok('no key -> 401 unauthorized', (await api(null,'/links')).status === 401);
  const junk = await api('sk_smol.'+'a'.repeat(64), '/links'); ok('unknown (well-formed) key -> 401 invalid_key', junk.status === 401 && junk.body.error.code === 'invalid_key');
  ok('malformed key -> 401', (await api('hello','/links')).status === 401);
  const xk = await fetch(B+'/api/v1/me', { headers: { 'X-API-Key': KEY } }); ok('X-API-Key header also works', xk.status === 200);
  ok('read-only key cannot POST -> 403 insufficient_scope', (await api(RO,'/links',{method:'POST',body:JSON.stringify({url:'https://example.com'})})).body?.error?.code === 'insufficient_scope');
  const pre = await fetch(B+'/api/v1/links',{method:'OPTIONS'}); ok('CORS preflight 204 + allow-origin', pre.status === 204 && pre.headers.get('access-control-allow-origin') === '*');
  ok('session cookie alone does NOT grant API access', (await fetch(B+'/api/v1/links',{headers:{cookie:Object.entries(jar).map(([k,v])=>k+'='+v).join('; ')}})).status === 401);

  console.log('--- links CRUD');
  const c1 = await api(KEY,'/links',{method:'POST',body:JSON.stringify({url:'https://example.com/blog/launch?utm=a&b=2',slug:'Launch',title:'Launch post'})});
  ok('create with custom slug', c1.status === 201 && c1.body.data.slug === 'Launch' && c1.body.data.shortUrl === B+'/r/Launch' && c1.body.data.clicks === 0, JSON.stringify(c1.body));
  const id1 = c1.body.data.id;
  const c2 = await api(KEY,'/links',{method:'POST',body:JSON.stringify({url:'example.org'})});
  ok('create with random slug; scheme added; title from host', c2.status === 201 && /^[A-Za-z0-9]{7}$/.test(c2.body.data.slug) && c2.body.data.url === 'https://example.org/' && c2.body.data.title === 'example.org', JSON.stringify(c2.body));
  const dup = await api(KEY,'/links',{method:'POST',body:JSON.stringify({url:'https://x.dev',slug:'launch'})});
  ok('slug taken (case-insensitive) -> 409 slug_taken', dup.status === 409 && dup.body.error.code === 'slug_taken');
  ok('javascript: URL -> 400 invalid_body', (await api(KEY,'/links',{method:'POST',body:JSON.stringify({url:'javascript:alert(1)'})})).body?.error?.code === 'invalid_body');
  ok('link to our own short link -> 400 (redirect loop)', (await api(KEY,'/links',{method:'POST',body:JSON.stringify({url:B+'/r/Launch'})})).status === 400);
  ok('past expiry -> 400', (await api(KEY,'/links',{method:'POST',body:JSON.stringify({url:'https://x.dev',expiresAt:'2001-01-01T00:00:00Z'})})).status === 400);
  const g = await api(KEY,'/links/'+id1); ok('get one', g.status === 200 && g.body.data.title === 'Launch post' && !('userId' in g.body.data) && !('slugKey' in g.body.data));
  ok('get unknown -> 404', (await api(KEY,'/links/does-not-exist')).status === 404);
  ok('patch with no fields -> 400', (await api(KEY,'/links/'+id1,{method:'PATCH',body:'{}'})).status === 400);

  console.log('--- redirect + clicks');
  const r1 = await fetch(B+'/r/launch', { redirect:'manual', headers:{ ...UA, Referer:'https://news.ycombinator.com/item?id=1' } });
  ok('/r/<slug> redirects (any case) to the destination', r1.status === 307 && r1.headers.get('location') === 'https://example.com/blog/launch?utm=a&b=2', r1.status + ' ' + r1.headers.get('location'));
  await fetch(B+'/r/Launch', { redirect:'manual', headers: UA });
  await fetch(B+'/r/Launch', { redirect:'manual', headers:{ 'User-Agent':'Twitterbot/1.0' } });
  await fetch(B+'/r/Launch', { redirect:'manual', headers:{ ...UA, 'Sec-Purpose':'prefetch' } });
  await new Promise(r => setTimeout(r, 500));
  const st = await api(KEY,'/links/'+id1+'/stats?days=7');
  ok('stats: 2 human clicks (bot + prefetch ignored), 7 days, sources', st.status === 200 && st.body.data.total === 2 && st.body.data.days.length === 7 && st.body.data.days[6].count === 2 && st.body.data.referrers.some(r => r.source === 'news.ycombinator.com') && st.body.data.referrers.some(r => r.source === 'direct'), JSON.stringify(st.body));
  ok('stats: bad days -> 400', (await api(KEY,'/links/'+id1+'/stats?days=5')).status === 400);
  ok('unknown slug -> 404 page', (await fetch(B+'/r/nope-nope', { redirect:'manual', headers: UA })).status === 404);

  const p1 = await api(KEY,'/links/'+id1,{method:'PATCH',body:JSON.stringify({enabled:false})}); ok('pause', p1.status === 200 && p1.body.data.enabled === false);
  const off = await fetch(B+'/r/Launch', { redirect:'manual', headers: UA }); ok('paused link shows a page instead of redirecting', off.status === 200 && (await off.text()).includes('turned off'));
  const p2 = await api(KEY,'/links/'+id1,{method:'PATCH',body:JSON.stringify({enabled:true,slug:'spring'})}); ok('rename slug + turn on', p2.status === 200 && p2.body.data.slug === 'spring');
  ok('old slug is free / 404 now, new one redirects', (await fetch(B+'/r/Launch',{redirect:'manual',headers:UA})).status === 404 && (await fetch(B+'/r/spring',{redirect:'manual',headers:UA})).status === 307);

  console.log('--- list, filter, sort');
  const l = await api(RO,'/links?sort=clicks'); ok('list sorted by clicks (via read-only key)', l.status === 200 && l.body.total === 2 && l.body.data[0].id === id1);
  ok('search q=example.org', (await api(KEY,'/links?q=example.org')).body.data[0]?.id === c2.body.data.id);
  ok('bad state -> 400', (await api(KEY,'/links?state=gone')).status === 400);
  await api(KEY,'/links/'+c2.body.data.id,{method:'PATCH',body:JSON.stringify({enabled:false})});
  ok('state=disabled', (await api(KEY,'/links?state=disabled')).body.total === 1);
  const lim = await api(KEY,'/links?limit=1&offset=1'); ok('pagination limit/offset', lim.body.data.length === 1 && lim.body.total === 2 && lim.body.limit === 1 && lim.body.offset === 1);

  console.log('--- account link limit (4)');
  await api(KEY,'/links',{method:'POST',body:JSON.stringify({url:'https://three.dev'})}); await api(KEY,'/links',{method:'POST',body:JSON.stringify({url:'https://four.dev'})});
  const over = await api(KEY,'/links',{method:'POST',body:JSON.stringify({url:'https://five.dev'})}); ok('5th link via API -> 403 link_limit_reached', over.status === 403 && over.body.error.code === 'link_limit_reached');
  const web = await sess('/api/links',{method:'POST',body:JSON.stringify({url:'https://five.dev'})}); ok('5th link via the web app is limited too', web.status === 403, JSON.stringify(web.body));
  ok('delete -> 204', (await api(KEY,'/links/'+c2.body.data.id,{method:'DELETE'})).status === 204);
  ok('deleted link is gone from the API', (await api(KEY,'/links/'+c2.body.data.id)).status === 404);
  ok('after a delete there is room again', (await api(KEY,'/links',{method:'POST',body:JSON.stringify({url:'https://five.dev'})})).status === 201);

  console.log('--- web app undo');
  const wl = await sess('/api/links'); const w1 = wl.body.links.find(x => x.slug === 'spring');
  ok('web list returns links + 14-day click trends', wl.status === 200 && wl.body.daily.length === 14 && wl.body.spark[w1.id].length === 14 && wl.body.spark[w1.id][13] === w1.clicks && w1.clicks === 3, JSON.stringify(wl.body.daily)); // 2 earlier clicks + the /r/spring check
  await sess('/api/links/'+w1.id,{method:'DELETE'});
  const rs = await sess('/api/links/'+w1.id+'/restore',{method:'POST'});
  ok('undo restores a deleted link with its click history', rs.status === 200 && rs.body.link.clicks === 3 && (await api(KEY,'/links/'+id1+'/stats?days=7')).body.data.days[6].count === 3);
  ok('slug check: taken / free / invalid', (await sess('/api/links/slug?slug=SPRING')).body.available === false && (await sess('/api/links/slug?slug=brand-new')).body.available === true && (await sess('/api/links/slug?slug=no%20way')).body.valid === false);

  const me = await api(KEY,'/me'); ok('/me', me.body.user.email === 'john@example.com' && me.body.links.limit === 4 && me.body.links.count === 4 && me.body.limits.requestsPerMinute === 1000 && !JSON.stringify(me.body).includes('hash'), JSON.stringify(me.body));
  const us = await api(KEY,'/usage'); ok('/usage has 7 days and counts today', us.body.last7Days.length === 7 && us.body.today.used > 10 && us.body.today.limit === 60, JSON.stringify(us.body.today));

  console.log('--- quotas');
  const qs = []; for (let i = 0; i < 7; i++) qs.push(await api(QK,'/me'));
  ok('per-key daily limit (5): calls 1-5 ok, 6th -> 429 quota_exceeded', qs.slice(0,5).every(r => r.status === 200) && qs[5].status === 429 && qs[5].body.error.code === 'quota_exceeded', qs.map(r=>r.status).join());
  ok('quota 429 carries Retry-After and zero remaining', Number(qs[5].h('retry-after')) > 0 && qs[5].h('x-quota-remaining') === '0' && qs[5].h('x-quota-limit') === '5');
  ok('quota headers count down', qs[0].h('x-quota-remaining') === '4' && qs[3].h('x-quota-remaining') === '1');
  const r2 = await api(RO,'/links'), r3 = await api(RO,'/links'), r4 = await api(RO,'/links');
  ok('another key with limit 3: 4th request refused (limits are per key)', [r2.status, r3.status].every(s => s === 200) && r4.status === 429 && r4.body.error.code === 'quota_exceeded', [r2.status,r3.status,r4.status].join());
  ok('the full-access key is unaffected by the others', (await api(KEY,'/me')).status === 200);
  const list0 = await sess('/api/account/keys'); const roId = list0.body.keys.find(k => k.name === 'Read only').id;
  const uRo = list0.body.keys.find(k => k.name === 'Read only').usage; ok('management list shows usage for a key at its limit', uRo.today >= 3 && uRo.limit === 3 && uRo.days.length === 7);
  ok('delete a key', (await sess('/api/account/keys/'+roId,{method:'DELETE'})).status === 200);
  ok('deleted key stops working immediately', (await api(RO,'/links')).status === 401);
  const FR = QK;

  console.log('--- expiry');
  const d = JSON.parse(fs.readFileSync(DB,'utf8')); const fk = d.apiKeys.find(k => k.name === 'Full access'); fk.expiresAt = new Date(Date.now()-1000).toISOString(); fs.writeFileSync(DB, JSON.stringify(d));
  const ex = await api(KEY,'/me'); ok('expired key -> 401 key_expired', ex.status === 401 && ex.body.error.code === 'key_expired');

  console.log('--- management API (session)');
  const gl = await sess('/api/account/keys'); ok('list keys shows usage + limits, no hashes', gl.status === 200 && gl.body.keys.every(k => k.usage && !('hash' in k)) && gl.body.limits.keys === 3);
  ok('management needs a session (API key is not enough)', (await fetch(B+'/api/account/keys',{headers:{Authorization:'Bearer '+FR}})).status === 401);

  console.log('--- misc');
  const spec = await (await fetch(B+'/api/v1/openapi.json')).json(); ok('openapi.json: 3.1 with paths', spec.openapi === '3.1.0' && Object.keys(spec.paths).length === 5 && !!spec.components.schemas.Link);
  const h1 = await (await fetch(B+'/api/health')).json(); ok('health: public, no db', h1.ok === true && typeof h1.coldStart === 'boolean' && !('db' in h1));
  ok('health deep without token -> 404', (await fetch(B+'/api/health?deep=1')).status === 404);
  const h2 = await (await fetch(B+'/api/health?deep=1',{headers:{Authorization:'Bearer hh-token'}})).json(); ok('health deep with token reports db timings', h2.db?.kind === 'file' && h2.db.roundTripMs.length === 3, JSON.stringify(h2));
  const docs = await fetch(B+'/docs'); const dt = await docs.text(); ok('/docs renders (public) with endpoints', docs.status === 200 && dt.includes('/api/v1/links') && dt.includes('Authentication'));
  // SSR: the home page already contains the user's links (no client fetch needed)
  const home = await (await fetch(B+'/', { headers:{ cookie:Object.entries(jar).map(([k,v])=>k+'='+v).join('; ') } })).text();
  ok('home page HTML already includes the user\'s links (no client waterfall)', home.includes('/r/<!-- -->spring') || home.includes('/r/spring'));
  console.log('--- account deletion cascades');
  await sess('/api/account',{method:'DELETE',body:JSON.stringify({confirm:'john@example.com',password:'password123'})});
  const after = JSON.parse(fs.readFileSync(DB,'utf8')); ok('keys, usage, links and click data removed with the account', after.apiKeys.length === 0 && after.apiUsage.length === 0 && after.links.length === 0 && after.clickDays.length === 0 && after.clickSources.length === 0, JSON.stringify({k:after.apiKeys.length,u:after.apiUsage.length}));
  console.log(`\n${pass} passed, ${failN} failed`); process.exit(failN ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
