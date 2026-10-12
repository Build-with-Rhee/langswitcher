import { expect, it } from 'vitest';
import { evaluate } from '../src/engine/evaluate';
it('reports direction-specific accuracy and concrete failures rather than claiming rule coverage is accuracy', () => {
  const result = evaluate([
    { id: 's1', direction: 'south-to-north', input: '친구', expected: '동무' },
    { id: 's2', direction: 'south-to-north', input: '미등록', expected: '다른 표현' },
    { id: 'n1', direction: 'north-to-south', input: '려행', expected: '여행' },
  ]);
  expect(result.total).toBe(3);
  expect(result.exactMatches).toBe(2);
  expect(result.exactMatchRate).toBeCloseTo(2 / 3);
  expect(result.directions['south-to-north'].exactMatchRate).toBe(0.5);
  expect(result.directions['north-to-south'].exactMatchRate).toBe(1);
  expect(result.failures).toEqual([{ id: 's2', actual: '미등록', expected: '다른 표현' }]);
  expect(result.characterErrorRate).toBeGreaterThan(0);
});
it('rejects zero-test, duplicate-id, and invalid-direction evaluations', () => {
  expect(() => evaluate([])).toThrow('비어');
  const item = { id: 'same', direction: 'south-to-north' as const, input: '', expected: '' };
  expect(() => evaluate([item, item])).toThrow('중복');
  // @ts-expect-error check untrusted JSON
  expect(() => evaluate([{ ...item, direction: 'wrong' }])).toThrow('방향');
});
it('uses code points for the character error denominator, including emoji', () => {
  const result = evaluate([{ id: 'emoji', direction: 'south-to-north', input: '🙂', expected: '🙂' }]);
  expect(result.characterErrorRate).toBe(0);
  expect(result.exactMatchRate).toBe(1);
});
it('reports no-data direction as null rather than 100%', () => {
  const result = evaluate([{ id: 's1', direction: 'south-to-north', input: '친구', expected: '동무' }]);
  expect(result.directions['north-to-south'].total).toBe(0);
  expect(result.directions['north-to-south'].exactMatchRate).toBeNull();
});
