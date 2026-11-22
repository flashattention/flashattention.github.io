// 프로젝트 저장소에서 사이트 수치를 다시 계산해 index.html과 assets/portfolio/stats.json을 고친다.
//   쓰는 법: node scripts/update-stats.mjs <jelly-city> <agent-lab> <latent-atlas>
//   HTML의 <span data-stat="키">값</span> 내용과 data-tpl="…{키}…"가 붙은 태그의 content 속성을 바꾼다.
//   어떤 값을 못 구하면 경고만 내고 그 키는 기존 값을 그대로 둔다.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [JELLY, AGENT, ATLAS] = process.argv.slice(2).map((p) => path.resolve(p));
if (!ATLAS) { console.error('usage: node scripts/update-stats.mjs <jelly-city> <agent-lab> <latent-atlas>'); process.exit(2); }

const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');
const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, TZ: 'Asia/Seoul' } });
const num = (n) => n.toLocaleString('en-US');
const warn = (msg) => console.log(`::warning::${msg}`);
const stats = {};
const put = (group, fn) => { try { Object.assign(stats, Object.fromEntries(Object.entries(fn()).map(([k, v]) => [`${group}.${k}`, String(v)]))); } catch (e) { warn(`${group}: ${e.message}`); } };

// ---------- 젤리 게임즈 ----------
put('jelly', () => {
  // 허브 첫 화면의 게임 카드 (서울 산책은 드림 러너 안의 맵이라 뺀다)
  const games = new Set([...read(JELLY, 'public/index.html').matchAll(/<a class="card[^"]*" href="\/([^/"]+)\/"/g)].map((m) => m[1]).filter((g) => g !== 'seoul-walk'));
  if (games.size < 10) throw new Error(`게임 카드 ${games.size}개만 찾음`);
  const dates = git(JELLY, 'log', '--format=%ad', '--date=format-local:%Y-%m-%d').trim().split('\n');
  const last = dates[0], first = dates[dates.length - 1];
  const days = Math.round((Date.parse(last) - Date.parse(first)) / 864e5) + 1;
  const bodies = git(JELLY, 'log', '--format=%B%x00').split('\0').filter((b) => b.trim());
  const agent = bodies.filter((b) => /co-authored-by:[^\n]*claude/i.test(b)).length;
  const files = git(JELLY, 'ls-files', '-z').split('\0').filter((f) => /\.(m|c)?js$/.test(f) && !f.includes('node_modules/'));
  let lines = 0; for (const f of files) { const s = fs.readFileSync(path.join(JELLY, f), 'utf8'); for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) lines++; }
  return { games: games.size, days, commits: num(bodies.length), agent: num(agent), asof: last.replaceAll('-', '.'), lines: num(Math.floor(lines / 1000) * 1000) };
});
put('jelly', () => { // 운영 지표 문서 (tools/metrics.mjs로 뽑아 커밋한 값)
  const md = read(JELLY, 'docs/metrics.md');
  const d = md.match(/(\d{4})-(\d{2})-(\d{2}) 기준/), pl = md.match(/판수[^|\n]*\|\s*([\d,]+)판\s*·\s*([\d.]+)시간/), lb = md.match(/순위표에 기록이 있는 사람\s*\|\s*(\d+)명\s*\(로그인 없이 남긴 기록 (\d+)명/);
  if (!d || !pl || !lb) throw new Error('docs/metrics.md 형식이 바뀜');
  return { mdate: `${d[1]}.${d[2]}.${d[3]}`, mday: `${+d[2]}월 ${+d[3]}일`, plays: pl[1], hours: pl[2], lbTotal: lb[1], lbGuest: lb[2], lbPct: `${Math.round((lb[2] / lb[1]) * 100)}%` };
});

// ---------- 젤리 서울 러너 (지도 파일에서 직접 센다) ----------
put('seoul', () => {
  const D = path.join(JELLY, 'public/dream-runner');
  const S = JSON.parse(read(D, 'hangang/seoul.json')), U = S.unit || 10;
  const rings = S.gu.flatMap((g) => g.rings.map((r) => r.map((v) => v * U)));
  const boxes = rings.map((r) => { let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity; for (let i = 0; i < r.length; i += 2) { a = Math.min(a, r[i]); b = Math.max(b, r[i]); c = Math.min(c, r[i + 1]); d = Math.max(d, r[i + 1]); } return [a, b, c, d]; });
  const inRing = (x, z, r) => { let c = false; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) { const xi = r[i], zi = r[i + 1], xj = r[j], zj = r[j + 1]; if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
  const inSeoul = (x, z) => rings.some((r, k) => { const b = boxes[k]; return x >= b[0] && x <= b[1] && z >= b[2] && z <= b[3] && inRing(x, z, r); });
  const idx = JSON.parse(read(D, 'seoul/index.json'));
  let buildings = 0, shops = 0;
  for (const [i, j] of idx.have) {
    const t = JSON.parse(read(D, `seoul/t_${i}_${j}.json`));
    const ins = t.buildings.map((b) => inSeoul(b[7] / 10, b[8] / 10)); // 좌표는 0.1m 단위, 외곽선 첫 점 기준
    buildings += ins.filter(Boolean).length;
    for (const s of t.shops2 || []) if (ins[s[2]]) shops++;
  }
  if (buildings < 1e5) throw new Error(`건물 ${buildings}채만 셈`);
  const man = (n) => `${Math.floor(n / 1e4)}만`;
  return { gu: S.gu.length, tiles: idx.have.length, buildings: man(buildings), shops: man(shops) };
});

// ---------- AgentLab ----------
put('agentlab', () => {
  const L = path.join(AGENT, 'frontend/content/learn');
  const modules = fs.readdirSync(L, { withFileTypes: true }).filter((d) => d.isDirectory());
  const lessons = modules.reduce((n, m) => n + fs.readdirSync(path.join(L, m.name), { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(L, m.name, d.name, 'lesson.md'))).length, 0);
  const pat = read(AGENT, 'frontend/src/lib/playground/patterns.ts').split('export const PATTERNS')[1] || '';
  const patterns = (pat.match(/^ {4}id: "/gm) || []).length;
  if (!lessons || !patterns) throw new Error('강의나 패턴을 못 찾음');
  return { modules: modules.length, lessons, patterns };
});

// ---------- Latent Atlas ----------
put('atlas', () => {
  const reg = read(ATLAS, 'src/registry.js'), [catPart, itemPart = ''] = reg.split(/\bitems\s*:/);
  const cats = [...catPart.matchAll(/\['([a-z0-9]+)','[^']+'\]/g)].map((m) => m[1]);
  const items = [...itemPart.matchAll(/^\['[^']+','([a-z0-9]+)'/gm)].map((m) => m[1]);
  const langs = fs.readdirSync(path.join(ATLAS, 'content/terms')).filter((f) => /^[a-z]{2}\.json$/.test(f)).length;
  if (!items.length) throw new Error('registry.js 형식이 바뀜');
  const app = (c) => c.startsWith('z');
  return { concepts: items.filter((c) => !app(c)).length, chapters: cats.filter((c) => !app(c)).length, terms: items.filter(app).length, termChapters: cats.filter(app).length, langs };
});

// ---------- 페이지에 반영 ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
let changed = 0;
for (const rel of ['index.html']) {
  const file = path.join(ROOT, rel), before = fs.readFileSync(file, 'utf8');
  const missing = new Set();
  let html = before.replace(/(<span data-stat="([\w.]+)">)([^<]*)(<\/span>)/g, (m, open, key, old, close) => (key in stats ? open + esc(stats[key]) + close : (missing.add(key), m)));
  html = html.replace(/<[^>]*\sdata-tpl="([^"]*)"[^>]*>/g, (tag, tpl) => {
    let ok = true;
    const text = tpl.replace(/\{([\w.]+)\}/g, (m, key) => (key in stats ? stats[key] : ((ok = false), missing.add(key), m)));
    return ok ? tag.replace(/\scontent="[^"]*"/, ` content="${esc(text)}"`) : tag;
  });
  if (missing.size) warn(`${rel}: 값이 없어 그대로 둔 키 ${[...missing].join(', ')}`);
  if (html !== before) { fs.writeFileSync(file, html); changed++; console.log(`updated ${rel}`); }
}
const out = path.join(ROOT, 'assets/portfolio/stats.json'), json = JSON.stringify(stats, null, 2) + '\n';
if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== json) { fs.writeFileSync(out, json); changed++; }
console.log(JSON.stringify(stats, null, 2));
console.log(changed ? 'changed' : 'no change');
