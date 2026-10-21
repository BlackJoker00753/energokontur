// Генератор композиции Hyperframes (ролик «Идея»): node gen.mjs → composition/index.html
// Сцены и субтитры привязаны к словам озвучки (vo/timing.json). Стиль MVP: true black, Manrope, тепловой оранжевый.
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
const VO0 = 0.8, HOLD = 3.6;
const timing = JSON.parse(readFileSync('vo/timing.json', 'utf8'));
copyFileSync('vo/voiceover.mp3', 'composition/assets/voiceover.mp3');
const seg = id => timing.find(s => s.id === id);
const at = (id, re, k = 0) => { const w = seg(id).words.filter(w => re.test(w[2]))[k]; if (!w) throw new Error('word ' + re + ' in ' + id); return +(w[0] + VO0).toFixed(2) };
const B = id => id === 's1' ? 0 : +(seg(id).start + VO0 - 0.35).toFixed(2);
const END = +(seg('s9').end + VO0).toFixed(2), DUR = +(END + HOLD).toFixed(2);
const ids = timing.map(s => s.id), next = id => ids[ids.indexOf(id) + 1];
const sc = id => { const a = B(id), b = next(id) ? B(next(id)) : DUR; return `data-start="${a}" data-duration="${(b - a).toFixed(2)}"` };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// субтитры: куски по знакам препинания (до 50 знаков), время — пропорционально длине внутри фразы
const caps = [];
for (const s of timing.filter(s => s.id !== 's9')) {
  const parts = s.sub.split(/(?<=[.,:;—])\s+/).reduce((acc, p) => { const last = acc[acc.length - 1]; if (last && (last + ' ' + p).length <= 50) acc[acc.length - 1] = last + ' ' + p; else acc.push(p); return acc }, []).flatMap(p => { if (p.length <= 56) return [p]; const w = p.split(' '), out = ['']; for (const x of w) { if ((out[out.length - 1] + ' ' + x).trim().length > 50 && out[out.length - 1].length > 18) out.push(x); else out[out.length - 1] = (out[out.length - 1] + ' ' + x).trim() } return out });
  const total = parts.reduce((a, p) => a + p.length, 0); let t = s.start + VO0; const span = s.end - s.start;
  parts.forEach(p => { const d = span * p.length / total; caps.push({ t0: +t.toFixed(2), t1: +(t + d).toFixed(2), text: p }); t += d });
}
const K = {
  leak: at('s1', /^утечка/), kwh: at('s1', /^киловатт/),
  n87: at('s2', /^восемьдесят/), q: at('s2', /^вопрос/),
  co2: at('s3', /^углекислый/), noise: at('s3', /^шумит/), press: at('s3', /^давлением/),
  rand: at('s4', /^случайно/), eye: at('s4', /^глаз/), out: at('s4', /^снижение/),
  name: at('s5', /^Энергоконтур/), norm: at('s5', /^нормой/), over: at('s5', /^перерасход/),
  brig: at('s6', /^Бригада/), en: at('s6', /^Энергетик/), fin: at('s6', /^Финансист/),
  k250: at('s7', /^двести/), tg: at('s7', /^семь/), syn: at('s7', /^синтетические/),
  m90: at('s8', /^девяносто/), t1800: at('s8', /^тысячу/), dob: at('s8', /^добычи/), per: at('s8', /^переработки/), tr: at('s8', /^транспорта/), ser: at('s8', /^сервиса/),
};
// учебный ряд EC-01 для тепловой полосы: 30 суток до (+3 %), 30 после (≈0)
let sd = 7; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280 - .5;
const heat = Array.from({ length: 60 }, (_, i) => { const dev = i < 30 ? 3.1 + rnd() * 2.4 : .1 + rnd() * 1.2; return Math.max(0, Math.min(1, dev / 4)) });
const heatCells = heat.map((k, i) => `<i style="background:rgba(255,138,31,${(.08 + k * .92).toFixed(2)})"></i>`).join('');
// линии «норма» и «факт» для сцены 5
const X = i => 80 + i * (1360 / 29), Yn = v => 300 - v * 3;
const actual = Array.from({ length: 30 }, (_, i) => 52 + Math.sin(i * 1.7) * 4 + rnd() * 6), norm = Array.from({ length: 30 }, () => 30);
const path = arr => arr.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Yn(v).toFixed(1)).join(' ');

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
#root{width:100%;height:100%;position:relative;overflow:hidden;background:#000;font-family:'Manrope',sans-serif;color:#fff;font-variant-numeric:tabular-nums}
.clip{position:absolute;inset:0}
.pad{position:absolute;left:140px;right:140px;top:120px}
.h1{font-size:96px;font-weight:700;letter-spacing:-.035em;line-height:1.02}
.h2{font-size:72px;font-weight:700;letter-spacing:-.03em;line-height:1.05}
.lead{font-size:40px;font-weight:500;line-height:1.3;color:#b4b4b4}
.giant{font-size:300px;font-weight:700;letter-spacing:-.05em;line-height:.9}
.orange{color:#ff8a1f}
.muted{color:#b4b4b4}
.small{font-size:26px;color:#949494}
.card{background:#111;border-radius:32px;padding:44px}
.tag{display:inline-flex;align-items:center;gap:14px;font-size:28px;font-weight:600;background:#1f1f1f;border-radius:999px;padding:12px 26px}
.tag i{width:14px;height:14px;border-radius:50%;background:#ff8a1f;display:block}
.heat{display:grid;grid-template-columns:repeat(60,1fr);gap:6px;height:64px}
.heat i{border-radius:5px;display:block}
.node{background:#111;border-radius:28px;padding:36px 34px;width:370px}
.node b{display:block;font-size:40px;font-weight:700;letter-spacing:-.02em}
.node span{display:block;font-size:26px;color:#b4b4b4;margin-top:10px;line-height:1.3}
.node.on{background:#fff;color:#000}.node.on span{color:#333}
.ring{position:absolute;width:90px;height:90px;margin:-45px 0 0 -45px;border-radius:50%;border:5px solid #ff8a1f}
.scrim{position:absolute;inset:0;background:linear-gradient(90deg,#000 0%,rgba(0,0,0,.9) 38%,rgba(0,0,0,.35) 68%,rgba(0,0,0,.1) 100%)}
.shot{position:absolute;border-radius:24px;overflow:hidden;background:#111}
.shot img{display:block;width:100%;height:auto}
.chip{font-size:34px;font-weight:600;background:#111;border-radius:22px;padding:22px 32px}
#caps{position:absolute;left:0;right:0;bottom:44px;display:flex;justify-content:center;z-index:50;pointer-events:none}
.cap{position:absolute;bottom:0;max-width:1240px;font-size:34px;font-weight:600;line-height:1.3;text-align:center;color:#fff;background:rgba(0,0,0,.86);padding:12px 28px;border-radius:14px;opacity:0}
.mark{width:96px;height:96px;border-radius:28px;background:#ff8a1f;display:grid;place-items:center}
.mark svg{width:56px;height:56px}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="1920" data-height="1080">

  <!-- s1 · компрессор и утечка -->
  <div id="s1" class="clip" ${sc('s1')} data-track-index="0">
    <div id="plantWrap" style="position:absolute;inset:0;overflow:hidden"><img id="plant" src="assets/img/plant.jpg" style="position:absolute;inset:0;width:1920px;height:1080px;object-fit:cover"></div>
    <div class="ring" id="r1" style="left:1812px;top:192px"></div><div class="ring" id="r2" style="left:1812px;top:192px"></div>
    <div class="scrim" id="scrim1"></div>
    <div class="pad" style="width:860px">
      <div id="s1a" class="h1">Компрессор работает круглые сутки</div>
      <div id="s1b" class="lead" style="margin-top:36px">Утечка — и он качает воздух впустую</div>
      <div id="s1c" style="margin-top:80px"><div class="small">Лишние кВт·ч в сутки, учебный пример</div><div class="giant orange" style="font-size:210px;margin-top:10px"><span id="cnt1">0</span></div></div>
    </div>
  </div>

  <!-- s2 · что уже делает КМГ -->
  <div id="s2" class="clip" ${sc('s2')} data-track-index="0">
    <div class="pad">
      <div style="display:flex;align-items:flex-end;gap:60px"><div id="s2a" class="giant">87</div><div id="s2b" class="lead" style="max-width:820px;padding-bottom:30px">мероприятий по энергоэффективности<br>КМГ выполнил в 2025 году</div></div>
      <div id="s2c" class="small" style="margin-top:30px">Источник: КМГ, отчёт об устойчивом развитии за 2025 год · экономия 1,935 млн ГДж</div>
      <div id="s2d" class="h2" style="margin-top:110px">Сколько сэкономила <span class="orange">каждая</span> мера?</div>
    </div>
  </div>

  <!-- s3 · вред: ОС, ОТ, ПБ -->
  <div id="s3" class="clip" ${sc('s3')} data-track-index="0">
    <div class="pad">
      <div id="s3a" class="h2">Потери — это не только деньги</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:90px">
        <div id="s3b" class="card"><span class="tag"><i></i>ОС</span><div class="h1" style="margin-top:40px">CO₂</div><div class="lead" style="font-size:30px;margin-top:16px">лишняя энергия — лишние выбросы</div></div>
        <div id="s3c" class="card"><span class="tag"><i></i>ОТ</span><div class="h1" style="margin-top:40px">Шум</div><div class="lead" style="font-size:30px;margin-top:16px">утечка свистит в цехе</div></div>
        <div id="s3d" class="card"><span class="tag"><i></i>ПБ</span><div class="h1" style="margin-top:40px;font-size:80px">Давление</div><div class="lead" style="font-size:30px;margin-top:16px">ремонт под давлением опасен</div></div>
      </div>
    </div>
  </div>

  <!-- s4 · как считают сегодня -->
  <div id="s4" class="clip" ${sc('s4')} data-track-index="0">
    <div class="pad">
      <div id="s4a" class="h2">Сегодня</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:70px">
        <div id="s4b" class="card"><div class="h2" style="font-size:56px">Утечку замечают случайно</div></div>
        <div id="s4c" class="card"><div class="h2" style="font-size:56px">Экономию считают «на глаз»</div></div>
      </div>
      <div id="s4d" class="card" style="margin-top:28px;display:flex;gap:90px;align-items:baseline">
        <div><div class="small">Расход</div><div class="h1">−10 %</div></div>
        <div><div class="small">Выпуск</div><div class="h1">−10 %</div></div>
        <div><div class="small">Экономия</div><div class="h1 orange" id="zero">0</div></div>
        <div class="lead" style="font-size:32px;max-width:420px">Меньше продукции — это не экономия</div>
      </div>
    </div>
  </div>

  <!-- s5 · Энергоконтур: ИИ сравнивает с нормой -->
  <div id="s5" class="clip" ${sc('s5')} data-track-index="0">
    <div class="pad">
      <div id="s5a" style="display:flex;align-items:center;gap:34px"><div class="mark"><svg viewBox="0 0 18 18"><path d="M10.5 1.5 4 10h4.5l-1 6.5L14 8H9.5z" fill="#000"/></svg></div><div class="h1" style="font-size:120px">Энергоконтур</div></div>
      <div id="s5b" class="lead" style="margin-top:30px">ИИ сравнивает расход с нормой при том же выпуске</div>
      <svg id="s5c" viewBox="0 0 1640 340" style="width:1640px;margin-top:40px;display:block">
        <path d="${path(norm)}" stroke="#7a7a7a" stroke-width="4" stroke-dasharray="14 10" fill="none"/>
        <text x="1520" text-anchor="end" y="${Yn(30) + 46}" fill="#949494" font-size="28" font-family="Manrope">норма</text>
        <path id="act" d="${path(actual)}" stroke="#ff8a1f" stroke-width="7" fill="none" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
        <text id="factL" x="1520" text-anchor="end" y="${Yn(actual[29]) - 26}" fill="#ffb067" font-size="28" font-weight="700" font-family="Manrope">факт: перерасход</text>
      </svg>
      <div id="s5d" class="heat" style="margin-top:10px">${heatCells.split('</i>').slice(0, 30).map(x => x + '</i>').join('')}${'<i style="background:#1c1c1c"></i>'.repeat(30)}</div>
    </div>
  </div>

  <!-- s6 · маршрут: ИИ → бригада → энергетик → финансист -->
  <div id="s6" class="clip" ${sc('s6')} data-track-index="0">
    <div class="pad">
      <div id="s6a" class="h2">Решают люди</div>
      <div style="position:relative;margin-top:110px;display:flex;justify-content:space-between">
        <svg style="position:absolute;left:0;top:118px;width:1640px;height:4px;overflow:visible"><path id="chain" d="M180 2H1460" stroke="#3a3a3a" stroke-width="4" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>
        <div id="n1" class="node on" style="position:relative"><b>ИИ</b><span>находит перерасход</span></div>
        <div id="n2" class="node" style="position:relative"><b>Бригада</b><span>чинит по допуску, без давления</span></div>
        <div id="n3" class="node" style="position:relative"><b>Энергетик</b><span>сравнивает 30 дней с базой</span></div>
        <div id="n4" class="node" style="position:relative"><b>Финансист</b><span>переводит кВт·ч в тенге</span></div>
      </div>
      <div id="s6b" style="margin-top:80px"><div class="heat">${heatCells}</div><div style="display:flex;justify-content:space-between;margin-top:16px" class="small"><span>до ремонта</span><span>после ремонта</span></div></div>
    </div>
  </div>

  <!-- s7 · учебный пример EC-01 -->
  <div id="s7" class="clip" ${sc('s7')} data-track-index="0">
    <div class="shot" id="s7shot" style="left:860px;top:150px;width:940px"><img src="assets/img/mvp-accepted.png"></div>
    <div class="pad" style="width:680px">
      <div id="s7a" class="small">Учебный контур EC-01 · 30 дней</div>
      <div id="s7b" style="margin-top:24px"><div class="h1"><span id="cnt7">0</span></div><div class="lead">кВт·ч сэкономлено</div></div>
      <div id="s7c" class="lead" style="margin-top:40px;font-size:44px">× 30 ₸ за кВт·ч</div>
      <div id="s7d" style="margin-top:40px"><div class="h1 orange">7,5 млн ₸</div><div class="lead">за месяц</div></div>
      <div id="s7e" class="tag" style="margin-top:56px"><i></i>Данные синтетические</div>
    </div>
  </div>

  <!-- s8 · масштаб -->
  <div id="s8" class="clip" ${sc('s8')} data-track-index="0">
    <div class="pad">
      <div id="s8a" class="small">Сценарий на одно ДЗО в год</div>
      <div style="display:flex;gap:120px;margin-top:30px;align-items:flex-end">
        <div id="s8b"><div class="giant" style="font-size:220px"><span id="cnt8">0</span><span style="font-size:90px;color:#b4b4b4"> млн ₸</span></div></div>
        <div id="s8c" style="padding-bottom:26px"><div class="h1 orange">−1 800 т</div><div class="lead">CO₂ в год</div></div>
      </div>
      <div style="display:flex;gap:20px;margin-top:110px">
        <div id="c1" class="chip">Добыча</div><div id="c2" class="chip">Переработка</div><div id="c3" class="chip">Транспорт</div><div id="c4" class="chip">Сервис</div>
      </div>
      <div id="s8d" class="small" style="margin-top:34px">Допущения: база 100 млн кВт·ч, снижение 3 %, 30 ₸/кВт·ч, 0,6 т CO₂/МВт·ч</div>
    </div>
  </div>

  <!-- s9 · финал -->
  <div id="s9" class="clip" ${sc('s9')} data-track-index="0">
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px">
      <img id="s9l" src="assets/kmg-wide-dark.png" style="width:440px;height:auto">
      <div id="s9a" style="display:flex;align-items:center;gap:34px"><div class="mark"><svg viewBox="0 0 18 18"><path d="M10.5 1.5 4 10h4.5l-1 6.5L14 8H9.5z" fill="#000"/></svg></div><div class="h1" style="font-size:130px">Энергоконтур</div></div>
      <div id="s9b" class="lead" style="font-size:46px;color:#fff">Находим потери — подтверждаем экономию</div>
      <div id="s9c" class="small" style="margin-top:30px">Конкурс КМГ по ОЗТОС · Олжас Райганиев, KMG Digital · данные в ролике синтетические</div>
    </div>
  </div>

  <div id="caps">${caps.map((c, i) => `<div id="cap${i}" class="cap">${esc(c.text)}</div>`).join('')}</div>

  <audio id="vo" src="assets/voiceover.mp3" data-start="${VO0}" data-track-index="10" data-volume="1"></audio>
  <audio id="bed" src="assets/bed.mp3" data-start="0" data-duration="${DUR}" data-track-index="11" data-volume="1"
    data-automation='{"version":1,"lanes":[{"target":"volume","points":[{"t":0,"v":0},{"t":0.5,"v":0.22},{"t":${VO0},"v":0.07},{"t":${(END - 0.2).toFixed(2)},"v":0.07},{"t":${(END + 0.6).toFixed(2)},"v":0.26},{"t":${(DUR - 1).toFixed(2)},"v":0.2},{"t":${DUR},"v":0}]}]}'></audio>
${[K.n87, K.tg, K.m90, B('s9') + .3].map((t, i) => `  <audio id="hit${i}" src="assets/hit.ogg" data-start="${t.toFixed(2)}" data-duration="0.8" data-track-index="${20 + i}" data-volume="0.35"></audio>`).join('\n')}
</div>
<script>
const tl = gsap.timeline({ paused: true });
const E = 'power3.out', IN = (sel, t, y = 30, d = .7) => tl.fromTo(sel, { opacity: 0, y }, { opacity: 1, y: 0, duration: d, ease: E }, t);
const cnt = (sel, from, to, t, d, fmt) => { const o = { v: from }; tl.to(o, { v: to, duration: d, ease: 'power2.out', onUpdate: () => { document.querySelector(sel).textContent = fmt(o.v) } }, t) };
const ru = v => Math.round(v).toLocaleString('ru-RU');
// s1
tl.fromTo('#plant', { scale: 1.04 }, { scale: 1.14, duration: ${(B('s2') - 0).toFixed(2)}, ease: 'none', transformOrigin: '70% 30%' }, 0);
tl.fromTo('#scrim1', { opacity: 0 }, { opacity: 1, duration: .8 }, .2);
IN('#s1a', .4); IN('#s1b', ${K.leak - .2});
for (let k = 0; k < 6; k++) { const t0 = ${K.leak} + k * .9; tl.fromTo(k % 2 ? '#r2' : '#r1', { scale: .4, opacity: 1 }, { scale: 2.2, opacity: 0, duration: 1.1, ease: 'power2.out' }, t0) }
IN('#s1c', ${K.kwh - 1.2}); cnt('#cnt1', 0, 8334, ${K.kwh - 1}, 2.4, ru);
// s2
IN('#s2a', ${B('s2') + .2}, 40); IN('#s2b', ${K.n87 - .2}); IN('#s2c', ${K.n87 + .6}); IN('#s2d', ${K.q - .3});
// s3
IN('#s3a', ${B('s3') + .2}); IN('#s3b', ${K.co2 - .3}); IN('#s3c', ${K.noise - .3}); IN('#s3d', ${K.press - .5});
// s4
IN('#s4a', ${B('s4') + .2}); IN('#s4b', ${K.rand - .5}); IN('#s4c', ${K.eye - .6}); IN('#s4d', ${K.out - .4});
tl.fromTo('#zero', { scale: 1.6 }, { scale: 1, duration: .6, ease: 'back.out(2)' }, ${K.out + .4});
// s5
IN('#s5a', ${K.name - .3}); IN('#s5b', ${K.name + .9}); IN('#s5c', ${K.norm - .8});
tl.to('#act', { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' }, ${K.norm - .4});
IN('#factL', ${K.over - .4}, 10); IN('#s5d', ${K.over - .2}, 20);
// s6
IN('#s6a', ${B('s6') + .2}); IN('#n1', ${B('s6') + .5}); IN('#n2', ${B('s6') + .7}); IN('#n3', ${B('s6') + .9}); IN('#n4', ${B('s6') + 1.1});
tl.to('#chain', { strokeDashoffset: 0, duration: ${(K.fin - K.brig).toFixed(2)}, ease: 'none' }, ${K.brig});
const lit = (id, t) => { tl.to(id, { backgroundColor: '#ffffff', color: '#000000', duration: .35 }, t); tl.to(id + ' span', { color: '#333333', duration: .35 }, t) };
const unlit = (id, t) => { tl.to(id, { backgroundColor: '#111111', color: '#ffffff', duration: .35 }, t); tl.to(id + ' span', { color: '#b4b4b4', duration: .35 }, t) };
unlit('#n1', ${K.brig - .2}); lit('#n2', ${K.brig - .2}); unlit('#n2', ${K.en - .2}); lit('#n3', ${K.en - .2}); unlit('#n3', ${K.fin - .2}); lit('#n4', ${K.fin - .2});
IN('#s6b', ${K.en});
// s7
tl.fromTo('#s7shot', { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: .9, ease: E }, ${B('s7') + .2});
IN('#s7a', ${B('s7') + .3}); IN('#s7b', ${K.k250 - .4}); cnt('#cnt7', 0, 250000, ${K.k250 - .3}, 1.8, ru);
IN('#s7c', ${K.tg - 1.2}); IN('#s7d', ${K.tg - .3}); IN('#s7e', ${K.syn - .6});
// s8
IN('#s8a', ${B('s8') + .2}); IN('#s8b', ${K.m90 - .5}); cnt('#cnt8', 0, 90, ${K.m90 - .4}, 1.6, ru); IN('#s8c', ${K.t1800 - .4});
IN('#c1', ${K.dob - .3}, 20, .5); IN('#c2', ${K.per - .3}, 20, .5); IN('#c3', ${K.tr - .3}, 20, .5); IN('#c4', ${K.ser - .3}, 20, .5); IN('#s8d', ${K.ser + .3});
// s9
IN('#s9l', ${B('s9') + .2}); IN('#s9a', ${B('s9') + .45}); IN('#s9b', ${B('s9') + 1.2}); IN('#s9c', ${B('s9') + 2});
tl.to('#s9 > div', { opacity: 0, duration: .6 }, ${(DUR - .6).toFixed(2)});
// субтитры
${JSON.stringify(caps)}.forEach((c, i) => { const id = '#cap' + i; tl.fromTo(id, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .16 }, c.t0); tl.to(id, { opacity: 0, duration: .14 }, c.t1 - .05) });
window.__timelines['main'] = tl;
tl.seek(0);
</script>
</body>
</html>
`;
writeFileSync('composition/index.html', html);
console.log('idea composition: DUR', DUR, 'caps', caps.length);
