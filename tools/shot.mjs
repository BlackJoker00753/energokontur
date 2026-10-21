// node tools/shot.mjs <url> <out.png> [w] [h]
import { Browser, sleep } from 'file:///C:/Users/o.raiganiyev/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const [url, out, w = 1440, h = 900] = process.argv.slice(2);
const b = await Browser.launch({ width: +w, height: +h }); const p = await b.newPage({ width: +w, height: +h });
await p.goto(url); await sleep(1200); await p.screenshot({ path: out }); await b.close(); console.log(out);
