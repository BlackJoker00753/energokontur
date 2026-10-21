// SVG-графики «Энергоконтура»: одна серия — один цвет данных, 3–5 бледных линий сетки, без оси Y, подписи не пересекаются.
const NARROW = () => globalThis.innerWidth < 700;
// цвета берутся из CSS-переменных текущей темы (угольная или светлая) в момент отрисовки
const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const F = (n, d = 0) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const niceStep = span => { const raw = span / 4, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p };

// суточный расход контура: 30 суток до (серый) и 30 после меры (оранжевый), база — пунктир
function dailyChart(c, { compact = false, hideAfter = false } = {}) {
  const idx = DATA.CIRCUITS.findIndex(x => x.id === c.id);
  if (hideAfter) c = { ...c, daily: c.daily.map((v, k) => k < DATA.SPLIT ? v : undefined) };
  const W = NARROW() ? 440 : 860, H = NARROW() ? 240 : compact ? 220 : 262, L = 40, R = 12, T = 30, B = 30;
  const vals = c.daily.filter(v => v !== null && v !== undefined).concat(c.baseDaily).map(v => v / 1000);
  const step = niceStep(Math.max(...vals) - Math.min(...vals) + 4);
  const lo = Math.floor((Math.min(...vals) - 1) / step) * step, hi = Math.ceil((Math.max(...vals) + 1) / step) * step;
  const X = i => L + i / (c.daily.length - 1) * (W - L - R), Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  let g = '';
  for (let v = lo; v <= hi + 1e-9; v += step) g += `<path d="M${L} ${Y(v).toFixed(1)}H${W - R}" stroke="${tok('--chart-grid')}"/><text x="${L - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${F(v)}</text>`;
  const line = (a, b, arr) => { let d = '', pen = false; for (let i = a; i < b; i++) { const v = arr[i]; if (v === null || v === undefined) { pen = false; continue } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v / 1000).toFixed(1); pen = true } return d };
  const S = DATA.SPLIT, mx = X(S - .5);
  g += `<path d="${line(0, c.baseDaily.length, c.baseDaily)}" stroke="${tok('--chart-base')}" stroke-width="1.5" stroke-dasharray="5 4" fill="none"/>`;
  g += `<path d="M${mx.toFixed(1)} ${T - 14}V${H - B}" stroke="${tok('--sep')}" stroke-dasharray="3 3"/>`;
  g += `<text x="${(mx + 6).toFixed(1)}" y="${T - 4}" class="lab">${c.kind === 'output' ? 'Загрузка снижена на 10 %' : 'Устранение · акт Р-0' + (idx + 1)}</text>`;
  g += `<path d="${line(0, S, c.daily)}" stroke="${tok('--chart-prev')}" stroke-width="2" fill="none" stroke-linejoin="round"/>`;
  g += `<path class="after" d="${line(S - 1, c.daily.length, c.daily)}" stroke="${tok('--heat-line')}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`;
  c.daily.forEach((v, i) => { if (v === null) g += `<text x="${X(i).toFixed(1)}" y="${(H - B - 6).toFixed(1)}" text-anchor="middle" style="fill:${tok('--negative')};font-size:13px">×</text>` });
  for (const i of NARROW() ? [0, 20, 40, 59] : [0, 10, 20, 30, 40, 50, 59]) g += `<text x="${X(i).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === 59 ? 'end' : 'middle'}">${DATA.ddmm(i)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Суточный расход ${c.id}, тыс. кВт·ч: 30 суток до и 30 после меры">${g}</svg>`;
}

// тепловая полоса: перерасход к модели ИИ по суткам (0 → 4 % и выше), пропуск учёта — штриховка
const heatLevel = (v, m) => v === null ? null : Math.max(0, Math.min(1, ((v - m) / m) / 0.04));
function heatStrip(c, { hideAfter = false } = {}) {
  return `<div class="heat-strip" role="img" aria-label="Перерасход к модели ИИ по суткам, ${c.id}">` + c.daily.map((v, i) => {
    if (hideAfter && i >= DATA.SPLIT) return '<i></i>';
    const k = heatLevel(v, c.modelDaily[i]);
    return k === null ? `<i class="na" title="${DATA.ddmm(i)}: нет показаний"></i>` : `<i style="background:rgba(255,138,31,${(.07 + k * .93).toFixed(2)})" title="${DATA.ddmm(i)}: ${F((v - c.modelDaily[i]) / c.modelDaily[i] * 100, 1)} % к модели"></i>`;
  }).join('') + '</div>';
}
const heatScale = () => `<div class="heat-scale"><span>0 %</span><span class="bar">${[0, .25, .5, .75, 1].map(k => `<i style="background:rgba(255,138,31,${(.07 + k * .93).toFixed(2)})"></i>`).join('')}</span><span>4 % и выше к модели ИИ</span><span class="bar"><i style="outline:1px dashed var(--sep);outline-offset:-1px"></i></span><span>нет учёта</span></div>`;

// накопленная валовая экономия за 24 месяца; пунктир — разовый запуск, точка — покрытие запуска
function econChart(r) {
  if (!r.valid) return '<div class="empty">Проверьте допущения: нужны неотрицательные числа.</div>';
  const W = NARROW() ? 440 : 860, H = NARROW() ? 260 : 280, L = 44, R = 14, T = 26, B = 30;
  const top = Math.max(1, r.launch, r.gross * Math.max(0, 24 - r.months) / 12), step = niceStep(top * 1.08), hi = Math.ceil(top * 1.08 / step) * step;
  const X = m => L + m / 24 * (W - L - R), Y = v => T + (hi - v) / hi * (H - T - B);
  let g = `<rect x="${L}" y="${T}" width="${(X(Math.min(r.months, 24)) - L).toFixed(1)}" height="${H - T - B}" fill="${tok('--chart-span')}"/>`;
  for (let v = 0; v <= hi + 1e-9; v += step) g += `<path d="M${L} ${Y(v).toFixed(1)}H${W - R}" stroke="${v ? tok('--chart-grid') : tok('--chart-zero')}"/><text x="${L - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${F(v)}</text>`;
  g += `<text x="${(L + 8).toFixed(1)}" y="${T + 18}" class="lab">Внедрение ${F(r.months)} мес.</text>`;
  g += `<path d="M${L} ${Y(r.launch).toFixed(1)}H${W - R}" stroke="${tok('--chart-base')}" stroke-width="1.5" stroke-dasharray="6 5"/><text x="${W - R}" y="${(Y(r.launch) - 7).toFixed(1)}" text-anchor="end" class="lab">Разовый запуск ${F(r.launch, 1)} млн тг</text>`;
  const pts = Array.from({ length: 25 }, (_, m) => (m ? 'L' : 'M') + X(m).toFixed(1) + ' ' + Y(r.gross * Math.max(0, m - r.months) / 12).toFixed(1)).join(' ');
  g += `<path d="${pts}" stroke="${tok('--heat-line')}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`;
  if (r.cover !== null && r.cover <= 24 && r.launch > 0) g += `<circle cx="${X(r.cover).toFixed(1)}" cy="${Y(r.launch).toFixed(1)}" r="5" fill="${tok('--text')}"/><text x="${(X(r.cover) + 10).toFixed(1)}" y="${(Y(r.launch) + 18).toFixed(1)}" class="lab">≈ ${F(r.cover, 1)} мес.</text>`;
  for (const m of NARROW() ? [0, 6, 12, 18, 24] : [0, 4, 8, 12, 16, 20, 24]) g += `<text x="${X(m).toFixed(1)}" y="${H - 8}" text-anchor="${m === 0 ? 'start' : m === 24 ? 'end' : 'middle'}">${m}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Накопленная валовая экономия, млн тг, по месяцам от старта">${g}</svg>`;
}
