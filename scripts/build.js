'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const core = require('../extension/core.js');
const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'content/catalog.json');
const catalog = core.validate(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
fs.writeFileSync(path.join(root, 'extension/catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
const version = JSON.parse(fs.readFileSync(path.join(root, 'extension/manifest.json'), 'utf8')).version;
const downloads = path.join(root, 'downloads');
fs.mkdirSync(downloads, { recursive: true });
fs.writeFileSync(path.join(downloads, 'noor-studio-content-pack.json'), JSON.stringify({
  format: 'noor-learning-studio', version: 1, catalog
}, null, 2) + '\n');
const result = cp.spawnSync('python3', [path.join(root, 'scripts/package.py'), 'extension'], { cwd: root, encoding: 'utf8' });
if (result.status !== 0) throw Error(result.stderr || 'تعذر إنشاء حزمة الإضافة');
fs.copyFileSync(path.join(downloads, `noor-studio-extension-v${version}.zip`), path.join(downloads, 'noor-studio-extension-current.zip'));
console.log(`تم إنشاء حزمة استوديو نور ${version}.`);
