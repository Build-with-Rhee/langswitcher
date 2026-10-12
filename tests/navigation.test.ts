import { expect, it } from 'vitest';
import { createRequire } from 'node:module';
const { isAllowedExternal } = createRequire(import.meta.url)('../electron/navigation.cjs');
it('allows only named HTTPS references for user-initiated external links', () => {
  expect(isAllowedExternal('https://github.com/hslcrb/langswitcher')).toBe(true);
  expect(isAllowedExternal('https://korean.go.kr/kornorms/regltn/regltnView.do?regltn_code=0001')).toBe(true);
  expect(isAllowedExternal('https://ko.wikisource.org/wiki/조선말규범집_(2010)')).toBe(true);
});
it.each(['file:///etc/passwd','javascript:alert(1)','http://korean.go.kr/','https://evil.test/','https://github.com.evil.test/','https://user:password@github.com/','https://github.com:444/','not a URL'])('rejects external destination %s', url => expect(isAllowedExternal(url)).toBe(false));
