import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { duitNowOriginalBase64 } from '../assets-src/duitnow-original.mjs';
import { createAppIcon } from '../assets-src/pwa-icons.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const publicFiles = [
  'index.html', 'setup.html', 'admin.html', 'privacy.html', 'terms.html',
  'import-config.js', 'subscribe.css', 'subscribe/index.html', 'edit/index.html',
  'business-admin.js', 'business-entry.js', 'business-import.js', 'business-page.css',
  'business-subscribe.js', 'business-admin.css', 'business-import.css',
  'assets/index-CjwyeWEp.js', 'assets/index-vlpK9gB_.css',
  'assets/duitnow-original.jpeg',
  'manifest.webmanifest', 'pwa.js', 'pwa.css', 'sw.js', 'offline.html', '_headers',
  'assets/app-icon-180.png', 'assets/app-icon-192.png', 'assets/app-icon-512.png',
];

await mkdir(join(root, 'assets'), { recursive: true });
await writeFile(join(root, 'assets/duitnow-original.jpeg'), Buffer.from(duitNowOriginalBase64, 'base64'));
for (const size of [180, 192, 512]) await writeFile(join(root, 'assets/app-icon-' + size + '.png'), createAppIcon(size));

for (const file of publicFiles) {
  const destination = join(output, file);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(join(root, file), destination);
}

async function listFiles(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(join(directory, entry.name), relative + '/'));
    else if (entry.isFile()) files.push(relative);
    else throw new Error('Unexpected non-file in static output: ' + relative);
  }
  return files;
}
const actual = (await listFiles(output)).sort();
if (JSON.stringify(actual) !== JSON.stringify([...publicFiles].sort())) {
  throw new Error('Static output contains files outside the public release list.');
}
console.log('Prepared ' + actual.length + ' public files in dist. Backend and secrets are excluded.');
