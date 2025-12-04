import { cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const srcDir = resolve(root, 'api');
const destDir = resolve(root, 'dist', 'api');

if (!existsSync(srcDir)) {
  console.warn('[copy-api] Папка api не найдена, пропускаю.');
  process.exit(0);
}

try {
  await cp(srcDir, destDir, {
    recursive: true,
    force: true,
    filter: (source) => {
      const normalized = source.replace(/\\/g, '/');
      return !normalized.endsWith('/.env');
    },
  });
  console.log('[copy-api] API скопирован в dist/api');
} catch (error) {
  console.error('[copy-api] Не удалось скопировать API:', error);
  process.exit(1);
}
