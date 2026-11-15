// 이력서 PDF 만들기: scripts/cv/template.html에 assets/portfolio/stats.json 수치를 넣어 PDF를 만든다.
//   쓰는 법: node scripts/build-cv.mjs <출력 폴더>
//   Chrome 경로는 CHROME_PATH (없으면 google-chrome). 결과 PDF는 저장소에 두지 않는다.
//   내용은 위에서 아래로 흐르고 쪽은 Chrome이 나눈다. 쪽 수가 MAX_PAGES를 넘거나 글꼴이 없으면 실패한다.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const MAX_PAGES = 3; // 평소 2쪽. 2쪽을 넘으면 경고만 하고 3쪽을 넘으면 실패
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) { console.error('usage: node scripts/build-cv.mjs <out-dir>'); process.exit(2); }
const out = path.resolve(process.argv[2]);
fs.mkdirSync(out, { recursive: true });

const stats = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/portfolio/stats.json'), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const missing = new Set();
const html = fs.readFileSync(path.join(ROOT, 'scripts/cv/template.html'), 'utf8')
  .replace(/(<span data-stat="([\w.]+)">)([^<]*)(<\/span>)/g, (m, open, key, old, close) => (key in stats ? open + esc(stats[key]) + close : (missing.add(key), m)));
if (missing.size) console.log(`::warning::stats.json에 없어 템플릿 값을 그대로 쓴 키: ${[...missing].join(', ')}`);

const date = (stats['jelly.asof'] || new Date().toISOString().slice(0, 10)).replaceAll('.', '-');
const name = `전은배_이력서_AI_Native_SW_Engineer_${date}.pdf`;
const footer = `<div style="width:100%;padding:0 15mm;display:flex;justify-content:space-between;font-family:sans-serif;font-size:7pt;color:#7b818c">
  <span>AI Native Software Engineer · flashattention.github.io</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'google-chrome', args: ['--no-sandbox'] });
try {
  const htmlPath = path.join(out, name.replace(/\.pdf$/, '.html'));
  fs.writeFileSync(htmlPath, html);
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (!(await page.evaluate(() => document.fonts.check('700 12px "Pretendard"')))) throw new Error('웹 글꼴을 못 불러옴: Pretendard');
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ path: path.join(out, name), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer });
  fs.unlinkSync(htmlPath);
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages > MAX_PAGES) throw new Error(`${name}: ${pages}쪽 (최대 ${MAX_PAGES}쪽)`);
  if (pages > 2) console.log(`::warning::이력서가 ${pages}쪽입니다. scripts/cv/template.html 내용을 줄여 주세요.`);
  console.log(`built ${name} (${pages}쪽)`);
} finally {
  await browser.close();
}
