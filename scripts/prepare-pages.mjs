import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const publicFiles = [
  'index.html', 'setup.html', 'admin.html', 'privacy.html', 'terms.html',
  'import-config.js', 'subscribe.css', 'subscribe/index.html', 'edit/index.html',
  'business-admin.js', 'business-entry.js', 'business-import.js',
  'business-subscribe.js', 'business-admin.css', 'business-import.css',
  'assets/index-CjwyeWEp.js', 'assets/index-vlpK9gB_.css',
];

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
