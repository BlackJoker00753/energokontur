// Автономная презентация одним файлом для почты: шрифты, картинки, логотип, живой MVP и оба ролика внутри.
// node presentation/standalone.mjs  →  mail/Energokontur-prezentaciya.html
// Ролики берутся облегчёнными из video/mail (если есть), иначе из presentation/assets. MVP и видео — base64 → Blob URL.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..');
const b64 = f => fs.readFileSync(f).toString('base64');
const uri = (f, type) => `data:${type};base64,${b64(f)}`;
const pick = name => [path.join(root, 'video', 'mail', name), path.join(here, 'assets', name)].find(fs.existsSync);

let html = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
html = html.replace(/url\(assets\/fonts\/([\w.-]+\.woff2)\)/g, (_, f) => `url(${uri(path.join(here, 'assets', 'fonts', f), 'font/woff2')})`);
html = html.replace(/src="assets\/img\/([\w.-]+\.png)"/g, (_, f) => `src="${uri(path.join(here, 'assets', 'img', f), 'image/png')}"`);
html = html.replace(/poster="assets\/([\w.-]+\.jpg)"/g, (_, f) => `poster="${uri(pick(f), 'image/jpeg')}"`);
const vids = [];
html = html.replace(/<video id="(\w+)" data-src="assets\/([\w.-]+\.mp4)"/g, (_, id, f) => { vids.push([id, pick(f)]); return `<video id="${id}"` });

const mvp = fs.readFileSync(path.join(root, 'energokontur.html'));
const boot = `<script type="application/octet-stream" id="b64-mvp">${mvp.toString('base64')}</script>
${vids.map(([id, f]) => `<script type="application/octet-stream" id="b64-${id}">${b64(f)}</script>`).join('\n')}
<script>
(() => {
  const blob = (id, type) => { const el = document.getElementById('b64-' + id), s = atob(el.textContent.trim()), u = new Uint8Array(s.length); for (let k = 0; k < s.length; k++) u[k] = s.charCodeAt(k); el.remove(); return URL.createObjectURL(new Blob([u], { type })) };
  window.MVP_URL = blob('mvp', 'text/html');
  const cache = {}; window.VIDEO_SRC = {};
  ${JSON.stringify(vids.map(v => v[0]))}.forEach(id => Object.defineProperty(window.VIDEO_SRC, id, { get: () => cache[id] ||= blob(id, 'video/mp4') }));
})();
</script>
`;
const at = html.lastIndexOf('<script>');
html = html.slice(0, at) + boot + html.slice(at);
if (/(src|href|poster)="assets\//.test(html) || /url\(assets\//.test(html)) throw new Error('остались ссылки на assets/');
fs.mkdirSync(path.join(root, 'mail'), { recursive: true });
const out = path.join(root, 'mail', 'Energokontur-prezentaciya.html');
fs.writeFileSync(out, html);
console.log(out, (fs.statSync(out).size / 1048576).toFixed(2) + ' MB;', vids.map(([id, f]) => id + ': ' + path.relative(root, f) + ' ' + (fs.statSync(f).size / 1048576).toFixed(1) + ' MB').join(', '));
