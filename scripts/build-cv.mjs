// 이력서 PDF 만들기: scripts/cv/template.html에 assets/portfolio/stats.json 수치를 넣어 검정·흰 배경 PDF 두 개를 만든다.
//   쓰는 법: node scripts/build-cv.mjs <출력 폴더>
//   Chrome 경로는 CHROME_PATH (없으면 google-chrome). 결과 PDF는 저장소에 두지 않는다.
//   어느 쪽이든 내용이 A4를 넘치면 실패한다 (깨진 PDF를 보내지 않기 위해).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] || '');
if (!process.argv[2]) { console.error('usage: node scripts/build-cv.mjs <out-dir>'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

const stats = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/portfolio/stats.json'), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const missing = new Set();
const filled = fs.readFileSync(path.join(ROOT, 'scripts/cv/template.html'), 'utf8')
  .replace(/(<span data-stat="([\w.]+)">)([^<]*)(<\/span>)/g, (m, open, key, old, close) => (key in stats ? open + esc(stats[key]) + close : (missing.add(key), m)));
if (missing.size) console.log(`::warning::stats.json에 없어 템플릿 값을 그대로 쓴 키: ${[...missing].join(', ')}`);

const date = (stats['jelly.asof'] || new Date().toISOString().slice(0, 10)).replaceAll('.', '-');
const variants = [
  { name: `전은배_이력서_AI_Native_SW_Engineer_${date}.pdf`, html: filled.replace('<html lang="ko">', '<html lang="ko" class="dark">') },
  { name: `전은배_이력서_AI_Native_SW_Engineer_흰배경_${date}.pdf`, html: filled },
];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'google-chrome', args: ['--no-sandbox'] });
try {
  for (const v of variants) {
    const htmlPath = path.join(out, v.name.replace(/\.pdf$/, '.html'));
    fs.writeFileSync(htmlPath, v.html);
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() => ['Pretendard', 'Hahmlet', 'Jua', 'JetBrains Mono'].filter((f) => !document.fonts.check(`12px "${f}"`)));
    if (fonts.length) throw new Error(`웹 글꼴을 못 불러옴: ${fonts.join(', ')}`);
    const over = await page.evaluate(() => [...document.querySelectorAll('.page')].map((p) => p.scrollHeight - p.clientHeight));
    if (over.some((n) => n > 0)) throw new Error(`${v.name}: 쪽 넘침 ${over.join(', ')}px`);
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: path.join(out, v.name), preferCSSPageSize: true, printBackground: true });
    await page.close();
    fs.unlinkSync(htmlPath);
    console.log(`built ${v.name} (${over.length}쪽)`);
  }
} finally {
  await browser.close();
}
