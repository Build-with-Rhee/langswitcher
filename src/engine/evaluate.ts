import { convert } from './convert';
import type { Direction, EvaluationCase } from './types';

function distance(left: string, right: string): number {
  const a = Array.from(left), b = Array.from(right);
  let start = 0, endA = a.length, endB = b.length;
  while (start < endA && start < endB && a[start] === b[start]) start++;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB--; }
  let row = Array.from({ length: endB - start + 1 }, (_, i) => i);
  for (let i = start; i < endA; i++) {
    const next = [i - start + 1];
    for (let j = start; j < endB; j++) next.push(Math.min(next[j - start] + 1, row[j - start + 1] + 1, row[j - start] + Number(a[i] !== b[j])));
    row = next;
  }
  return row[row.length - 1];
}
export function evaluate(cases: EvaluationCase[]) {
  if (!Array.isArray(cases) || cases.length === 0) throw new Error('평가 코퍼스가 비어 있습니다.');
  const ids = new Set<string>();
  const directions: Record<Direction, { total: number; exactMatches: number; exactMatchRate: number | null }> = {
    'south-to-north': { total: 0, exactMatches: 0, exactMatchRate: null },
    'north-to-south': { total: 0, exactMatches: 0, exactMatchRate: null },
  };
  const failures: {id: string; actual: string; expected: string}[] = [];
  let exactMatches = 0, errors = 0, referenceCharacters = 0;
  for (const item of cases) {
    if (!item || typeof item.id !== 'string' || !item.id.trim() || typeof item.input !== 'string' || typeof item.expected !== 'string') throw new Error('id/input/expected 문자열이 필요한 평가 형식입니다.');
    if (ids.has(item.id)) throw new Error(`중복 평가 id: ${item.id}`);
    ids.add(item.id);
    if (item.direction !== 'south-to-north' && item.direction !== 'north-to-south') throw new Error(`지원하지 않는 방향: ${item.direction}`);
    if (item.input.length > 2000 || item.expected.length > 2000) throw new Error('평가 문장은 각각 2,000자까지 지원합니다.');
    const expected = item.expected.normalize('NFC');
    const actual = convert(item.input, item.direction).output;
    const pass = actual === expected;
    exactMatches += Number(pass);
    directions[item.direction].total++;
    directions[item.direction].exactMatches += Number(pass);
    errors += distance(actual, expected);
    referenceCharacters += Array.from(expected).length;
    if (!pass) failures.push({ id: item.id, actual, expected });
  }
  for (const value of Object.values(directions)) value.exactMatchRate = value.total ? value.exactMatches / value.total : null;
  return { total: cases.length, exactMatches, exactMatchRate: exactMatches / cases.length,
    characterErrorRate: referenceCharacters ? errors / referenceCharacters : null, directions, failures,
    targetMetOnSuppliedCases: Object.values(directions).every(value => value.total > 0 && value.exactMatchRate! >= 0.9) };
}
