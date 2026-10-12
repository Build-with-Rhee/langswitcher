import { ArrowUpRight, BookOpen, Check, FlaskConical, ShieldCheck } from 'lucide-react';
import { REFERENCES, RULES } from '../engine/rules';
export function About() {
  return <section className="reference-page">
    <div className="section-eyebrow"><FlaskConical size={16}/> HOW IT WORKS</div><h1>알 수 있는 규칙.<br/><span>확인할 수 있는 변화.</span></h1>
    <p className="page-intro">말사이는 문장을 생성하는 대신, 명시적인 대응 규칙을 적용합니다.<br/>변환 이유를 설명하고, 확인이 필요한 부분을 함께 알려드립니다.</p>
    <div className="about-grid"><article><ShieldCheck/><h2>내 기기에서 처리</h2><p>원문은 서버나 외부 AI로 전송하지 않습니다. 웹앱이 로드된 뒤에는 네트워크 없이도 변환할 수 있고, 데스크톱 앱은 완전히 오프라인으로 작동합니다.</p></article><article><BookOpen/><h2>{RULES.length}개의 등록 규칙</h2><p>두음 법칙, 합성어 표기, 외래어, 어휘와 일부 띄어쓰기 표현을 대응합니다. 미등록 단어와 URL·이메일·코드·보호어는 보존합니다.</p></article></div>
    <article className="quality-card"><div><span className="eyebrow">ACCURACY TARGET</span><h2>양방향 90% 이상을 향해</h2><p>독립 코퍼스 평가 전</p></div><div className="quality-explanation">정확도 목표는 독립 검수 문장 세트의 <strong>문장 완전 일치율</strong>로 측정합니다. 현재 회귀 테스트 통과는 기능 검증이며, 일반 문장의 90% 정확도를 입증하지 않습니다. 모든 규범을 완벽히 적용하거나 모든 의미를 보존한다고 보장하지 않습니다.</div></article>
    <h2 className="reference-title">어떻게 처리하나요?</h2><ol className="pipeline">{['입력을 정규화하고 보호 구간을 찾습니다.', '긴 표현부터 어휘·문맥·조사 조건을 검사합니다.', '겹치지 않는 규칙을 적용하고 변경 위치를 기록합니다.', '변경 이유와 검토가 필요한 어휘를 함께 보여줍니다.'].map(item => <li key={item}><Check size={16}/>{item}</li>)}</ol>
    <h2 className="reference-title">참고 규범과 검증 상태</h2><p className="muted">아래는 참고 문헌입니다. 현재 환경에서 원문 사이트 접근이 차단되어 원문 대조와 최신 판본 확인은 완료되지 않았습니다. 문화어 규범집의 위키문헌 전사본은 공식 기관 사이트가 아닙니다.</p>
    <div className="source-list">{Object.entries(REFERENCES).map(([key, source]) => <a key={key} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={17}/></a>)}</div>
    <div className="reference-note">단어의 뜻은 문맥에 따라 달라집니다. ‘이상’의 理想/以上, ‘양식’의 糧食/樣式처럼 뜻이 갈리는 표현은 일부 문맥 조건을 적용하며, 중요한 문서는 사람이 검토해야 합니다. 고유명사는 변환 설정에서 보호할 수 있습니다.</div>
  </section>;
}
