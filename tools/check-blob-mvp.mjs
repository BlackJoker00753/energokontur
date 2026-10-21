// Открывает MVP из автономного файла (blob:) в новой вкладке и пробует нажимать навигацию и кнопки.
import { Browser, sleep } from 'file:///C:/Users/o.raiganiyev/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { pathToFileURL } from 'node:url';
const b = await Browser.launch({ width: 1440, height: 900 }); const p = await b.newPage({ width: 1440, height: 900 });
await p.goto(pathToFileURL(process.argv[2]).href, { settleMs: 2500 });
const href = await p.eval(`document.querySelector('[data-mvp]').href`);
console.log('href', href.slice(0, 20));
const q = await b.newPage({ width: 1440, height: 900 });
await q.goto(href, { settleMs: 1500 });
const r = await q.eval(`(async()=>{const o={url:location.href.slice(0,20),title:document.title,h1:document.querySelector('h1')?.textContent};
 const a=document.querySelector('.nav a[data-r=economics]'); a.click(); await new Promise(r=>setTimeout(r,800)); o.econ=document.querySelector('h1')?.textContent; document.querySelector('.nav a[data-r=circuits]').click(); await new Promise(r=>setTimeout(r,500)); document.querySelector('[data-sel="1"]').click(); await new Promise(r=>setTimeout(r,500)); document.querySelector('[data-act=repair]').click(); await new Promise(r=>setTimeout(r,500));
 o.afterNav={hash:location.hash,h1:document.querySelector('h1')?.textContent};
 document.querySelector('#themeBtn').click(); await new Promise(r=>setTimeout(r,300)); o.theme=document.documentElement.dataset.theme||'dark';
 try{localStorage.getItem('x');o.ls='ok'}catch(e){o.ls=String(e).slice(0,80)}
 return o})()`);
console.log(JSON.stringify(r, null, 1)); console.log('errors', JSON.stringify(q.consoleErrors));
await q.screenshot({ path: '.taste-skill/blob-mvp.jpg', quality: 70 }); await b.close();
