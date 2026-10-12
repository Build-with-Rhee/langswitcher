import { readdir, readFile, mkdir, copyFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const files = (await readdir('release')).filter(name => /^LangSwitcher-[\w.-]+-(portable|nsis)\.exe$/.test(name));
if (files.length < 2) throw new Error('Windows portable 및 NSIS 실행 파일이 모두 필요합니다. npm run desktop:build를 먼저 실행하세요.');
await mkdir('public/downloads', { recursive: true });
const artifacts = [];
for (const name of files) {
  const source = join('release', name);
  const bytes = await readFile(source);
  if (bytes.length < 1_000_000) throw new Error(`${name}: 완성되지 않은 NSIS 중간 파일입니다. 빌드 성공 후 다시 실행하세요.`);
  const offset = bytes.readUInt32LE(0x3c);
  if (bytes[0] !== 0x4d || bytes[1] !== 0x5a || bytes.toString('ascii', offset, offset + 4) !== 'PE\0\0') throw new Error(`${name}: PE 실행 파일이 아닙니다.`);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  await copyFile(source, join('public/downloads', name));
  artifacts.push({ name, label: name.includes('portable') ? '설치 없이 실행 (Portable)' : 'Windows 설치 파일', size: (await stat(source)).size, sha256 });
}
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
await writeFile('public/downloads/manifest.json', JSON.stringify({ version, artifacts }, null, 2) + '\n');
console.log(`Windows 실행 파일 ${files.length}개와 SHA-256 다운로드 목록을 준비했습니다.`);
