// Проверка автономного HTML: node tools/check-mail.mjs <path.html> — шрифты, логотип, MVP в iframe, оба ролика.
import { Browser, sleep } from 'file:///C:/Users/o.raiganiyev/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { pathToFileURL } from 'node:url';
const url = pathToFileURL(process.argv[2]).href;
const b = await Browser.launch({ width: 1600, height: 900 }); const p = await b.newPage({ width: 1600, height: 900 });
await p.goto(url, { settleMs: 3000 });
const r = await p.eval(`(async()=>{
  await document.fonts.ready;
  const out={url:location.protocol, manrope:document.fonts.check('600 20px Manrope'), logo:document.querySelector('.chrome img').naturalWidth, mvpUrl:String(window.MVP_URL).slice(0,5)};
  const f=document.getElementById('mvpFrame'); await new Promise(r=>setTimeout(r,1500));
  try{out.mvpTitle=f.contentDocument.title; out.mvpH1=f.contentDocument.querySelector('h1')?.textContent}catch(e){out.mvpErr=String(e)}
  for(const id of ['v1','v2']){DECK.show(id==='v1'?1:2); await new Promise(r=>setTimeout(r,800)); document.querySelector('[data-play='+id+']').click(); const v=document.getElementById(id); await new Promise(r=>{if(v.readyState>=1)r();else v.addEventListener('loadedmetadata',r,{once:true});setTimeout(r,8000)}); await new Promise(r=>setTimeout(r,1500)); out[id]={dur:Math.round(v.duration), t:+v.currentTime.toFixed(1), w:v.videoWidth, fit:getComputedStyle(v).objectFit, src:v.src.slice(0,5)}; v.pause()}
  out.links=[...document.querySelectorAll('.links a')].map(a=>a.href);
  return out})()`);
console.log(JSON.stringify(r, null, 1)); await p.screenshot({ path: process.argv[2].replace(/\.html$/, '.jpg'), quality: 70 });
console.log('errors', JSON.stringify(p.consoleErrors)); await b.close();
