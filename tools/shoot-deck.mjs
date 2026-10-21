// Скриншоты всех слайдов презентации: node tools/shoot-deck.mjs [url] → .taste-skill/deck/s1..s7.jpg
import { Browser, sleep } from 'file:///C:/Users/o.raiganiyev/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync } from 'node:fs'; import { pathToFileURL } from 'node:url';
const url = process.argv[2] || pathToFileURL(process.cwd() + '/presentation/index.html').href, W = +(process.env.W || 1920), H = +(process.env.H || 1080);
mkdirSync('.taste-skill/deck', { recursive: true });
const b = await Browser.launch({ width: W, height: H }); const p = await b.newPage({ width: W, height: H });
await p.goto(url, { settleMs: 2500 });
const n = await p.eval('DECK.N');
for (let i = 0; i < n; i++) { await p.eval(`DECK.show(${i})`); await sleep(2600); await p.screenshot({ path: `.taste-skill/deck/s${i + 1}${process.env.W ? '-' + W : ''}.jpg`, quality: 82 }) }
console.log('errors', JSON.stringify(p.consoleErrors)); await b.close();
