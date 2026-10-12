import { expect, test } from '@playwright/test';

test('converts, highlights exact changes, and swaps using the current output', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '변환할 원문' }).fill('노동자는 내일 친구와 여행을 갑니다.');
  await expect(page.getByTestId('conversion-output')).toHaveText('로동자는 래일 동무와 려행을 갑니다.');
  await expect(page.getByTestId('conversion-output').locator('mark')).toHaveCount(4);
  await page.getByRole('button', { name: '변환 방향 바꾸기' }).click();
  await expect(page.getByRole('textbox', { name: '변환할 원문' })).toHaveValue('로동자는 래일 동무와 려행을 갑니다.');
  await expect(page.getByTestId('conversion-output')).toHaveText('노동자는 내일 친구와 여행을 갑니다.');
});
test('refuses an expanded result over the input limit without crashing or losing text', async ({ page }) => {
  await page.goto('/');
  const input = '가'.repeat(49997) + ' 거위'; // 50,000 → 50,001; same overflow with a small DOM
  await page.getByRole('textbox', { name: '변환할 원문' }).fill(input);
  await expect(page.getByTestId('conversion-output')).toContainText('게사니');
  await page.getByRole('button', { name: '변환 방향 바꾸기' }).click();
  await expect(page.getByRole('status')).toContainText('50,000');
  await expect(page.getByRole('textbox', { name: '변환할 원문' })).toHaveValue(input);
});
test('toggles vocabulary and highlighting independently', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '변환할 원문' }).fill('여행과 옥수수');
  await page.getByRole('button', { name: '변환 설정' }).click();
  await page.getByLabel('어휘 변환').uncheck();
  await expect(page.getByTestId('conversion-output')).toHaveText('려행과 옥수수');
  await page.getByRole('button', { name: '설정 닫기' }).click();
  await page.getByRole('switch', { name: '변경 부분 강조' }).click();
  await expect(page.getByTestId('conversion-output').locator('mark')).toHaveCount(0);
});
test('imports UTF-8 text and exports the current result', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'sample.txt', mimeType: 'text/plain', buffer: Buffer.from('친구와 옥수수') });
  await expect(page.getByTestId('conversion-output')).toHaveText('동무와 강냉이');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '결과 저장' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('말사이_문화어.txt');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString('utf8')).toBe('동무와 강냉이');
});
test('copies the latest text and rejects invalid imports without losing the input', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('textbox', { name: '변환할 원문' }).fill('친구');
  await page.getByRole('button', { name: '결과 복사' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('동무');
  await page.getByRole('textbox', { name: '변환할 원문' }).fill('옥수수');
  await page.getByRole('button', { name: '결과 복사' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('강냉이');
  await page.locator('input[type=file]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect(page.getByRole('status')).toContainText('.txt');
  await expect(page.getByRole('textbox', { name: '변환할 원문' })).toHaveValue('옥수수');
});
test('searches the rule dictionary and explains the unverified accuracy target', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '규칙 사전', exact: true }).click();
  await page.getByRole('textbox', { name: '규칙 검색' }).fill('옥수수');
  await expect(page.getByTestId('dictionary-row')).toHaveCount(1);
  await expect(page.getByTestId('dictionary-row')).toContainText('강냉이');
  await page.getByRole('button', { name: '규범과 검증', exact: true }).click();
  await expect(page.getByText('독립 코퍼스 평가 전', { exact: true })).toBeVisible();
});
test('keeps text literal, clears all stale results, and fits a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('textbox', { name: '변환할 원문' }).fill('<img src=x onerror=alert(1)> 친구');
  await expect(page.getByTestId('conversion-output')).toHaveText('<img src=x onerror=alert(1)> 동무');
  await expect(page.getByTestId('conversion-output').locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '원문 지우기' }).click();
  await expect(page.getByRole('textbox', { name: '변환할 원문' })).toHaveValue('');
  await expect(page.getByRole('button', { name: '결과 저장' })).toBeDisabled();
});
