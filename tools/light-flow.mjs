import { Browser, sleep } from 'file:///C:/Users/o.raiganiyev/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { pathToFileURL } from 'node:url';
const b = await Browser.launch({ width: 1440, height: 900 }); const p = await b.newPage({ width: 1440, height: 900 });
await p.goto(pathToFileURL(process.cwd() + '/energokontur.html').href + '?theme=light#/circuits/EC-01', { settleMs: 800 });
await p.eval(`(()=>{EK.act(0,'repair');for(const k of ['meter','comparable','system'])EK.setCheck(0,k,true);EK.act(0,'technical');document.getElementById('toast').classList.remove('on');return 1})()`); await sleep(1800);
await p.screenshot({ path: '.taste-skill/light-ec01.jpg', quality: 80 });
await p.eval(`location.hash='#/economics'`); await sleep(600); await p.screenshot({ path: '.taste-skill/light-econ.jpg', quality: 80 });
console.log('errors', JSON.stringify(p.consoleErrors)); await b.close();
