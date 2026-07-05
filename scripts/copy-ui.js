import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const src = path.resolve(process.cwd(), 'ui', 'dist');
const dest = path.resolve(process.cwd(), 'dist', 'ui');

if (fs.existsSync(src)) {
  console.log(`Copying built UI from ${src} to ${dest}...`);
  copyDir(src, dest);
  console.log('UI copied successfully!');
} else {
  console.warn('Warning: built UI directory not found at ui/dist. Please build the UI first if you need it packaged.');
}
