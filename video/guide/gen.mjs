// Генератор композиции Hyperframes (видео-инструкция): node gen.mjs → composition/index.html
// Запись экрана идёт целиком, без приближений; слева внизу — шаг, по центру снизу — субтитры, звук — озвучка, тихая музыка и клики.
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
const LEAD = 3.4, TAIL = 1.2, OUTRO = 4.6;
const timing = JSON.parse(readFileSync('vo/timing.json', 'utf8'));
const clicks = existsSync('clicks.json') ? JSON.parse(readFileSync('clicks.json', 'utf8')) : [];
copyFileSync('vo/voiceover.mp3', 'composition/assets/voiceover.mp3');
if (existsSync('screen.mp4')) copyFileSync('screen.mp4', 'composition/assets/screen.mp4');
const SCREEN = +(timing[timing.length - 1].end + TAIL).toFixed(2), DUR = +(LEAD + SCREEN + OUTRO).toFixed(2), OUT = +(LEAD + SCREEN).toFixed(2);
const STEP = { g1: 'Обзор пилота', g2: 'Контур EC-01 · маршрут', g3: 'Шаг 2 · Устранение', g4: 'Шаг 3 · Замер энергетика', g5: 'Шаг 4 · Деньги', g6: 'EC-02 · снижение выпуска', g7: 'EC-03 · неполный учёт', g8: 'Экономика ДЗО', g9: 'Перенос и журнал решений' };
const caps = [];
for (const s of timing) {
  const parts = s.sub.split(/(?<=[.,:;—])\s+/).reduce((acc, p) => { const last = acc[acc.length - 1]; if (last && (last + ' ' + p).length <= 54) acc[acc.length - 1] = last + ' ' + p; else acc.push(p); return acc }, []).flatMap(p => { if (p.length <= 60) return [p]; const w = p.split(' '), out = ['']; for (const x of w) { if ((out[out.length - 1] + ' ' + x).trim().length > 54 && out[out.length - 1].length > 18) out.push(x); else out[out.length - 1] = (out[out.length - 1] + ' ' + x).trim() } return out });
  const total = parts.reduce((a, p) => a + p.length, 0); let t = s.start + LEAD; const span = s.end - s.start;
  parts.forEach(p => { const d = span * p.length / total; caps.push({ t0: +t.toFixed(2), t1: +(t + d).toFixed(2), text: p }); t += d });
}
const steps = timing.map((s, i) => ({ t0: +(LEAD + (i ? s.start - 0.3 : 0)).toFixed(2), t1: +(LEAD + (timing[i + 1] ? timing[i + 1].start - 0.3 : SCREEN)).toFixed(2), text: STEP[s.id] }));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const mark = '<div class="mark"><svg viewBox="0 0 18 18"><path d="M10.5 1.5 4 10h4.5l-1 6.5L14 8H9.5z" fill="#000"/></svg></div>';

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
${readFileSync('composition/fontfaces.css', 'utf8')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#000}
#root{width:100%;height:100%;position:relative;overflow:hidden;background:#000;font-family:'Manrope',sans-serif;color:#fff}
.clip{position:absolute;inset:0}
.card{position:absolute;inset:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px}
.logo{width:420px;height:auto}
.row{display:flex;align-items:center;gap:30px}
.mark{width:88px;height:88px;border-radius:26px;background:#ff8a1f;display:grid;place-items:center}
.mark svg{width:52px;height:52px}
.ct{font-size:96px;font-weight:700;letter-spacing:-.035em}
.cs{font-size:38px;color:#b4b4b4;font-weight:500}
.cu{font-size:40px;color:#ffb067;font-weight:600}
.cn{position:absolute;bottom:90px;font-size:26px;color:#949494}
.list{display:flex;gap:14px}
.list span{font-size:28px;font-weight:600;background:#1f1f1f;border-radius:999px;padding:12px 26px}
#steps{position:absolute;left:36px;bottom:40px;z-index:40}
.step{position:absolute;left:0;bottom:0;white-space:nowrap;font-size:24px;font-weight:700;color:#000;background:#ff8a1f;border-radius:999px;padding:10px 22px;opacity:0}
#caps{position:absolute;left:0;right:0;bottom:40px;display:flex;justify-content:center;z-index:50;pointer-events:none}
.cap{position:absolute;bottom:0;max-width:1180px;font-size:32px;font-weight:600;line-height:1.3;text-align:center;color:#fff;background:rgba(0,0,0,.9);padding:12px 26px;border-radius:12px;opacity:0}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="1920" data-height="1080">

  <div id="intro" class="clip" data-start="0" data-duration="${LEAD}" data-track-index="0">
    <div class="card">
      <img class="logo" src="assets/kmg-wide-dark.png" alt="КазМунайГаз">
      <div id="i1" class="row">${mark}<div class="ct">Как работает Энергоконтур</div></div>
      <div id="i2" class="cs">Видео-инструкция · учебный MVP за 2 минуты</div>
      <div id="i3" class="list"><span>Потеря</span><span>Устранение</span><span>Замер</span><span>Деньги</span></div>
      <div class="cn">Все данные в MVP синтетические</div>
    </div>
  </div>

  <video id="scr" class="clip" src="assets/screen.mp4" muted playsinline data-start="${LEAD}" data-duration="${SCREEN}" data-track-index="1"></video>

  <div id="outro" class="clip" data-start="${OUT}" data-duration="${OUTRO}" data-track-index="0">
    <div class="card">
      <img class="logo" src="assets/kmg-wide-dark.png" alt="КазМунайГаз">
      <div id="o1" class="row">${mark}<div class="ct">Попробуйте сами</div></div>
      <div id="o2" class="cu">energokontur.onrender.com</div>
      <div class="cn">Энергоконтур · учебный MVP на синтетических данных · Олжас Райганиев, KMG Digital</div>
    </div>
  </div>

  <div id="steps">${steps.map((s, i) => `<div id="st${i}" class="step">${esc(s.text)}</div>`).join('')}</div>
  <div id="caps">${caps.map((c, i) => `<div id="cap${i}" class="cap">${esc(c.text)}</div>`).join('')}</div>

  <audio id="vo" src="assets/voiceover.mp3" data-start="${LEAD}" data-track-index="10" data-volume="1"></audio>
  <audio id="bed" src="assets/bed.mp3" data-start="0" data-duration="${DUR}" data-track-index="11" data-volume="1"
    data-automation='{"version":1,"lanes":[{"target":"volume","points":[{"t":0,"v":0},{"t":0.6,"v":0.26},{"t":${(LEAD - 0.4).toFixed(2)},"v":0.26},{"t":${(LEAD + 0.4).toFixed(2)},"v":0.06},{"t":${(OUT - 0.3).toFixed(2)},"v":0.06},{"t":${(OUT + 0.4).toFixed(2)},"v":0.26},{"t":${(DUR - 1.2).toFixed(2)},"v":0.26},{"t":${DUR},"v":0}]}]}'></audio>
${clicks.map((t, i) => `  <audio id="clk${i}" src="assets/click.ogg" data-start="${(LEAD + t).toFixed(2)}" data-duration="0.6" data-track-index="${20 + i}" data-volume="0.4"></audio>`).join('\n')}
</div>
<script>
const tl = gsap.timeline({ paused: true });
const E = 'power3.out';
tl.fromTo('#intro .logo', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: E }, 0.1);
tl.fromTo(['#i1', '#i2', '#i3'], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: E }, 0.4);
tl.to('#intro .card', { opacity: 0, duration: 0.45 }, ${(LEAD - 0.45).toFixed(2)});
tl.fromTo('#outro .card', { opacity: 0 }, { opacity: 1, duration: 0.5 }, ${OUT});
tl.fromTo(['#outro .logo', '#o1', '#o2'], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: E }, ${OUT} + 0.3);
${JSON.stringify(steps)}.forEach((s, i) => { const id = '#st' + i; tl.fromTo(id, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.35, ease: E }, s.t0 + 0.1); tl.to(id, { opacity: 0, duration: 0.25 }, s.t1 - 0.05) });
${JSON.stringify(caps)}.forEach((c, i) => { const id = '#cap' + i; tl.fromTo(id, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.16 }, c.t0); tl.to(id, { opacity: 0, duration: 0.14 }, c.t1 - 0.05) });
window.__timelines['main'] = tl;
tl.seek(0);
</script>
</body>
</html>
`;
writeFileSync('composition/index.html', html);
console.log('guide composition: DUR', DUR, 'caps', caps.length, 'clicks', clicks.length);
