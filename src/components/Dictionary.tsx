import { useState } from 'react';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { REFERENCES, RULES } from '../engine/rules';
import type { Category } from '../engine/types';
export const CATEGORY_LABELS: Record<Category, string> = { orthography: '맞춤법·표기', vocabulary: '어휘', spacing: '띄어쓰기' };
export function Dictionary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const filtered = RULES.filter(rule => (category === 'all' || rule.category === category) && `${rule.south} ${rule.north} ${rule.explanation}`.includes(query.trim()));
  return <section className="reference-page">
    <div className="section-eyebrow"><BookOpen size={15}/> RULE LIBRARY</div><h1>말의 차이에는<br/><span>이유가 있습니다.</span></h1>
    <p className="page-intro">모델에 담긴 {RULES.length}개의 대응 규칙을 살펴보세요.<br/>어휘와 문맥에 따라 달라질 수 있는 표현은 확인 표시를 붙였습니다.</p>
    <div className="dictionary-tools"><div className="search-field"><Search size={19}/><input aria-label="규칙 검색" value={query} onChange={e => setQuery(e.target.value)} placeholder="표준어, 문화어 또는 규칙 검색"/></div><div className="filter-group">{(['all', 'orthography', 'vocabulary', 'spacing'] as const).map(value => <button key={value} className={value === category ? 'selected' : ''} onClick={() => setCategory(value)}>{value === 'all' ? '전체' : CATEGORY_LABELS[value]}</button>)}</div></div>
    <div className="dictionary-caption"><span>{filtered.length}개의 규칙</span><span>표준어 <ArrowRight size={13}/> 문화어</span></div>
    <div className="dictionary-list">{filtered.slice(0, 80).map(rule => <article key={rule.id} className="dictionary-row" data-testid="dictionary-row"><div className="word-pair"><strong>{rule.south}</strong><ArrowRight size={16}/><strong>{rule.north}</strong></div><span className={`category-pill ${rule.category}`}>{CATEGORY_LABELS[rule.category]}</span><p>{rule.explanation}</p><small>{REFERENCES[rule.source as keyof typeof REFERENCES]?.title} {rule.contextual && ' · 문맥 확인'}{rule.oneWay && ' · 순방향만 적용'}</small></article>)}</div>
    {filtered.length === 0 && <div className="empty-state">등록된 규칙이 없습니다. 다른 표현으로 검색해 보세요.</div>}
    {filtered.length > 80 && <p className="muted">처음 80개를 표시합니다. 검색이나 분류로 범위를 좁혀 주세요.</p>}
    <div className="reference-note">참고 문헌을 기록한 편집 규칙집입니다. 모든 항목의 원문 대조와 독립 언어 검수는 아직 완료되지 않았습니다.</div>
  </section>;
}
