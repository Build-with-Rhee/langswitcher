import { AMBIGUOUS_CONTEXT, NORTH_HOMOGRAPH_CONTEXT, MODEL_VERSION, RULES } from './rules';
import type { Change, ConversionResult, Direction, Options, Rule, Segment } from './types';

export const MAX_INPUT_LENGTH = 50_000;
const WORD = /[\p{L}\p{N}\p{M}_]/u;
const SUFFIXES = new Set([
  '', '은', '는', '이', '가', '을', '를', '과', '와', '으로', '로', '아', '야', '에', '에서', '에게', '한테', '께', '의',
  '도', '만', '부터', '까지', '보다', '처럼', '같이', '조차', '마저', '마다', '밖에', '라고', '이라는', '라는', '이고',
  '이다', '입니다', '이에요', '예요', '이었다', '였다', '이면', '라면', '이라면', '이랑', '랑', '하고', '든', '든지',
  '뿐', '뿐이다', '뿐입니다', '들', '들의', '들은', '들이', '들을', '들과', '들에', '들에게', '들만', '들도',
  '으로는', '로는', '으로도', '로도', '으로부터', '로부터', '에서는', '에서도', '에게는', '에게도', '에는', '에도',
  '만은', '까지는', '부터는', '와는', '과는', '이나', '나', '이든', '이든지', '이라도', '라도', '이나마', '나마', '이라고', '면',
  '적', '적인', '적으로', '적이다', '적입니다', '적이고', '적이며', '하다', '한다', '합니다', '하는', '하며',
  '했다', '했습니다', '하기', '하여', '해서',
]);
const PARTICLES: [string, string][] = [
  ['이라는', '라는'], ['이라고', '라고'], ['이라면', '라면'], ['이나마', '나마'], ['이든지', '든지'],
  ['이라도', '라도'], ['이에요', '예요'], ['이었다', '였다'], ['이랑', '랑'], ['이면', '면'], ['이나', '나'], ['이든', '든'],
  ['으로', '로'], ['은', '는'], ['이', '가'], ['을', '를'], ['과', '와'], ['아', '야'],
];
function finalConsonant(word: string): number {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 ? code % 28 : 0;
}
function adjustParticle(suffix: string, before: string, after: string): string {
  const previous = finalConsonant(before), next = finalConsonant(after);
  for (const [closed, open] of PARTICLES) {
    const previousClosed = closed === '으로' ? previous !== 0 && previous !== 8 : previous !== 0;
    const nextClosed = closed === '으로' ? next !== 0 && next !== 8 : next !== 0;
    const expected = previousClosed ? closed : open;
    if (previousClosed !== nextClosed && suffix.startsWith(expected)) {
      const rest = suffix.slice(expected.length);
      if (['', '는', '도', '만', '부터'].includes(rest)) return (nextClosed ? closed : open) + rest;
    }
  }
  return suffix;
}
function codeRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char !== '`' && char !== '~') { i++; continue; }
    let runEnd = i + 1;
    while (text[runEnd] === char) runEnd++;
    const length = runEnd - i;
    if (char === '~' && length < 3) { i = runEnd; continue; }
    const delimiter = char.repeat(length);
    const fenced = length >= 3 && /^[ \t]{0,3}$/.test(text.slice(text.lastIndexOf('\n', i - 1) + 1, i));
    let close = text.indexOf(delimiter, runEnd);
    let end = -1;
    while (close !== -1) {
      let closeEnd = close + length;
      while (text[closeEnd] === char) closeEnd++;
      const lineStart = text.lastIndexOf('\n', close - 1) + 1;
      const nextLine = text.indexOf('\n', closeEnd);
      const correctClose = fenced
        ? /^[ \t]{0,3}$/.test(text.slice(lineStart, close)) && /^[ \t\r]*$/.test(text.slice(closeEnd, nextLine === -1 ? text.length : nextLine))
        : text[close - 1] !== char && closeEnd - close === length;
      if (correctClose) { end = closeEnd; break; }
      close = text.indexOf(delimiter, closeEnd);
    }
    if (end === -1) {
      const newline = text.indexOf('\n', runEnd);
      end = fenced || newline === -1 ? text.length : newline;
    }
    ranges.push([i, end]); i = end;
  }
  return ranges;
}
function protectedRanges(text: string, words: string[]): [number, number][] {
  const ranges: [number, number][] = codeRanges(text);
  const pattern = /(?:https?:\/\/|www\.)[^\s<>"`]+|(?<![\p{L}\p{N}._%+\-])[\p{L}\p{N}._%+\-]+@[\p{L}\p{N}.\-]+\.[a-z]{2,}/giu;
  for (const match of text.matchAll(pattern)) ranges.push([match.index!, match.index! + match[0].length]);
  for (const raw of words) {
    const word = raw.trim().normalize('NFC');
    if (!word) continue;
    let at = text.indexOf(word);
    while (at !== -1) {
      let end = at + word.length;
      while (end < text.length && WORD.test(text[end])) end++;
      if (at === 0 || !WORD.test(text[at - 1])) ranges.push([at, end]);
      at = text.indexOf(word, at + word.length);
    }
  }
  return ranges.sort((a, b) => a[0] - b[0]);
}
interface Candidate { from: string; to: string; rule: Rule }
const candidates: Record<Direction, Map<string, Candidate[]>> = { 'south-to-north': new Map(), 'north-to-south': new Map() };
for (const direction of Object.keys(candidates) as Direction[]) {
  for (const rule of RULES) {
    if (direction === 'north-to-south' && rule.oneWay) continue;
    const from = direction === 'south-to-north' ? rule.south : rule.north;
    const to = direction === 'south-to-north' ? rule.north : rule.south;
    const bucket = candidates[direction].get(from[0]) ?? [];
    bucket.push({ from, to, rule }); candidates[direction].set(from[0], bucket);
  }
  for (const bucket of candidates[direction].values()) bucket.sort((a, b) => b.from.length - a.from.length);
}
export function convert(text: string, direction: Direction, options: Options = {}): ConversionResult {
  if (direction !== 'south-to-north' && direction !== 'north-to-south') throw new Error('지원하지 않는 변환 방향입니다.');
  if (text.length > MAX_INPUT_LENGTH) throw new Error('입력은 50,000자까지 지원합니다.');
  const source = text.normalize('NFC');
  const protectedSpans = protectedRanges(source, (options.protectedWords ?? []).slice(0, 200));
  const sourceSegments: Segment[] = [], outputSegments: Segment[] = [], changes: Change[] = [];
  let output = '', unchangedStart = 0, at = 0, rangeIndex = 0;
  const appendUnchanged = (end: number) => {
    const part = source.slice(unchangedStart, end);
    if (part) { sourceSegments.push({ text: part }); outputSegments.push({ text: part }); output += part; }
  };
  while (at < source.length) {
    while (rangeIndex < protectedSpans.length && protectedSpans[rangeIndex][1] <= at) rangeIndex++;
    const range = protectedSpans[rangeIndex];
    if (range && range[0] <= at) { at = range[1]; continue; }
    if (at > 0 && WORD.test(source[at - 1])) { at++; continue; }
    let selected: { candidate: Candidate; end: number; suffix: string } | undefined;
    for (const candidate of candidates[direction].get(source[at]) ?? []) {
      if (options[candidate.rule.category] === false || !source.startsWith(candidate.from, at)) continue;
      let end = at + candidate.from.length;
      while (end < source.length && WORD.test(source[end])) end++;
      const suffix = source.slice(at + candidate.from.length, end);
      if (!SUFFIXES.has(suffix) || (range && range[0] < end)) continue;
      const guard = direction === 'south-to-north' ? AMBIGUOUS_CONTEXT[candidate.rule.south] : NORTH_HOMOGRAPH_CONTEXT[candidate.rule.north];
      if (guard) {
        const before = source.slice(Math.max(0, at - 45), at).split(/[.!?。！？\n]/).at(-1)!;
        const after = source.slice(end, Math.min(source.length, end + 45)).split(/[.!?。！？\n]/)[0];
        if (!guard.test(before + candidate.from + after)) continue;
      }
      selected = { candidate, end, suffix }; break;
    }
    if (!selected) { at++; continue; }
    appendUnchanged(at);
    const { candidate, end, suffix } = selected;
    const before = source.slice(at, end), after = candidate.to + adjustParticle(suffix, candidate.from, candidate.to);
    const id = changes.length;
    changes.push({ id, rule: candidate.rule, before, after, sourceStart: at, sourceEnd: end, outputStart: output.length, outputEnd: output.length + after.length });
    sourceSegments.push({ text: before, changeId: id }); outputSegments.push({ text: after, changeId: id });
    output += after; at = end; unchangedStart = end;
  }
  appendUnchanged(source.length);
  return { source, output, changes, sourceSegments, outputSegments, normalized: text !== source, modelVersion: MODEL_VERSION };
}
