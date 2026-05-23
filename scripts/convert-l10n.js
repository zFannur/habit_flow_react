import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, '../../app/lib/core/localization');
const targetDir = path.resolve(__dirname, '../src/shared/lib/i18n/locales');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function convertArb(fileName, targetName) {
  const sourcePath = path.join(sourceDir, fileName);
  const targetPath = path.join(targetDir, targetName);

  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    return;
  }

  const content = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const cleanContent = {};

  for (const [key, value] of Object.entries(content)) {
    if (!key.startsWith('@')) {
      cleanContent[key] = value;
    }
  }

  fs.writeFileSync(targetPath, JSON.stringify(cleanContent, null, 2), 'utf8');
  console.log(`Converted ${fileName} to ${targetName}`);
}

convertArb('app_en.arb', 'en.json');
convertArb('app_ru.arb', 'ru.json');
