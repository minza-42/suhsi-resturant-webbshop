// Script to copy static folders (like img) to dist after Vite build
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function copyRecursiveSync(src, dest) {
  if (!existsSync(src)) return;
  const stats = statSync(src);
  if (stats.isDirectory()) {
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    for (const file of readdirSync(src)) {
      copyRecursiveSync(join(src, file), join(dest, file));
    }
  } else {
    copyFileSync(src, dest);
  }
}

copyRecursiveSync('img', 'dist/img');
