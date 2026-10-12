import { describe, expect, it } from 'vitest';
import { convert } from '../src/engine/convert';

describe('bidirectional rules, not global syllable substitution', () => {
  it.each([
    ['노동자는 내일 여행을 갑니다.', '로동자는 래일 려행을 갑니다.'],
    ['여름에는 여자 친구와 옥수수를 먹어요.', '여름에는 녀자 동무와 강냉이를 먹어요.'],
    ['역사와 예술을 연구합니다.', '력사와 예술을 연구합니다.'],
    ['이론과 논리를 설명합니다.', '리론과 론리를 설명합니다.'],
    ['냉면과 냉수를 준비합니다.', '랭면과 랭수를 준비합니다.'],
    ['컴퓨터로 휴대전화 정보를 확인합니다.', '콤퓨터로 손전화 정보를 확인합니다.'],
    ['아름다운 여름의 이야기와 이름', '아름다운 여름의 이야기와 이름'],
    ['노동절에 노동조합을 만납니다.', '로동절에 로동조합을 만납니다.'],
    ['여행객에게 여행을 권합니다.', '려행객에게 려행을 권합니다.'],
    ['내일은 여성의 날입니다.', '래일은 녀성의 날입니다.'],
    ['법률을 공부하는 법률가', '법률을 공부하는 법률가'],
    ['나뭇잎과 찻잔, 햇빛을 봅니다.', '나무잎과 차잔, 해빛을 봅니다.'],
  ])('%s → %s', (input, output) => expect(convert(input, 'south-to-north').output).toBe(output));

  it.each([
    ['로동자는 래일 려행을 갑니다.', '노동자는 내일 여행을 갑니다.'],
    ['녀자 동무와 강냉이를 먹어요.', '여자 친구와 옥수수를 먹어요.'],
    ['력사와 리론, 론리와 랭면', '역사와 이론, 논리와 냉면'],
    ['콤퓨터와 손전화', '컴퓨터와 휴대전화'],
    ['나무잎과 차잔, 해빛', '나뭇잎과 찻잔, 햇빛'],
  ])('%s → %s', (input, output) => expect(convert(input, 'north-to-south').output).toBe(output));

  it('adjusts particles when the transformed noun changes its final consonant', () => {
    expect(convert('도시락을 가져오고 친구가 옵니다.', 'south-to-north').output).toBe('곽밥을 가져오고 동무가 옵니다.');
    expect(convert('헬리콥터를 봅니다.', 'south-to-north').output).toBe('직승기를 봅니다.');
    expect(convert('채소는 신선해요.', 'south-to-north').output).toBe('남새는 신선해요.');
    expect(convert('채소로 만든 음식', 'south-to-north').output).toBe('남새로 만든 음식');
  });
  it('adjusts accepted copula, quotation, disjunction and casual-particle forms in both directions', () => {
    expect(convert('운동화예요. 운동화라고 합니다. 운동화나 구두를 신습니다.', 'south-to-north').output).toBe('운동신이에요. 운동신이라고 합니다. 운동신이나 구두를 신습니다.');
    expect(convert('운동신이에요. 운동신이라고 합니다. 운동신이나 구두를 신습니다.', 'north-to-south').output).toBe('운동화예요. 운동화라고 합니다. 운동화나 구두를 신습니다.');
    expect(convert('운동화랑 운동화라는 말. 운동화라도 운동화였다.', 'south-to-north').output).toBe('운동신이랑 운동신이라는 말. 운동신이라도 운동신이었다.');
  });
  it('protects variable-length Markdown code delimiters including embedded single backticks', () => {
    expect(convert('``친구`` 노동', 'south-to-north').output).toBe('``친구`` 로동');
    expect(convert('``노동 `친구` 여행`` 친구', 'south-to-north').output).toBe('``노동 `친구` 여행`` 동무');
    expect(convert('````\n노동 ``` 여행\n````\n친구', 'south-to-north').output).toBe('````\n노동 ``` 여행\n````\n동무');
  });
  it('uses the longer dictionary entry first', () => {
    const result = convert('휴대전화와 노동조합', 'south-to-north');
    expect(result.output).toBe('손전화와 로동조합');
    expect(result.changes).toHaveLength(2);
  });
  it('preserves URLs, emails, inline code, and fenced code', () => {
    const text = 'https://example.com/노동?친구=1 user+친구@example.com `노동 친구`\n```txt\n노동 친구\n```\n노동';
    expect(convert(text, 'south-to-north').output).toBe(text.slice(0, -2) + '로동');
  });
  it('preserves explicit names including their particles', () => {
    expect(convert('노동은 이름입니다. 노동자와 친구', 'south-to-north', { protectedWords: ['노동'] }).output).toBe('노동은 이름입니다. 노동자와 동무');
  });
  it('does not replace a known word inside an unknown compound or native word', () => {
    const text = '여름 노래 논밭 여행성 이름 이론서가짜 노동가짜';
    expect(convert(text, 'south-to-north').output).toBe(text);
  });
  it('keeps shared nouns and homographs unchanged', () => {
    expect(convert('내가 내 이름을 쓰고 그는 일을 한다. 연기와 유리', 'south-to-north').output).toBe('내가 내 이름을 쓰고 그는 일을 한다. 연기와 유리');
  });
  it('distinguishes effort from labor and entry from a standpoint', () => {
    expect(convert('노력을 하면 입장을 할 수 있다.', 'south-to-north').output).toBe('노력을 하면 입장을 할수 있다.');
    expect(convert('인력을 공급하고 노력을 투입합니다.', 'south-to-north').output).toBe('인력을 공급하고 로력을 투입합니다.');
    expect(convert('명확한 입장을 밝힙니다.', 'south-to-north').output).toBe('명확한 립장을 밝힙니다.');
  });
  it('preserves north homographs for sea-subject, attribution and an invitation', () => {
    expect(convert('바다가 넓다. 귀가 늦다. 재산의 귀속. 초대를 받았다.', 'north-to-south').output).toBe('바다가 넓다. 귀가 늦다. 재산의 귀속. 초대를 받았다.');
    expect(convert('모래가 있는 바다가에서 산책합니다.', 'north-to-south').output).toBe('모래가 있는 바닷가에서 산책합니다.');
  });
  it('does not leak a homograph cue across sentences', () => {
    expect(convert('꿈을 이룹니다. 3개 이상 필요합니다.', 'south-to-north').output).toBe('꿈을 이룹니다. 3개 이상 필요합니다.');
  });
  it('does not mistake an invitation refusal for a candle-related context', () => {
    expect(convert('초대에 불참합니다.', 'north-to-south').output).toBe('초대에 불참합니다.');
    expect(convert('초대에 불을 켭니다.', 'north-to-south').output).toBe('촛대에 불을 켭니다.');
  });
  it('applies registered spacing and supports disabling it', () => {
    expect(convert('할 수 있습니다.', 'south-to-north').output).toBe('할수 있습니다.');
    expect(convert('할수 있습니다.', 'north-to-south').output).toBe('할 수 있습니다.');
    expect(convert('할 수 있습니다.', 'south-to-north', { spacing: false }).output).toBe('할 수 있습니다.');
  });
  it('can disable vocabulary while retaining orthography', () => {
    expect(convert('여행과 옥수수', 'south-to-north', { vocabulary: false }).output).toBe('려행과 옥수수');
  });
  it('can disable orthography', () => {
    expect(convert('여행과 옥수수', 'south-to-north', { orthography: false }).output).toBe('여행과 강냉이');
  });
  it('preserves whitespace and punctuation without inventing spacing rules', () => {
    expect(convert('노동\t친구\r\n  여행! 🙂', 'south-to-north').output).toBe('로동\t동무\r\n  려행! 🙂');
  });
  it('provides lossless source and output segments and exact offsets', () => {
    const result = convert('🙂 친구와 도시락, 여행!', 'south-to-north');
    expect(result.output).toBe('🙂 동무와 곽밥, 려행!');
    expect(result.sourceSegments.map(s => s.text).join('')).toBe(result.source);
    expect(result.outputSegments.map(s => s.text).join('')).toBe(result.output);
    for (const change of result.changes) {
      expect(result.source.slice(change.sourceStart, change.sourceEnd)).toBe(change.before);
      expect(result.output.slice(change.outputStart, change.outputEnd)).toBe(change.after);
      expect(change.rule.explanation.length).toBeGreaterThan(5);
      expect(change.rule.source).toBeTruthy();
    }
  });
  it('normalizes decomposed Hangul and makes normalized offsets explicit', () => {
    const result = convert('노동'.normalize('NFD'), 'south-to-north');
    expect(result.source).toBe('노동');
    expect(result.output).toBe('로동');
    expect(result.normalized).toBe(true);
  });
  it('does not convert a result again in the same direction', () => {
    const result = convert('노동과 친구, 여행', 'south-to-north').output;
    expect(convert(result, 'south-to-north').output).toBe(result);
  });
  it('treats HTML as literal text and does not mangle tags', () => {
    expect(convert('<script>alert(1)</script> 친구', 'south-to-north').output).toBe('<script>alert(1)</script> 동무');
  });
  it('rejects oversized input and invalid directions', () => {
    expect(() => convert('가'.repeat(50_001), 'south-to-north')).toThrow('50,000');
    // @ts-expect-error runtime validation for non-TypeScript callers
    expect(() => convert('친구', 'invalid')).toThrow('방향');
  });
  it('accepts exactly 50,000 characters and empty input', () => {
    expect(convert('가'.repeat(50_000), 'south-to-north').output.length).toBe(50_000);
    expect(convert('', 'south-to-north').changes).toHaveLength(0);
  });
});
