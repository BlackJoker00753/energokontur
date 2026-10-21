// «Энергоконтур»: маршрут приёмки экономии «потеря → устранение → замер → деньги» на трёх учебных контурах.
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const C = DATA.CIRCUITS, S = DATA.SPLIT;
const kwh = n => F(n / 1000) + ' тыс.';
const mln = (n, d = 1) => F(n / 1e6, d);
const now = () => new Date().toTimeString().slice(0, 5);
const ICON = {
  overview: '<path d="M2.5 2.5h4.5v4.5h-4.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5h-4.5zM9 9h4.5v4.5H9z"/>',
  circuits: '<path d="M2 8h3l1.5-4 3 8L11 8h3"/>',
  economics: '<path d="M2.5 13.5h11M4 11V8M7 11V5M10 11V7M13 11V3.5"/>',
  rollout: '<path d="M8 2.5v4M8 6.5 3.5 10v3M8 6.5l4.5 3.5v3M8 6.5v6.5"/>',
  journal: '<path d="M4 2.5h8v11H4zM6 5.5h4M6 8h4M6 10.5h2.5"/>',
  sources: '<path d="M3 3.5c2-1 3.5-1 5 .5 1.5-1.5 3-1.5 5-.5v9.5c-2-1-3.5-1-5 .5-1.5-1.5-3-1.5-5-.5z M8 4v9.5"/>',
  check: '<path d="M3 8.5 6.5 12 13 4.5"/>',
  info: '<circle cx="8" cy="8" r="6"/><path d="M8 7.5v3.5M8 5v.5"/>',
  stop: '<circle cx="8" cy="8" r="6"/><path d="M5.5 10.5l5-5"/>',
  arrow: '<path d="M3 8h10M9 4l4 4-4 4"/>',
  download: '<path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/>',
  reset: '<path d="M3 8a5 5 0 1 0 1.5-3.5M3 2.5v3h3"/>',
};
const ico = n => `<svg viewBox="0 0 16 16" aria-hidden="true">${ICON[n]}</svg>`;

// ---------- состояние
const fresh = () => ({
  cases: C.map(() => ({ stage: 0, repair: false, technical: false, meter: false, comparable: false, system: false, variable: false, tariff: 30, closed: null, requested: false, log: [] })),
  finance: { ...DATA.FINANCE }, journal: [], justRepaired: -1,
});
let st = fresh();
const ROLES = ['Оператор и бригада', 'Энергетик', 'Финансист', 'Принято'];
function log(i, role, text) { const e = { t: now(), id: C[i].id, role, text }; st.cases[i].log.push(e); st.journal.push(e) }

// ---------- правила приёмки (логика исходного MVP)
function status(i) {
  const c = C[i], s = st.cases[i], full = c.days === S;
  const delta = full ? c.expected - c.actual : null, pct = delta === null ? null : delta / c.expected * 100;
  const quality = full && s.meter && s.comparable && s.system;
  const measurable = delta !== null && delta > 0 && pct > c.uncertainty;
  const tariffOk = Number.isFinite(+s.tariff) && +s.tariff > 0 && String(s.tariff).trim() !== '';
  const valid = quality && measurable && s.repair && s.technical && s.variable && tariffOk;
  return { full, delta, pct, quality, measurable, tariffOk, valid, cash: valid ? delta * +s.tariff : null, accepted: valid && s.stage === 3 };
}
const preOver = c => { const b = c.daily.slice(0, S), m = c.modelDaily.slice(0, S); return (b.reduce((a, x) => a + x, 0) - m.reduce((a, x) => a + x, 0)) / m.reduce((a, x) => a + x, 0) * 100 };
const extraPerDay = c => (c.rawBase - c.modelDaily.slice(0, S).reduce((a, x) => a + x, 0)) / S;
function phase(i) {
  const s = st.cases[i], c = C[i];
  if (s.closed) return { label: 'Нет экономии', cls: 'muted', step: 2, stop: true };
  if (s.stage === 3) return { label: 'Принято', cls: 'ok', step: 4 };
  if (s.stage === 1 && c.kind === 'missing') return { label: s.requested ? 'Ждёт данных' : 'Мало данных', cls: 'bad', step: 2, stop: true };
  return [{ label: 'Ждёт устранения', cls: 'heat', step: 1 }, { label: 'Ждёт замера', cls: 'heat', step: 2 }, { label: 'Ждёт финансиста', cls: 'heat', step: 3 }][s.stage];
}

function act(i, a) {
  const s = st.cases[i], q = status(i);
  if (a === 'repair' && s.stage === 0) { s.repair = true; s.stage = 1; st.justRepaired = i; log(i, 'Бригада', `Устранение зафиксировано: акт Р-0${i + 1}, работы после изоляции и сброса давления.`); toast('Устранение зафиксировано') }
  else if (a === 'technical' && s.stage === 1 && q.quality && q.measurable) { s.technical = true; s.stage = 2; log(i, 'Энергетик', `Технический результат принят: ${kwh(q.delta)} кВт·ч к базе за 30 суток.`); toast('Технический результат принят') }
  else if (a === 'accept' && s.stage === 2 && q.valid) { s.stage = 3; log(i, 'Финансист', `Денежный эффект принят: ${F(q.delta)} кВт·ч × ${F(+s.tariff, 2)} тг = ${mln(q.cash, 2)} млн тг.`); toast('Экономия принята') }
  else if (a === 'close' && s.stage === 1 && C[i].kind === 'output' && s.comparable && !s.closed) { s.closed = 'no-saving'; log(i, 'Энергетик', 'Закрыто без экономии: расход снизился вместе с выпуском.'); toast('Контур закрыт: экономии нет') }
  else if (a === 'request' && s.stage === 1 && C[i].kind === 'missing' && !s.requested) { s.requested = true; log(i, 'Энергетик', 'Запрошено восстановление учёта за 3 суток; приёмка заблокирована.'); toast('Запрос на восстановление учёта отправлен') }
  else return false;
  render(); return true;
}
function setCheck(i, key, value) {
  const s = st.cases[i]; s[key] = !!value;
  if (['meter', 'comparable', 'system'].includes(key) && s.stage >= 2) { s.stage = 1; s.technical = false; log(i, 'Энергетик', 'Условия изменились: приёмка снята, нужна повторная проверка.') }
  else if (key === 'variable' && s.stage === 3) { s.stage = 2; log(i, 'Финансист', 'Основание стоимости изменилось: финансовая приёмка снята.') }
  if (key === 'comparable' && !value && s.closed) s.closed = null;
  render();
}

// ---------- экономика
function values(v) {
  const x = {};
  for (const k of ['qty', 'unit', 'launch', 'months', 'co2']) { const raw = v[k]; x[k] = Number(raw); if (raw === null || raw === undefined || String(raw).trim() === '' || !Number.isFinite(x[k]) || x[k] < 0 || x[k] > 1e10) return { valid: false, bad: k } }
  if (!Number.isInteger(x.qty)) return { valid: false, bad: 'qty' };
  if (!Number.isInteger(x.months) || x.months > 60) return { valid: false, bad: 'months' };
  const gross = x.qty * x.unit / 1e6, cover = x.launch === 0 ? 0 : gross > 0 ? x.months + x.launch / gross * 12 : null;
  return { valid: true, ...x, gross, cover, tco2: x.qty / 1000 * x.co2 };
}

// ---------- экраны
const ROUTES = { overview: 'Обзор', circuits: 'Контуры', economics: 'Экономика', rollout: 'Перенос в ДЗО', journal: 'Журнал решений', sources: 'Источники' };
let route = 'overview', sel = 0;
function parse() { const m = location.hash.match(/^#\/(\w+)(?:\/(EC-0[1-3]))?/); route = m && ROUTES[m[1]] ? m[1] : 'overview'; if (m && m[2]) sel = C.findIndex(c => c.id === m[2]) }

function routeStrip(i) {
  const c = C[i], s = st.cases[i], p = phase(i);
  const names = ['Потеря найдена', 'Устранение', 'Замер', 'Деньги'];
  const who = [`ИИ и оператор · ${DATA.ddmm(9)}`, s.repair ? `Бригада · акт Р-0${i + 1} · ${DATA.ddmm(29)}` : 'Оператор и бригада', s.technical ? `Энергетик · по ${DATA.ddmm(59)}` : 'Энергетик', s.stage === 3 ? `Финансист · ${mln(status(i).cash, 2)} млн тг` : 'Финансист'];
  return `<ol class="card route" aria-label="Маршрут приёмки ${c.id}">` + names.map((n, k) => {
    const cls = p.stop && k === p.step ? 'stop' : k < p.step ? 'done' : k === p.step ? 'cur' : 'todo';
    const key = cls === 'done' ? 'Готово' : cls === 'cur' ? 'Сейчас' : cls === 'stop' ? 'Остановлено' : 'Дальше';
    const title = cls === 'stop' ? (s.closed ? 'Экономии нет' : 'Мало данных') : n;
    return `<li class="${cls}"><span class="s-k">${key}</span><span class="s-t">${cls === 'done' ? ico('check') : ''}${title}</span><span class="s-w">${esc(who[k])}</span></li>`;
  }).join('') + '</ol>';
}

function viewCircuit() {
  const i = sel, c = C[i], s = st.cases[i], q = status(i), p = phase(i), before = s.stage === 0;
  const over = preOver(c);
  const finding = s.closed ? 'Расход снизился вместе с выпуском. <b>Экономии нет</b> — контур закрыт.'
    : s.stage === 3 ? `Экономия принята: <b>${kwh(q.delta)} кВт·ч</b> и <b>${mln(q.cash, 2)} млн тг</b> за 30 суток.`
    : before ? `ИИ видит перерасход <b>+${F(over, 1)} %</b> к модели при том же выпуске. Нужно найти и устранить причину.`
    : c.kind === 'missing' ? `Учёт за <b>${c.days} из 30 суток</b>. Пока данных нет, эффект не признаётся.`
    : c.kind === 'output' ? `Сырой расход ниже на <b>${kwh(c.rawBase - c.actual)} кВт·ч</b>, но упал и выпуск. Проверьте базу.`
    : `После устранения расход ниже базы на <b>${kwh(q.delta)} кВт·ч</b> за 30 суток.`;
  const tabs = `<div class="ctabs" role="tablist" aria-label="Учебные контуры">` + C.map((x, k) => { const ph = phase(k); return `<button class="ctab" role="tab" aria-selected="${k === i}" data-sel="${k}"><b>${x.id} · ${esc(x.name)}</b><span>${esc(x.role)}</span><span class="pill ${ph.cls}">${ph.label}</span></button>` }).join('') + '</div>';
  // KPI под графиком
  let kp;
  if (before) kp = `<div><small>Перерасход к модели ИИ</small><b class="lead">+${F(over, 1)}<u>%</u></b><em>30 суток до меры</em></div><div><small>Лишний расход</small><b>${F(extraPerDay(c) / 1000, 1)}<u>тыс. кВт·ч/сут</u></b><em>к модели при том же выпуске</em></div><div><small>Эффект в деньгах</small><b class="dash">—</b><em>нужны устранение и замер</em></div>`;
  else kp = `<div><small>Разница к базе</small><b class="lead">${q.delta === null ? '<span style="color:var(--faint)">—</span>' : F(q.delta / 1000)}<u>${q.delta === null ? 'учёт неполный' : 'тыс. кВт·ч'}</u></b><em>${q.delta === null ? `${c.days} из 30 суток` : 'база приведена к выпуску'}</em></div><div><small>К нормализованной базе</small><b>${q.pct === null ? '<span style="color:var(--faint)">—</span>' : F(q.pct, 1)}<u>%</u></b><em>погрешность учёта ${c.uncertainty} %</em></div><div><small>Эффект в деньгах</small>${q.accepted ? `<b>${mln(q.cash, 2)}<u>млн тг</u></b><em class="ok">принято за 30 суток</em>` : `<b class="dash">—</b><em>${s.closed ? 'не экономия' : 'не принят'}</em>`}</div>`;
  const chartBlock = `<section class="card"><div class="card-h"><h2>Суточный расход, тыс. кВт·ч</h2><div class="legend"><span><i style="border-color:#8c8c8c"></i>До меры</span><span><i style="border-color:var(--heat)"></i>После меры</span><span><i class="d" style="border-color:#7a7a7a"></i>База для текущего выпуска</span></div></div>
    <div class="chart" id="dchart">${dailyChart(c, { hideAfter: before })}</div>
    ${before ? '<p class="note" style="margin:-4px 0 0">Справа появится замер после устранения: 30 суток со счётчика.</p>' : ''}
    <div style="margin:18px 0 6px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><span class="note"><b>Перерасход к модели ИИ по суткам</b></span>${heatScale()}</div>
    ${heatStrip(c, { hideAfter: before })}
    <div class="kpis" style="margin-top:20px">${kp}</div></section>`;
  // задача текущей роли
  let t = '', btns = '', reason = '';
  const chk = (k, label, sub, dis) => `<label class="check"><input type="checkbox" data-check="${k}" ${s[k] ? 'checked' : ''} ${dis ? 'disabled' : ''}><span>${label}${sub ? `<small>${sub}</small>` : ''}</span></label>`;
  if (s.closed) t = `<h3>Закрыто: экономии нет</h3><p>Снижение сырого расхода — следствие меньшего выпуска. Такое снижение не переводится в тенге.</p>`;
  else if (s.stage === 0) {
    t = `<h3>Зафиксировать устранение</h3><p>${esc(c.story)}</p>`;
    btns = `<button class="btn primary" data-act="repair">Зафиксировать устранение</button>`;
    reason = `<p class="reason">${ico('info')}Ремонт — только по допуску, после изоляции участка и сброса давления.</p>`;
  } else if (s.stage === 1) {
    t = `<h3>Проверить замер</h3><p>${c.kind === 'missing' ? 'Счётчик передал не все сутки.' : c.kind === 'output' ? 'В том же периоде загрузку снизили на 10 %. База пересчитана на текущий выпуск.' : 'Сравните 30 суток после меры с базой при том же выпуске.'}</p>
      <div style="margin-top:10px">${chk('meter', 'Счётчик пригоден, учёт полный', `${c.days} из 30 суток${c.kind === 'missing' ? ' — подтвердить нельзя' : ''}`, c.kind === 'missing')}${chk('comparable', 'База приведена к выпуску и режиму', c.kind === 'output' ? `база ${mln(c.expected, 2)} млн вместо ${mln(c.rawBase, 2)} млн кВт·ч` : '')}${chk('system', 'Расход всей системы снизился, переноса нет')}</div>`;
    btns = `<button class="btn primary" data-act="technical" ${q.quality && q.measurable ? '' : 'disabled'}>Принять технический результат</button>`;
    if (c.kind === 'output') btns += `<button class="btn" data-act="close" ${s.comparable ? '' : 'disabled'}>Закрыть: экономии нет</button>`;
    if (c.kind === 'missing') btns += `<button class="btn" data-act="request" ${s.requested ? 'disabled' : ''}>${s.requested ? 'Запрос отправлен' : 'Запросить данные'}</button>`;
    reason = !q.full ? `<p class="reason bad">${ico('stop')}Получено ${c.days} из 30 суток. Приёмка заблокирована до восстановления учёта.</p>`
      : (s.comparable && !q.measurable) ? `<p class="reason bad">${ico('stop')}После приведения базы разница ${F(q.delta)} кВт·ч: положительного эффекта нет.</p>`
      : !q.quality ? `<p class="reason">${ico('info')}Отметьте все три проверки, чтобы принять результат.</p>`
      : `<p class="reason ok">${ico('check')}Разница ${F(q.pct, 1)} % больше погрешности учёта ${c.uncertainty} %.</p>`;
  } else if (s.stage === 2) {
    t = `<h3>Принять денежный эффект</h3><p>Деньги — только принятые кВт·ч, умноженные на переменную часть тарифа.</p>
      <div style="margin-top:14px" class="field"><label for="tariff">Переменная стоимость, тг/кВт·ч</label><input id="tariff" data-tariff type="number" min="0" step="0.01" value="${esc(s.tariff)}" aria-invalid="${!q.tariffOk}"><small>Допущение для учебного примера; в пилоте — по договору.</small></div>
      <div style="margin-top:8px">${chk('variable', 'Переменная часть подтверждена, двойного счёта нет')}</div>
      <div class="nested" style="margin-top:12px"><span class="formula" id="cashFormula">${F(q.delta)} <u>кВт·ч ×</u> ${q.tariffOk ? F(+s.tariff, 2) : '—'} <u>тг =</u> ${q.tariffOk ? mln(q.delta * s.tariff, 2) : '—'} <u>млн тг</u></span></div>`;
    btns = `<button class="btn primary" data-act="accept" ${q.valid ? '' : 'disabled'}>Принять денежный эффект</button>`;
    reason = !q.tariffOk ? `<p class="reason bad">${ico('stop')}Укажите стоимость больше нуля.</p>` : !s.variable ? `<p class="reason">${ico('info')}Нужна отметка финансиста.</p>` : '';
  } else {
    t = `<h3>Экономия принята</h3><p>${F(q.delta)} кВт·ч × ${F(+s.tariff, 2)} тг = <b style="color:#fff">${mln(q.cash, 2)} млн тг</b> за 30 суток. Годовую экономию по одному месяцу не заявляем.</p>`;
    btns = `<a class="btn" href="#/economics">Экономика ДЗО ${ico('arrow')}</a>`;
    reason = `<p class="reason ok">${ico('check')}Записано в журнал решений с ролями и временем.</p>`;
  }
  const task = `<section class="card task" id="task"><div class="card-h"><h2>${s.closed || s.stage === 3 ? 'Итог' : 'Решение'}</h2><span>${s.closed ? 'Энергетик' : ROLES[s.stage]}</span></div>${t}${reason}${btns ? `<div class="actions">${btns}</div>` : ''}</section>`;
  const logCard = `<section class="card"><div class="card-h"><h2>Журнал ${c.id}</h2><span>${s.log.length ? s.log.length + ' ' + plural(s.log.length, 'запись', 'записи', 'записей') : ''}</span></div>${s.log.length ? '<ol class="log">' + s.log.slice().reverse().slice(0, 4).map(e => `<li><time>${e.t}</time><span><b>${esc(e.role)}.</b> ${esc(e.text)}</span></li>`).join('') + '</ol>' : `<p class="empty">Решений по контуру пока нет.</p>`}<p class="note" style="margin-top:12px">${esc(c.plant)}</p></section>`;
  return { crumbs: ['Контуры', `${c.id} · ${c.name}`], html: `<div class="titlerow"><div><h1>${c.id} · ${esc(c.name)}</h1><p>${finding}</p></div><div class="actions"><span class="pill ${p.cls}">${p.label}</span></div></div>${tabs}${routeStrip(i)}<div class="grid g-main">${chartBlock}<div class="stack">${task}${logCard}</div></div>` };
}
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c };

function viewOverview() {
  const qs = C.map((_, i) => status(i)), ph = C.map((_, i) => phase(i));
  const accKwh = qs.reduce((a, q) => a + (q.accepted ? q.delta : 0), 0), accCash = qs.reduce((a, q) => a + (q.accepted ? q.cash : 0), 0);
  const waiting = ph.filter(p => !p.stop && p.step < 4).length, stopped = ph.filter(p => p.stop).length;
  const next = ph.findIndex(p => !p.stop && p.step < 4);
  const finding = accKwh > 0
    ? `Принято <b>${kwh(accKwh)} кВт·ч</b> и <b>${mln(accCash, 2)} млн тг</b> за 30 суток. ${waiting ? `Ещё ${waiting} ${plural(waiting, 'контур ждёт', 'контура ждут', 'контуров ждут')} решения.` : 'Очередь решений пуста.'}`
    : `ИИ нашёл перерасход на трёх контурах компрессорных. Денег пока не принято: ${next >= 0 ? `<b>${C[next].id}</b> ${ph[next].label.toLowerCase()}.` : 'очередь пуста.'}`;
  const kp = `<section class="card kpis"><div><small>Принято за 30 суток</small><b class="lead">${accKwh ? F(accKwh / 1000) : '0'}<u>тыс. кВт·ч</u></b><em>${accKwh ? 'энергетик и финансист' : 'ничего не принято'}</em></div><div><small>В деньгах</small><b>${accCash ? mln(accCash, 2) : '0'}<u>млн тг</u></b><em>переменная часть тарифа</em></div><div><small>Ждут решения</small><b>${waiting}<u>из 3</u></b><em>${waiting ? 'устранение, замер или деньги' : 'нет'}</em></div><div><small>Не признано</small><b>${stopped}<u>из 3</u></b><em>${stopped ? 'нет экономии или учёта' : 'пока нет'}</em></div></section>`;
  const hm = `<section class="card"><div class="card-h"><h2>Перерасход к модели ИИ по суткам</h2>${heatScale()}</div>` + C.map((c, i) => {
    const s = st.cases[i];
    const after = s.stage === 0 ? null : (() => { const a = c.daily.slice(S), m = c.modelDaily.slice(S), n = a.filter(x => x !== null).length; if (n < 30) return null; return (a.reduce((x, y) => x + y, 0) - m.reduce((x, y) => x + y, 0)) / m.reduce((x, y) => x + y, 0) * 100 })();
    return `<div class="hm-row"><div class="id"><b>${c.id}</b><span>${esc(c.name)}</span></div>${heatStrip(c, { hideAfter: s.stage === 0 })}<div class="v"><span>до +${F(preOver(c), 1)} %</span><b>${s.stage === 0 ? 'после —' : after === null ? 'после: нет учёта' : 'после ' + (after > 0 ? '+' : '') + F(after, 1) + ' %'}</b></div></div>`;
  }).join('') + `<div class="hm-axis"><span></span><div><span>${DATA.ddmm(0)}</span><span>устранение ${DATA.ddmm(29)}</span><span>${DATA.ddmm(59)}</span></div><span></span></div></section>`;
  const rows = C.map((c, i) => { const q = qs[i], p = ph[i], s = st.cases[i]; const who = s.closed || p.step === 4 ? '—' : p.stop ? 'Энергетик · учёт' : ROLES[s.stage]; return `<tr class="clickable" data-open="${i}"><td><b>${c.id}</b><span class="sub">${esc(c.name)}</span></td><td><span class="pill ${p.cls}">${p.label}</span></td><td class="hide-sm">${who}</td><td class="num">${s.stage === 0 ? '<span style="color:var(--faint)">—</span>' : q.delta === null ? '<span style="color:var(--faint)">—</span>' : F(q.delta)}<span class="sub">кВт·ч к базе</span></td><td class="num"><a class="btn" href="#/circuits/${c.id}">Открыть</a></td></tr>` }).join('');
  const queue = `<section class="card" style="display:flex;flex-direction:column"><div class="card-h"><h2>Очередь решений</h2><span>3 учебных контура</span></div><table class="queue"><thead><tr><th>Контур</th><th>Шаг</th><th class="hide-sm">Кто дальше</th><th class="num">Разница, 30 суток</th><th class="num"><span class="sr">Действие</span></th></tr></thead><tbody>${rows}</tbody></table><p class="note" style="margin-top:auto;padding-top:14px">Каждое решение попадает в <a href="#/journal">журнал</a> с ролью и временем.</p></section>`;
  const how = `<section class="card"><div class="card-h"><h2>Как принимается экономия</h2></div><ol class="steps">${[['ИИ находит потерю', 'Расход выше модели при том же выпуске.'], ['Бригада устраняет', 'По допуску, после изоляции и сброса давления.'], ['Энергетик принимает замер', '30 суток, база приведена к выпуску.'], ['Финансист принимает деньги', 'кВт·ч × переменная часть тарифа.']].map((x, k) => `<li><span class="n">${k + 1}</span><div><b>${x[0]}</b><p>${x[1]}</p></div></li>`).join('')}</ol></section>`;
  return { crumbs: ['Обзор'], html: `<div class="titlerow"><div><h1>Обзор пилота</h1><p>${finding}</p></div><div class="actions">${next >= 0 ? `<a class="btn primary" href="#/circuits/${C[next].id}">Открыть ${C[next].id} ${ico('arrow')}</a>` : ''}</div></div>${kp}${hm}<div class="grid g-main" style="align-items:stretch">${queue}${how}</div>` };
}

function viewEconomics() {
  const f = st.finance, r = values(f);
  const scen = DATA.SCENARIOS.map(([p, q]) => `<button data-scenario="${q}" aria-pressed="${r.valid && r.qty === q}">${p} %</button>`).join('');
  const fld = (k, label, step, sub) => `<div class="field"><label for="f-${k}">${label}</label><input id="f-${k}" type="number" min="0" step="${step}" data-finance="${k}" value="${esc(f[k])}" aria-invalid="${!r.valid && r.bad === k}">${sub ? `<small>${sub}</small>` : ''}</div>`;
  const head = r.valid ? `Сценарий одного ДЗО: <b>${mln(r.gross * 1e6, 1)} млн тг</b> валовой экономии в год. До эксплуатационных затрат и налогов.` : 'Проверьте допущения: нужны неотрицательные числа, количество и месяцы — целые.';
  const kp = r.valid ? `<div><small>Валовая экономия в год</small><b class="lead">${F(r.gross, 1)}<u>млн тг</u></b><em>${F(r.qty / 1e6, 2)} млн кВт·ч × ${F(r.unit, 2)} тг</em></div><div><small>Разовый запуск</small><b>${F(r.launch, 1)}<u>млн тг</u></b><em>пилот, ${F(r.months)} мес.</em></div><div><small>Покрытие запуска</small><b>${r.cover === null ? '<span style="color:var(--faint)">—</span>' : F(r.cover, 1)}<u>мес.</u></b><em>от старта, до опер. затрат</em></div><div><small>Меньше выбросов CO₂</small><b>${F(r.tco2)}<u>т/год</u></b><em>при ${F(r.co2, 2)} т/МВт·ч</em></div>` : '<div><small>Расчёт</small><b class="dash">—</b><em>исправьте поле с красной рамкой</em></div>';
  const budget = `<section class="card"><div class="card-h"><h2>Бюджет пилота</h2><span>млн тг</span></div><table><tbody>${DATA.BUDGET.map(b => `<tr><td>${b[0]}<span class="sub">${b[2]}</span></td><td class="num">${F(b[1])}</td></tr>`).join('')}<tr><td><b>Итого</b></td><td class="num"><b>${F(DATA.BUDGET.reduce((a, b) => a + b[1], 0))}</b></td></tr></tbody></table></section>`;
  const not = `<section class="card"><div class="card-h"><h2>Что не считается экономией</h2></div><ul class="steps">${[['Снижение выпуска', 'Меньше продукции — меньше энергии. Это не экономия (контур EC-02).'], ['Неполный учёт', 'Без 30 суток показаний эффект не признаём (EC-03).'], ['Постоянная часть тарифа', 'Считаем только переменную стоимость кВт·ч.'], ['Один месяц', 'Годовой эффект подтверждает пилот, а не одна выборка.']].map(x => `<li style="grid-template-columns:1fr"><div><b>${x[0]}</b><p>${x[1]}</p></div></li>`).join('')}</ul></section>`;
  return { crumbs: ['Экономика'], html: `<div class="titlerow"><div><h1>Экономика ДЗО</h1><p id="econHead">${head}</p></div><div class="actions"><button class="btn" data-restore>${ico('reset')}Базовые допущения</button></div></div>
    <div class="grid g-main"><div class="stack"><section class="card"><div class="card-h"><h2>Накопленная валовая экономия, млн тг</h2><span>месяцев от старта</span></div><div class="chart" id="echart">${econChart(r)}</div><div class="kpis" style="margin-top:18px" id="ekpis">${kp}</div></section>${not}</div>
    <div class="stack"><section class="card"><div class="card-h"><h2>Допущения</h2><span>меняйте числа</span></div><div class="field" style="margin-bottom:14px"><span>Снижение от базы ${F(DATA.BASE_KWH / 1e6)} млн кВт·ч в год</span><div class="seg" role="group" aria-label="Сценарий снижения">${scen}</div></div><div class="grid" style="gap:14px">${fld('qty', 'Избегаемый расход, кВт·ч/год', 1)}${fld('unit', 'Переменная стоимость, тг/кВт·ч', 'any')}<div class="grid g-2" style="gap:14px">${fld('launch', 'Запуск, млн тг', 'any')}${fld('months', 'Внедрение, мес.', 1)}</div>${fld('co2', 'Выбросы сети, т CO₂/МВт·ч', 'any', 'Допущение: подтвердить коэффициент для энергосистемы ДЗО.')}</div></section>${budget}</div></div>` };
}

function viewRollout() {
  const R = DATA.ROLLOUT;
  const tree = `<section class="card"><div class="card-h"><h2>Один сервис — все направления</h2><span>метод общий, данные местные</span></div><div class="tree"><div class="core"><b>Общий сервис КМГ</b><span>Сигнал ИИ · устранение по допуску · замер · приёмка денег · журнал</span></div><div class="br">${R.branches.map(b => `<div><b>${b[0]}</b><span>${b[1]}</span></div>`).join('')}</div></div><ol class="steps" style="margin-top:12px">${R.steps.map((x, k) => `<li><span class="n">${k + 1}</span><div><b>${x[0]}</b><p>${x[1]}</p></div></li>`).join('')}</ol><p class="note" style="margin-top:8px">${R.rules}</p></section>`;
  const pilot = `<section class="card"><div class="card-h"><h2>Условия пилота</h2><span>предложение автора</span></div><dl class="dl"><dt>Объём</dt><dd>1 ДЗО · 3 контура</dd><dt>Срок</dt><dd>4 месяца</dd><dt>Первая очередь</dt><dd>Технический воздух</dd><dt>Метод замера</dt><dd>DOE FEMP M&V 5.0</dd><dt>Бюджет</dt><dd>36 млн тг</dd></dl></section>`;
  const crit = `<section class="card"><div class="card-h"><h2>Критерии конкурса</h2></div><ol class="steps">${[['Здоровье, безопасность, среда', 'Меньше энергии — меньше выбросов CO₂; утечки устраняют по допуску, после сброса давления; меньше шума от утечек.'], ['Тиражирование', 'Одно ядро для добычи, переработки, транспорта и сервиса; ДЗО подключает свои счётчики.'], ['Деньги', 'Только принятые кВт·ч × переменная стоимость. Сценарий — 90 млн тг/год на ДЗО.']].map((x, k) => `<li><span class="n">${k + 1}</span><div><b>${x[0]}</b><p>${x[1]}</p></div></li>`).join('')}</ol></section>`;
  return { crumbs: ['Перенос в ДЗО'], html: `<div class="titlerow"><div><h1>Перенос в ДЗО</h1><p>Один метод приёмки для всех ДЗО. <b>Деньги каждое ДЗО считает само</b>, без умножения чужой суммы.</p></div></div><div class="grid g-main">${tree}<div class="stack">${pilot}${crit}</div></div>` };
}

function viewJournal() {
  const J = st.journal;
  const body = J.length ? `<table class="jt"><thead><tr><th>Время</th><th>Контур</th><th>Роль</th><th>Решение</th></tr></thead><tbody>${J.slice().reverse().map(e => `<tr><td class="num" style="text-align:left;color:var(--faint)">${e.t}</td><td><b>${e.id}</b></td><td>${esc(e.role)}</td><td>${esc(e.text)}</td></tr>`).join('')}</tbody></table>` : `<p class="empty">Решений пока нет. Откройте <a href="#/circuits/EC-01">EC-01</a> и зафиксируйте устранение.</p>`;
  return { crumbs: ['Журнал решений'], html: `<div class="titlerow"><div><h1>Журнал решений</h1><p>Каждое решение с ролью и временем: ${J.length ? `<b>${J.length} ${plural(J.length, 'запись', 'записи', 'записей')}</b>` : 'пока пусто'}. Ложные выводы тоже сохраняются.</p></div><div class="actions"><button class="btn" data-export>${ico('download')}Данные JSON</button><button class="btn" data-reset>${ico('reset')}Начать заново</button></div></div><section class="card">${body}</section>` };
}

function viewSources() {
  const src = `<section class="card"><div class="card-h"><h2>Источники</h2><span>проверено 20.10.2026</span></div>${DATA.SOURCES.map(s => `<article class="src"><span class="k">[${s.n}] ${esc(s.kind)} · ${esc(s.date)}</span><h3>${esc(s.title)}</h3><p>${esc(s.claim)}</p>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">Открыть первоисточник</a>` : ''}</article>`).join('')}</section>`;
  const ctl = `<section class="card"><div class="card-h"><h2>Данные и контроль ИИ</h2></div><ol class="steps">${DATA.CONTROLS.map((x, k) => `<li style="grid-template-columns:1fr"><div><b>${x[0]}</b><p>${x[1]}</p></div></li>`).join('')}</ol></section>`;
  const facts = `<section class="card"><div class="card-h"><h2>Что уже делает КМГ</h2><span>отчёт за 2025 год [1]</span></div><dl class="dl"><dt>Энергопотребление группы</dt><dd>${F(DATA.KMG.total, 1)} млн ГДж</dd><dt>Мероприятий за год</dt><dd>${DATA.KMG.measures}</dd><dt>Годовая экономия</dt><dd>${F(DATA.KMG.saved, 3)} млн ГДж</dd></dl><p class="note" style="margin-top:10px">Проект не присваивает эти результаты: он добавляет проверку эффекта каждой меры.</p></section>`;
  return { crumbs: ['Источники'], html: `<div class="titlerow"><div><h1>Источники и контроль ИИ</h1><p>Факты — из открытых источников. <b>Все данные MVP синтетические</b>: контуры, ряды и решения вымышлены.</p></div></div><div class="grid g-main">${src}<div class="stack">${facts}${ctl}</div></div>` };
}

// ---------- отрисовка
function render() {
  parse();
  const v = { overview: viewOverview, circuits: viewCircuit, economics: viewEconomics, rollout: viewRollout, journal: viewJournal, sources: viewSources }[route]();
  $('#crumbs').innerHTML = ['ДЗО-пилот'].concat(v.crumbs).map((x, k, a) => k === a.length - 1 ? `<b>${esc(x)}</b>` : `<span>${esc(x)}</span><i>/</i>`).join('');
  const changed = $('#view').dataset.route !== route + sel;
  $('#view').innerHTML = v.html; $('#view').dataset.route = route + sel;
  if (changed) { $('#view').classList.remove('view'); void $('#view').offsetWidth; $('#view').classList.add('view') }
  for (const a of $$('.nav a')) a.dataset.r === route ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  const open = C.filter((_, i) => { const p = phase(i); return !p.stop && p.step < 4 }).length;
  $('#navCount').textContent = open ? String(open) : '';
  document.title = (v.crumbs[v.crumbs.length - 1]) + ' · Энергоконтур';
  if (st.justRepaired === sel && route === 'circuits') { const p = $('#dchart path.after'); if (p && p.getTotalLength) { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)'; p.style.strokeDashoffset = 0 } }
  st.justRepaired = -1;
  $('.side').classList.remove('open');
}
function updateEconomics() { // поля не перерисовываются, чтобы не терять фокус
  const r = values(st.finance);
  $('#echart').innerHTML = econChart(r);
  $('#econHead').innerHTML = r.valid ? `Сценарий одного ДЗО: <b>${F(r.gross, 1)} млн тг</b> валовой экономии в год. До эксплуатационных затрат и налогов.` : 'Проверьте допущения: нужны неотрицательные числа, количество и месяцы — целые.';
  const html = viewEconomics().html, tmp = document.createElement('div'); tmp.innerHTML = html;
  $('#ekpis').innerHTML = tmp.querySelector('#ekpis').innerHTML;
  for (const i of $$('[data-finance]')) i.setAttribute('aria-invalid', String(!r.valid && r.bad === i.dataset.finance));
  for (const b of $$('[data-scenario]')) b.setAttribute('aria-pressed', String(r.valid && r.qty === +b.dataset.scenario));
}
let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), globalThis.EK_TOAST_MS || 2200) }
function exportData() {
  const out = { notice: 'Синтетические данные и учебные решения. Не данные КМГ.', exported: new Date().toISOString(), circuits: C.map(({ id, name, kind, rawBase, expected, actual, days, uncertainty, daily }) => ({ id, name, kind, rawBase, expected, actual, days, uncertainty, daily })), finance: st.finance, state: st.cases, journal: st.journal };
  const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })), a = document.createElement('a');
  a.href = url; a.download = 'energokontur_synthetic.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ---------- тема: угольная (по умолчанию) или светлая; выбор запоминается в браузере
function setTheme(t) {
  if (t === 'light') document.documentElement.dataset.theme = 'light'; else delete document.documentElement.dataset.theme;
  try { localStorage.setItem('ek.theme', t) } catch (e) {}
  $('#themeBtn').setAttribute('aria-label', t === 'light' ? 'Тёмная тема' : 'Светлая тема');
  render();
}

// ---------- события
document.addEventListener('click', e => {
  const b = e.target.closest('button,tr[data-open]'); if (!b || b.disabled) return;
  if (b.dataset.sel !== undefined) { location.hash = '#/circuits/' + C[+b.dataset.sel].id }
  else if (b.dataset.act) act(sel, b.dataset.act);
  else if (b.dataset.open !== undefined && !e.target.closest('a')) location.hash = '#/circuits/' + C[+b.dataset.open].id;
  else if (b.dataset.scenario) { st.finance.qty = +b.dataset.scenario; const i = $('[data-finance=qty]'); if (i) i.value = st.finance.qty; updateEconomics() }
  else if (b.hasAttribute('data-restore')) { st.finance = { ...DATA.FINANCE }; render(); toast('Базовые допущения восстановлены') }
  else if (b.hasAttribute('data-export')) exportData();
  else if (b.hasAttribute('data-reset')) { st = fresh(); render(); toast('Учебный пример начат заново') }
  else if (b.classList.contains('menu-btn')) $('.side').classList.toggle('open');
  else if (b.id === 'themeBtn') setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
});
document.addEventListener('change', e => {
  if (e.target.dataset.check) setCheck(sel, e.target.dataset.check, e.target.checked);
});
document.addEventListener('input', e => {
  if (e.target.dataset.finance) { st.finance[e.target.dataset.finance] = e.target.value; updateEconomics() }
  if (e.target.hasAttribute('data-tariff')) {
    const s = st.cases[sel]; s.tariff = e.target.value; if (s.stage === 3) s.stage = 2;
    const q = status(sel); e.target.setAttribute('aria-invalid', String(!q.tariffOk));
    $('#cashFormula').innerHTML = `${F(q.delta)} <u>кВт·ч ×</u> ${q.tariffOk ? F(+s.tariff, 2) : '—'} <u>тг =</u> ${q.tariffOk ? mln(q.delta * s.tariff, 2) : '—'} <u>млн тг</u>`;
    const btn = $('[data-act=accept]'); if (btn) btn.disabled = !q.valid;
  }
});
window.addEventListener('hashchange', render);
let wasNarrow = innerWidth < 700; addEventListener('resize', () => { const n = innerWidth < 700; if (n !== wasNarrow) { wasNarrow = n; render() } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('.side').classList.remove('open') });

render();
globalThis.EK = { data: DATA, get state() { return st }, render, act: (i, a) => act(i, a), setCheck: (i, k, v) => setCheck(i, k, v), status, values, reset() { st = fresh(); render() }, go(h) { location.hash = h } };
})();
