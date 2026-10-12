const HOSTS = new Set(['github.com', 'korean.go.kr', 'www.korean.go.kr', 'ko.wikisource.org']);
function isAllowedExternal(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && HOSTS.has(url.hostname);
  } catch { return false; }
}
module.exports = { isAllowedExternal };
