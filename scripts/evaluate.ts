import { readFile, writeFile } from 'node:fs/promises';
import { evaluate } from '../src/engine/evaluate';
import { MODEL_VERSION } from '../src/engine/rules';

try {
  const regression = process.argv.includes('--regression');
  const args = process.argv.slice(2).filter(arg => arg !== '--regression');
  const file = regression ? 'data/regression.jsonl' : args[0];
  if (!file) throw new Error('사용법: npm run evaluate -- <검수된-corpus.jsonl> [report.json] 또는 --regression');
  const content = await readFile(file, 'utf8');
  const cases = content.split(/\r?\n/).filter(line => line.trim()).map((line, i) => {
    try { return JSON.parse(line); } catch { throw new Error(`${i + 1}번째 줄의 JSON 형식이 잘못되었습니다.`); }
  });
  const report = { modelVersion: MODEL_VERSION, evaluatedAt: new Date().toISOString(), corpus: file,
    scope: regression ? '자체 작성 회귀 예문. 일반 언어 정확도 또는 독립 평가 결과가 아닙니다.' : '사용자 제공 코퍼스. 출처·대표성·독립 검수 여부는 별도 확인이 필요합니다.', ...evaluate(cases) };
  const json = JSON.stringify(report, null, 2);
  const destination = regression ? args[0] : args[1];
  if (destination) await writeFile(destination, json + '\n');
  console.log(json);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
