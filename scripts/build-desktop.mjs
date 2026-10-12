import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { stat } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const cli = require.resolve('electron-builder/out/cli/cli.js');
const env = { ...process.env, ELECTRON_BUILDER_COMPRESSION_LEVEL: process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL || '3' };
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args, '--x64', '--publish', 'never'], { stdio: 'inherit', env });
    child.on('error', reject);
    child.on('exit', (code, signal) => resolve(signal ? 1 : code ?? 1));
  });
}
const started = Date.now();
let code = await run(['--win']);
if (code && process.platform === 'linux') {
  const { version } = require('../package.json');
  const intermediate = `release/LangSwitcher-${version}-x64-nsis.exe`;
  const info = await stat(intermediate).catch(() => null);
  // Only a fresh, small BUILD_UNINSTALLER intermediate is eligible. Never
  // accept a stale installer or turn an unrelated packaging failure into success.
  if (info && info.mtimeMs >= started && info.size < 1_000_000) {
    const { UninstallerReader } = require('app-builder-lib/out/targets/nsis/nsisUtil');
    await UninstallerReader.exec(intermediate, 'release/unsigned-uninstaller.exe');
    console.log('Using electron-builder NSIS parser for the unsigned Linux uninstaller. Package/checksum verification remains enabled.');
    code = await run(['--win', 'nsis', '--config.nsis.script=electron/installer.nsi']);
  }
}
process.exitCode = code;
