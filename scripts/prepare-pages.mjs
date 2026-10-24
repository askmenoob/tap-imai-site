import { copyFile, mkdir, readdir, writeFile, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppIcon, createBrandMark, createFavicon } from '../assets-src/pwa-icons.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const publicFiles = [
  'demo/restaurant/index.html', 'demo/restaurant/demo.css', 'demo/restaurant/demo.js', 'demo/restaurant/logo.svg', 'demo/restaurant/cover.webp',
  'admin-entry.js', 'language.js', 'language.css', 'language-catalog.mjs',
  'index.html', 'setup.html', 'admin.html', 'privacy.html', 'terms.html',
  'import-config.js', 'subscribe.css', 'subscribe/index.html', 'edit/index.html',
  'business-admin.js', 'assets/business-admin-messages.js', 'assets/business-admin-checkout.js', 'assets/business-admin-toyyib-only.js', 'business-entry.js', 'business-import.js', 'business-page.css',
  'business-subscribe.js', 'business-admin.css', 'business-import.css',
  'assets/index-CjwyeWEp.js', 'assets/index-vlpK9gB_.css',
  'assets/smarttap-mark.png', 'assets/app-icon-maskable-512.png', 'assets/favicon-32.png', 'favicon.ico',
  'manifest.webmanifest', 'pwa.js', 'pwa.css', 'sw.js', 'offline.html', '_headers',
  'assets/app-icon-180.png', 'assets/app-icon-192.png', 'assets/app-icon-512.png',
];

await mkdir(join(root, 'assets'), { recursive: true });
await copyFile(join(root,'business-admin.js'),join(root,'assets/business-admin-messages.js'));
await copyFile(join(root,'business-admin.js'),join(root,'assets/business-admin-checkout.js'));
await copyFile(join(root,'business-admin.js'),join(root,'assets/business-admin-toyyib-only.js'));
// Remove only the obsolete generated payment image from this build output.
await unlink(join(output,'assets/duitnow-original.jpeg')).catch(error=>{if(error.code!=='ENOENT')throw error;});
for (const size of [180, 192, 512]) await writeFile(join(root, 'assets/app-icon-' + size + '.png'), await createAppIcon(size));

await writeFile(join(root,'assets/smarttap-mark.png'),await createBrandMark());
await writeFile(join(root,'assets/app-icon-maskable-512.png'),await createAppIcon(512,{maskable:true}));
await writeFile(join(root,'assets/favicon-32.png'),await createAppIcon(32));
await writeFile(join(root,'favicon.ico'),await createFavicon());

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
