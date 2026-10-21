// Кадры MVP для ролика «Идея»: node shots.mjs → composition/assets/img/mvp-*.png (1920×1200)
import { Browser, sleep } from 'file:///C:/Users/o.raiganiyev/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { pathToFileURL } from 'node:url';
const url = pathToFileURL(process.cwd() + '/../../energokontur.html').href;
const b = await Browser.launch({ width: 1440, height: 900 }); const p = await b.newPage({ width: 1440, height: 900 });
await p.setViewport({ width: 1440, height: 900, dsf: 4 / 3 });
await p.goto(url + '#/overview', { settleMs: 1200 });
await p.screenshot({ path: 'composition/assets/img/mvp-overview.png', format: 'png' });
await p.eval(`(()=>{location.hash='#/circuits/EC-01';EK.act(0,'repair');for(const k of ['meter','comparable','system'])EK.setCheck(0,k,true);EK.act(0,'technical');EK.setCheck(0,'variable',true);EK.act(0,'accept');document.getElementById('toast').classList.remove('on');return 1})()`);
await sleep(2200);
await p.screenshot({ path: 'composition/assets/img/mvp-accepted.png', format: 'png' });
await b.close(); console.log('ok');
