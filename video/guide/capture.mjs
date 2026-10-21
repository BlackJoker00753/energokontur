// Видео-инструкция: покадровая запись MVP (вьюпорт 1440×810 при масштабе 4/3 → кадр 1920×1080, 30 к/с)
// с курсором и кликами. Время кадра = время озвучки (vo/timing.json), действия привязаны к словам.
// CSS-анимации идут по виртуальному времени кадров, поэтому скорость в ролике совпадает с реальной.
// node capture.mjs  →  frames/f00000.jpg … , screen.mp4, clicks.json
import { Browser, sleep } from 'file:///C:/Users/o.raiganiyev/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const BASE = process.env.BASE || pathToFileURL(process.cwd() + '/../../energokontur.html').href;
const W = 1440, H = 810, FPS = 30, TAIL = 1.2;
const T = JSON.parse(readFileSync('vo/timing.json', 'utf8'));
const seg = id => T.find(s => s.id === id);
const word = (id, re, k = 0) => { const s = seg(id); const w = s.words.filter(w => re.test(w[2]))[k]; if (!w) throw new Error('word ' + re + ' in ' + id); return w[0] };
const END = T[T.length - 1].end + TAIL;

const b = await Browser.launch({ width: W, height: H }); const p = await b.newPage({ width: W, height: H });
await p.setViewport({ width: W, height: H, dsf: 4 / 3 });
await p.goto(BASE + '#/overview', { settleMs: 1200 });
await p.eval(`(()=>{window.EK_TOAST_MS=1e9;EK.reset();scrollTo(0,0);
const c=document.createElement('div');c.id='fakeCursor';c.innerHTML='<svg width="26" height="26" viewBox="0 0 28 28"><path d="M4 2l18 11-8 2-4 8z" fill="#fff" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/></svg>';c.style.cssText='position:fixed;left:0;top:0;z-index:99999;pointer-events:none;transform:translate(-4px,-2px)';
const r=document.createElement('div');r.id='fakeRipple';r.style.cssText='position:fixed;z-index:99998;pointer-events:none;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;border:3px solid #ff8a1f;opacity:0';document.body.append(r,c);return 1})()`);

// ---- курсор, клики, прокрутка
let cx = 980, cy = 520, tw = null, ripple = -1, sv = null, svFrom = 0, toastAt = -1;
const clicks = [];
const rect = sel => p.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height}})()`);
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const moveTo = (x, y, dur = .7) => { tw = { x0: cx, y0: cy, x1: Math.max(6, Math.min(W - 6, x)), y1: Math.max(6, Math.min(H - 6, y)), f0: frame, n: Math.max(1, Math.round(dur * FPS)) } };
const mouse = (type, x, y) => p.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
const click = async () => { await mouse('mousePressed', cx, cy); await mouse('mouseReleased', cx, cy); ripple = 0; clicks.push(+(frame / FPS).toFixed(2)); toastAt = frame };
const scrollY = () => p.eval('scrollY');
const scrollTo = async (y, dur = .5) => { svFrom = await scrollY(); sv = { f0: frame, n: Math.round(dur * FPS), y: Math.max(0, y) } };
// показать элемент целиком (прокрутка окна), затем навести курсор
const reveal = async (sel, pad = 70) => { const r = await rect(sel); if (!r) return; const y0 = await scrollY(); if (r.y + r.h > H - pad) await scrollTo(y0 + r.y + r.h - H + pad + 20); else if (r.y < 80) await scrollTo(y0 + r.y - 100) };
const point = async (sel, fx = .5, fy = .5, dur = .7) => { const r = await rect(sel); if (!r) { console.log('нет элемента', sel); return } moveTo(r.x + r.w * fx, r.y + r.h * fy, dur) };
const A = [];
const at = (t, fn) => A.push([t, fn]);
const S = id => seg(id).start;
// навести → (через dt) кликнуть; элемент заранее прокручивается в зону видимости
const press = (t, sel, lead = .75, fx = .5, fy = .5) => {
  at(t - lead - .65, () => reveal(sel)); at(t - lead, () => point(sel, fx, fy, .6));
  at(t, async () => { const r = await rect(sel); if (r && !(cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h)) { cx = r.x + r.w * fx; cy = r.y + r.h * fy; tw = null; await mouse('mouseMoved', cx, cy); console.log('поправка курсора', sel, (frame / FPS).toFixed(2)) } await click() });
};

// g1 · обзор
at(.3, () => point('.kpis > div:first-child b', .3, .5, 1));
at(word('g1', /^сколько/) - .2, () => point('.kpis > div:first-child b', .5, .5, .5));
at(word('g1', /^ждёт/) - .2, () => point('.kpis > div:nth-child(3) b', .4, .5, .6));
at(word('g1', /^Тепловая/) - .2, () => point('.hm-row:nth-child(2) .heat-strip', .25, .5, .8));
at(word('g1', /^ярче/) - .2, () => point('.hm-row:nth-child(2) .heat-strip', .42, .5, .6));
// g2 · контур EC-01
press(S('g2') + .5, '.titlerow .btn.primary');
at(word('g2', /^маршрут/) - .2, () => point('.route li:nth-child(2)', .3, .5, .7));
at(word('g2', /^деньги/) - .1, () => point('.route li:nth-child(4)', .3, .5, .6));
at(word('g2', /^плюс/) - .4, async () => { await reveal('.kpis', 40); });
at(word('g2', /^плюс/) - .1, () => point('.kpis .lead', .4, .5, .6));
// g3 · устранение
at(S('g3') - .2, () => scrollTo(0, .8));
press(word('g3', /^зафиксировать/), '[data-act=repair]');
at(word('g3', /^графике/) - .2, () => point('#dchart', .75, .55, .9));
at(word('g3', /^ниже/) - .1, () => point('#dchart', .85, .7, .5));
// g4 · проверки энергетика
at(word('g4', /^энергетик/) - .3, () => point('#task h3', .3, .5, .7));
press(word('g4', /^счётчик/) + .3, '[data-check=meter]', .6);
press(word('g4', /^база/) + .3, '[data-check=comparable]', .6);
press(word('g4', /^расход/) + .3, '[data-check=system]', .6);
at(word('g4', /^погрешности/) - .3, () => point('#task .reason', .4, .5, .6));
press(word('g4', /^Принимаем/) + .4, '[data-act=technical]', .7);
// g5 · финансист
at(S('g5') + .2, () => scrollTo(0, .7));
at(word('g5', /^Переменная/) - .1, () => point('#tariff', .3, .5, .7));
press(word('g5', /^Подтверждаем/) + .3, '[data-check=variable]', .6);
press(word('g5', /^принимаем/) + .3, '[data-act=accept]', .6);
at(word('g5', /^семь/) - .3, async () => { await reveal('.kpis', 30); });
at(word('g5', /^семь/), () => point('.kpis > div:nth-child(3) b', .4, .5, .6));
// g6 · EC-02: снижение выпуска
at(S('g6') - .6, () => scrollTo(0, .6));
press(S('g6') + .6, '[data-sel="1"]', .6);
press(word('g6', /^Расход/) + .2, '[data-act=repair]', .6);
at(word('g6', /^выпуском/) - .2, () => point('#dchart', .8, .6, .7));
press(word('g6', /^базы/) + .2, '[data-check=comparable]', .6);
press(word('g6', /^закрываем/) + .3, '[data-act=close]', .6);
// g7 · EC-03: неполный учёт
at(S('g7') - .6, () => scrollTo(0, .6));
press(S('g7') + .4, '[data-sel="2"]', .6);
press(word('g7', /^счётчик/) + .2, '[data-act=repair]', .6);
at(word('g7', /^двадцать/) - .1, () => point('#dchart', .72, .86, .7));
at(word('g7', /^заблокирована/) - .2, () => point('#task .reason', .3, .5, .6));
press(word('g7', /^запрашиваем/) + .3, '[data-act=request]', .6);
// g8 · экономика
at(S('g8') - .5, () => scrollTo(0, .5));
press(word('g8', /^экономики/), '.nav a[data-r=economics]', .6, .3);
press(word('g8', /^пять/) + .2, '[data-scenario="5000000"]', .6);
press(word('g8', /^три/) + .2, '[data-scenario="3000000"]', .5);
at(word('g8', /^девяносто/) - .2, () => point('#ekpis > div:first-child b', .4, .5, .6));
at(word('g8', /^тенге/) - .2, () => point('#echart', .7, .4, .7));
at(word('g8', /^тысячу/) - .2, () => point('#ekpis > div:nth-child(4) b', .4, .5, .6));
// g9 · перенос и журнал
press(word('g9', /^перенос/) + .1, '.nav a[data-r=rollout]', .6, .3);
at(word('g9', /^подключить/) - .2, () => point('.tree .br', .5, .5, .8));
press(word('g9', /^журнал/) + .1, '.nav a[data-r=journal]', .6, .3);
at(word('g9', /^действие/) - .2, () => point('.jt tbody tr:first-child td:last-child', .3, .5, .7));
A.sort((a, b) => a[0] - b[0]);

// ---- запись
if (existsSync('frames')) rmSync('frames', { recursive: true }); mkdirSync('frames');
const N = Math.ceil(END * FPS); let frame = 0, ai = 0;
for (frame = 0; frame < N; frame++) {
  const t = frame / FPS;
  while (ai < A.length && A[ai][0] <= t) { await A[ai][1](); ai++ }
  if (tw) { const k = Math.min(1, (frame - tw.f0 + 1) / tw.n), e = ease(k); cx = tw.x0 + (tw.x1 - tw.x0) * e; cy = tw.y0 + (tw.y1 - tw.y0) * e; await mouse('mouseMoved', cx, cy); if (k >= 1) tw = null }
  if (sv) { const k = Math.min(1, (frame - sv.f0 + 1) / sv.n), e = ease(k); await p.eval(`(()=>{scrollTo(0,${svFrom + (sv.y - svFrom) * e});return 1})()`); if (k >= 1) sv = null }
  if (toastAt >= 0 && frame - toastAt === 75) await p.eval(`(()=>{document.getElementById('toast').classList.remove('on');return 1})()`);
  const rp = ripple >= 0 && ripple < 14 ? ripple / 14 : -1; if (ripple >= 0) ripple++;
  await p.eval(`(()=>{for(const a of document.getAnimations()){if(a.__v===undefined){a.__v=0;a.pause()}a.__v+=${1000 / FPS};a.currentTime=a.__v}
const c=document.getElementById('fakeCursor'),r=document.getElementById('fakeRipple');c.style.left='${cx}px';c.style.top='${cy}px';r.style.left='${cx}px';r.style.top='${cy}px';r.style.opacity='${rp < 0 ? 0 : (1 - rp).toFixed(3)}';r.style.transform='scale(${rp < 0 ? .4 : (.4 + rp * 1.1).toFixed(3)})';return 1})()`);
  await p.screenshot({ path: `frames/f${String(frame).padStart(5, '0')}.jpg`, quality: 90 });
  if (frame % 300 === 0) console.log('frame', frame, '/', N, t.toFixed(1) + 's', await p.eval('location.hash'));
}
writeFileSync('clicks.json', JSON.stringify(clicks));
console.log('state', JSON.stringify(await p.eval('EK.state.cases.map(c=>[c.stage,c.closed,c.requested])')), 'errors', JSON.stringify(p.consoleErrors));
await b.close();
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', 'frames/f%05d.jpg', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', 'screen.mp4']);
console.log('screen.mp4', N, 'frames', END.toFixed(1), 's; clicks', clicks.length);
