// Скачивает woff2 (кириллица + латиница) с Google Fonts и пишет fonts-<name>.css с относительными url
import fs from 'node:fs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const fam = process.argv[2], wght = process.argv[3] || '400;500;600;700';
const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${fam.replace(/ /g, '+')}:wght@${wght}&display=swap`, { headers: { 'user-agent': UA } })).text();
const blocks = css.split('/* ').slice(1).filter(b => /^(cyrillic|latin) \*\//.test(b));
let out = '', seen = {};
for (const b of blocks) {
  const sub = b.split(' ')[0], url = b.match(/url\((.*?)\)/)[1], w = b.match(/font-weight: ([\d ]+);/)[1];
  const file = `${fam.replace(/ /g, '')}-${sub}.woff2`;
  if (!seen[file]) { fs.writeFileSync('assets/fonts/' + file, Buffer.from(await (await fetch(url)).arrayBuffer())); seen[file] = 1; }
  out += `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${file}) format('woff2');unicode-range:${b.match(/unicode-range: (.*?);/)[1]}}\n`;
}
fs.writeFileSync(`assets/fonts-${fam.replace(/ /g, '')}.css`, out);
console.log(fam, Object.keys(seen), out.split('\n').length - 1, 'rules');
