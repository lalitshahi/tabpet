// Builds one folder per browser family from the same source:
//   dist/chromium  Chrome, Edge, Brave, Opera, Vivaldi, Arc (service worker + system.memory)
//   dist/firefox   Firefox (event page, gecko id, no system.memory)
//   dist/safari    input for `xcrun safari-web-extension-converter` on a Mac
// `--zip` also writes the store uploads.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = JSON.parse(readFileSync(join(root, 'manifest.base.json'), 'utf8'));
const zip = process.argv.includes('--zip');

const targets = {
  chromium: {
    ...base,
    minimum_chrome_version: '121',
    permissions: [...base.permissions, 'system.memory'],
    background: { service_worker: 'src/background.js', type: 'module' },
  },
  firefox: {
    ...base,
    background: { scripts: ['src/background.js'], type: 'module' },
    browser_specific_settings: {
      gecko: {
        id: 'tab-pet@indiecoderlab',
        strict_min_version: '128.0',
        data_collection_permissions: { required: ['none'] },
      },
    },
  },
  safari: {
    ...base,
    background: { service_worker: 'src/background.js', type: 'module' },
  },
};

rmSync(join(root, 'dist'), { recursive: true, force: true });
for (const [name, manifest] of Object.entries(targets)) {
  const out = join(root, 'dist', name);
  mkdirSync(out, { recursive: true });
  cpSync(join(root, 'src'), join(out, 'src'), { recursive: true });
  cpSync(join(root, 'icons'), join(out, 'icons'), { recursive: true });
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  if (zip && name !== 'safari') {
    const file = join(root, 'dist', `tab-pet-${name}-${base.version}.zip`);
    execFileSync('zip', ['-r', '-X', '-q', file, '.'], { cwd: out });
    console.log(`→ ${file}`);
  } else console.log(`→ dist/${name}`);
}
