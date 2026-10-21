// Сборка: src/ → один самодостаточный HTML (шрифт Manrope, стили, данные, графики, логика) + public/ для Render.
// node build.js  →  energokontur.html, public/index.html, presentation/index.html, public/presentation/
const fs = require('fs'), path = require('path');
const root = __dirname, rd = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
const inlineFonts = css => css.replace(/url\(fonts\/([\w.-]+\.woff2)\)/g, (_, f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(root, 'assets', 'fonts', f)).toString('base64')})`);

const order = ['data.js', 'charts.js', 'app.js'];
const html = rd('src', 'template.html')
  .replace('/*FONTS*/', () => inlineFonts(rd('assets', 'fonts-Manrope.css')))
  .replace('/*STYLE*/', () => rd('src', 'style.css'))
  .replace('/*SCRIPTS*/', () => order.map(f => `/* ---- ${f} ---- */\n` + safe(rd('src', f))).join('\n'));
fs.writeFileSync(path.join(root, 'energokontur.html'), html);
const pub = path.join(root, 'public');
fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(pub, { recursive: true });
fs.writeFileSync(path.join(pub, 'index.html'), html);

// презентация: deck.src.html + шрифты → presentation/index.html, копия в public/presentation без черновиков
const deckDir = path.join(root, 'presentation');
if (fs.existsSync(path.join(deckDir, 'deck.src.html'))) {
  const deck = rd('presentation', 'deck.src.html').replace('/*FONTS*/', () => rd('assets', 'fonts-Manrope.css').replace(/url\(fonts\//g, 'url(assets/fonts/'));
  fs.writeFileSync(path.join(deckDir, 'index.html'), deck);
  fs.mkdirSync(path.join(deckDir, 'assets', 'fonts'), { recursive: true });
  for (const f of fs.readdirSync(path.join(root, 'assets', 'fonts'))) fs.copyFileSync(path.join(root, 'assets', 'fonts', f), path.join(deckDir, 'assets', 'fonts', f));
  fs.cpSync(deckDir, path.join(pub, 'presentation'), { recursive: true, filter: p => { const rel = path.relative(deckDir, p); return !rel.split(path.sep).includes('shots') && !/\.(mjs|psd)$/.test(p) && !p.endsWith('deck.src.html') } });
}
console.log('built energokontur.html', (html.length / 1024).toFixed(0) + ' KB', fs.existsSync(path.join(pub, 'presentation')) ? '+ presentation' : '');
