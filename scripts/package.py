from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
import sys

root = Path(__file__).resolve().parents[1]
if len(sys.argv) != 2 or sys.argv[1] != 'extension':
    raise SystemExit('الاستخدام: python3 scripts/package.py extension')
version = json.loads((root / 'extension/manifest.json').read_text(encoding='utf-8'))['version']
out = root / 'downloads' / f'noor-studio-extension-v{version}.zip'
with ZipFile(out, 'w', ZIP_DEFLATED) as archive:
    for file in sorted((root / 'extension').rglob('*')):
        if file.is_file():
            archive.write(file, file.relative_to(root / 'extension'))
print(out)
