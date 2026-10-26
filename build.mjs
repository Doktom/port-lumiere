// Assemble src/ en un seul fichier jouable : index.html (autonome) et artifact.html (sans squelette)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const read = f => fs.readFileSync(path.join(root, 'src', f), 'utf8');
const js = fs.readdirSync(path.join(root, 'src', 'js')).filter(f => f.endsWith('.js')).sort()
  .map(f => `// ==== ${f}\n` + read('js/' + f)).join('\n');
const head = read('head.html'), body = read('body.html');
const page = `${head}\n${body}\n<script type="module">\n${js}\n</script>\n`;
fs.writeFileSync(path.join(root, 'artifact.html'), page);
fs.writeFileSync(path.join(root, 'index.html'),
  `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${head}\n</head>\n<body>\n${body}\n<script type="module">\n${js}\n</script>\n</body>\n</html>\n`);
fs.writeFileSync(path.join(root, '.check.mjs'), js);
console.log('ok', (page.length / 1024).toFixed(0) + ' Ko');
