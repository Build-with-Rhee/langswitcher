import { _electron as electron } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const userData = path.resolve(process.env.LANGSWITCHER_USER_DATA || path.join(tmpdir(), 'langswitcher-smoke'));
await mkdir(userData, { recursive: true });
const app = await electron.launch({
  args: [...(process.platform === 'linux' ? ['--no-sandbox'] : []), '--disable-gpu', '.'],
  env: { ...process.env, ...(process.platform === 'linux' ? { XDG_CACHE_HOME: '/workspace/.cache' } : {}), LANGSWITCHER_USER_DATA: userData },
  timeout: 30_000,
});
const child = app.process();
try {
  child.stderr.on('data', chunk => process.stderr.write(chunk));
  const page = await app.firstWindow();
  assert.equal(await app.evaluate(({ app }) => app.getPath('userData')), userData);
  await page.getByRole('textbox', { name: '변환할 원문' }).fill('노동자는 친구와 여행을 갑니다.');
  await page.getByTestId('conversion-output').filter({ hasText: '로동자는 동무와 려행을 갑니다.' }).waitFor();
  assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
  assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences().contextIsolation), true);
  await page.getByRole('button', { name: '결과 복사' }).click();
  await page.getByRole('status').filter({ hasText: '변환 결과를 복사했습니다.' }).waitFor();
  assert.equal(await app.evaluate(({ clipboard }) => clipboard.readText()), '로동자는 동무와 려행을 갑니다.');
  console.log(`Desktop smoke passed: local conversion, isolated renderer, configurable user data, native clipboard. Platform: ${process.platform}. Packaged Windows installer execution requires separate validation.`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await Promise.race([app.close().catch(() => {}), new Promise(resolve => setTimeout(resolve, 3000))]);
  if (child.exitCode === null) child.kill('SIGTERM');
}
