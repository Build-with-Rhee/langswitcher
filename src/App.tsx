import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeftRight, ArrowRight, Check, ChevronDown, CodeXml, Copy, FileText, Info, Languages, Leaf, LockKeyhole, MonitorDown, Settings2, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import { convert, MAX_INPUT_LENGTH } from './engine/convert';
import { MODEL_VERSION, REFERENCES, RULES } from './engine/rules';
import type { Direction, Options } from './engine/types';
import { HighlightText } from './components/HighlightText';
import { Settings } from './components/Settings';
import { Dictionary, CATEGORY_LABELS } from './components/Dictionary';
import { About } from './components/About';

const EXAMPLES = [
  { label: '일상의 문장', text: '내일은 친구와 함께 기차 여행을 떠납니다.\n도시락에 옥수수와 채소를 담고, 휴대전화로 여행 정보를 확인합니다.' },
  { label: '맞춤법과 표기', text: '노동자는 역사와 이론을 공부합니다.\n햇빛 아래 나뭇잎이 반짝이고, 컴퓨터로 연락을 할 수 있습니다.' },
  { label: '문화어 예문', text: '녀자 동무가 래일 려행을 떠납니다.\n곽밥에 강냉이와 남새를 담았습니다.', direction: 'north-to-south' as Direction },
];
type DownloadManifest = { version: string; artifacts: { name: string; label: string; size: number; sha256: string }[] };

export default function App() {
  const [page, setPage] = useState<'converter' | 'dictionary' | 'about'>('converter');
  const [text, setText] = useState(EXAMPLES[0].text);
  const [direction, setDirection] = useState<Direction>('south-to-north');
  const [highlight, setHighlight] = useState(true);
  const [options, setOptions] = useState<Options>({ orthography: true, vocabulary: true, spacing: true });
  const [protection, setProtection] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [manifest, setManifest] = useState<DownloadManifest | null>(null);
  const [notice, setNotice] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [composing, setComposing] = useState(false);
  const [committedText, setCommittedText] = useState(text);
  const inputRef = useRef<HTMLTextAreaElement>(null), overlayRef = useRef<HTMLDivElement>(null), fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    fetch('./downloads/manifest.json').then(response => response.ok ? response.json() : null).then(value => { if (value && Array.isArray(value.artifacts)) setManifest(value); }).catch(() => {});
  }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { if (!composing) setCommittedText(text); }, [text, composing]);
  const result = useMemo(() => convert(committedText, direction, { ...options, protectedWords: protection.split(/[,\n]/).map(s => s.trim()).filter(Boolean) }), [committedText, direction, options, protection]);
  const from = direction === 'south-to-north' ? '표준어' : '문화어', to = direction === 'south-to-north' ? '문화어' : '표준어';
  const contextual = result.changes.filter(change => change.rule.contextual).length;
  function swap() {
    if (result.output.length > MAX_INPUT_LENGTH) {
      setNotice('결과가 50,000자를 초과해 방향을 바꿀 수 없습니다. 결과를 저장한 뒤 나누어 변환해 주세요.');
      return;
    }
    setText(result.output); setCommittedText(result.output); setDirection(direction === 'south-to-north' ? 'north-to-south' : 'south-to-north');
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (!/\.txt$/i.test(file.name)) throw new Error('UTF-8 형식의 .txt 파일을 선택해 주세요.');
      if (file.size > 200_000) throw new Error('파일은 200KB 이하로 선택해 주세요.');
      const value = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (value.length > MAX_INPUT_LENGTH) throw new Error('입력은 50,000자까지 지원합니다.');
      setText(value); setCommittedText(value); setNotice('텍스트 파일을 불러왔습니다.');
    } catch (error) { setNotice(error instanceof Error ? error.message : '파일을 읽을 수 없습니다.'); }
    if (fileRef.current) fileRef.current.value = '';
  }
  async function copy() {
    try { await navigator.clipboard.writeText(result.output); setNotice('변환 결과를 복사했습니다.'); }
    catch { setNotice('복사 권한을 확인하거나 결과를 선택해 복사해 주세요.'); }
  }
  function save() {
    const url = URL.createObjectURL(new Blob([result.output], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `말사이_${to}.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice('변환 결과를 저장했습니다.');
  }
  const changes = expanded ? result.changes : result.changes.slice(0, 6);
  return <div className="app-shell">
    <header className="site-header"><div className="header-inner">
      <button className="brand" onClick={() => setPage('converter')} aria-label="말사이 홈"><span className="brand-symbol"><ArrowLeftRight size={22}/></span><span>말사이<span className="brand-dot">.</span></span><span className="brand-sub">LANGSWITCHER</span></button>
      <nav aria-label="주 메뉴"><button className={page === 'converter' ? 'active' : ''} onClick={() => setPage('converter')}>언어 변환</button><button className={page === 'dictionary' ? 'active' : ''} onClick={() => setPage('dictionary')}>규칙 사전</button><button className={page === 'about' ? 'active' : ''} onClick={() => setPage('about')}>규범과 검증</button></nav>
      <button className="desktop-button" onClick={() => setDownloadOpen(true)}><MonitorDown size={16}/><span>데스크톱 앱</span><ArrowDownToLine size={14}/></button>
    </div></header>
    <main>
      {page === 'dictionary' ? <Dictionary/> : page === 'about' ? <About/> : <>
        <section className="hero"><div className="hero-copy"><div className="section-eyebrow"><span className="little-line"/> DIFFERENT WORDS, SAME HEART</div><h1>서로 다른 말,<br className="mobile-break"/> <span>더 가까운 우리.</span></h1><p>표준어와 문화어 사이의 작은 차이를 잇습니다.<br/>규칙을 따라 바꾸고, 달라진 표현을 한눈에 확인하세요.</p></div><div className="hero-stamp"><div className="stamp-text">말과 말 사이를 잇다</div><span>가<span className="stamp-arrow"><ArrowRight size={26}/></span>나</span><small>하나의 언어, 두 가지 표현</small></div></section>
        <section className="converter-section" aria-label="언어 변환기">
          <div className="converter-toolbar"><div className="direction-picker"><span className="direction-tag">{from}</span><button className="swap-button" onClick={swap} aria-label="변환 방향 바꾸기"><ArrowLeftRight size={16}/></button><span className="direction-tag target">{to}</span><span className="live-badge"><span/> 실시간 변환</span></div><div className="toolbar-actions"><button className="highlight-switch" role="switch" aria-label="변경 부분 강조" aria-checked={highlight} onClick={() => setHighlight(!highlight)}><span className={`toggle ${highlight ? 'on' : ''}`}><span/></span><span>변경 부분 강조</span></button><span className="toolbar-divider"/><button className="text-button" aria-label="변환 설정" onClick={() => setSettingsOpen(true)}><Settings2 size={16}/><span>변환 설정</span></button></div></div>
          <div className="editor-card"><div className="editors">
            <div className="editor-panel source-panel"><div className="panel-heading"><div><span className="language-dot"/><h2>{from}</h2><span className="panel-caption">원문</span></div><button className="icon-button" aria-label="원문 지우기" onClick={() => { setText(''); setCommittedText(''); inputRef.current?.focus(); }} disabled={!text}><Trash2 size={16}/></button></div>
              <div className="source-editor"><div className="source-highlight" aria-hidden="true" ref={overlayRef}><HighlightText segments={composing ? [{text}] : result.sourceSegments} result={result} enabled={highlight && !composing}/>{'\n'}</div><textarea ref={inputRef} aria-label="변환할 원문" placeholder="변환할 문장을 입력해 주세요. 말의 차이를 함께 찾아볼게요." value={text} maxLength={MAX_INPUT_LENGTH} spellCheck={false} className={text ? 'overlaid' : ''} onChange={event => setText(event.target.value)} onCompositionStart={() => setComposing(true)} onCompositionEnd={event => { setComposing(false); setText(event.currentTarget.value); setCommittedText(event.currentTarget.value); }} onScroll={event => { if (overlayRef.current) overlayRef.current.scrollTop = event.currentTarget.scrollTop; }}/></div>
              <div className="panel-bottom"><div className="example-menu-wrap"><button className="text-button example-trigger" onClick={() => setExamplesOpen(!examplesOpen)} aria-expanded={examplesOpen}><Sparkles size={14}/> 예문 불러오기 <ChevronDown size={13}/></button>{examplesOpen && <div className="example-menu">{EXAMPLES.map(example => <button key={example.label} onClick={() => { setText(example.text); setCommittedText(example.text); setDirection(example.direction ?? 'south-to-north'); setExamplesOpen(false); }}>{example.label}<ArrowRight size={14}/></button>)}</div>}</div><span className="character-count">{text.length.toLocaleString()} <span>/ 50,000자</span></span></div>
            </div>
            <div className="editor-panel target-panel"><div className="panel-heading"><div><span className="language-dot green"/><h2>{to}</h2><span className="panel-caption">변환 결과</span></div><span className="result-badge"><Check size={12}/> {result.changes.length}곳 변환</span></div><div className={`output-editor ${!text ? 'is-empty' : ''}`} data-testid="conversion-output" aria-label="변환 결과" role="region"><HighlightText segments={result.outputSegments} result={result} enabled={highlight}/>{!text && <span className="output-placeholder">변환된 문장이 여기에 표시됩니다.</span>}</div><div className="panel-bottom"><span className="result-local"><LockKeyhole size={12}/> 기기 안에서 안전하게</span><span className="character-count">{result.output.length.toLocaleString()}자</span></div></div>
          </div><div className="editor-footer"><div className="legend"><span><i className="orthography"/>맞춤법·표기</span><span><i className="vocabulary"/>어휘</span><span><i className="spacing"/>띄어쓰기</span></div><div className="file-actions"><input type="file" ref={fileRef} accept=".txt,text/plain" hidden onChange={event => importFile(event.target.files?.[0])}/><button className="text-button" onClick={() => fileRef.current?.click()}><FileText size={15}/><span>파일 불러오기</span></button><button className="outlined-button" aria-label="결과 저장" disabled={!result.output} onClick={save}><ArrowDownToLine size={15}/><span>저장</span></button><button className="primary" disabled={!result.output} onClick={copy}><Copy size={15}/><span>결과 복사</span></button></div></div></div>
          <div className="privacy-note"><ShieldCheck size={15}/><span>입력한 문장은 외부로 전송되지 않습니다.</span><span className="privacy-dot">·</span><span>로컬 규칙 모델 v{MODEL_VERSION}</span></div>
        </section>
        <section className="changes-section"><div className="changes-heading"><div><span className="section-eyebrow">A CLOSER LOOK</span><h2>어떤 말이 달라졌나요? <span>{result.changes.length}</span></h2></div><button className="text-button" onClick={() => setPage('dictionary')}>규칙 사전 살펴보기 <ArrowRight size={15}/></button></div>
          {result.changes.length ? <><div className="change-grid">{changes.map(change => <article className="change-card" key={change.id}><span className={`category-pill ${change.rule.category}`}>{CATEGORY_LABELS[change.rule.category]}</span><div className="change-pair"><span>{change.before}</span><ArrowRight size={17}/><strong>{change.after}</strong></div><p>{change.rule.category === 'vocabulary' ? '같은 대상을 가리키는 서로 다른 표현' : change.rule.category === 'spacing' ? '등록된 의존 명사 표현의 띄어쓰기 차이' : change.rule.id.startsWith('initial') ? '한자어 첫소리에 적용되는 두음 법칙 차이' : change.rule.id.startsWith('sai') ? '합성어의 사이시옷·위/웃 표기 차이' : '남북 외래어 표기 방식의 차이'}</p><details><summary>변환 근거 보기 {change.rule.contextual && <span>· 문맥 확인</span>}</summary><p>{change.rule.explanation}</p><small>{REFERENCES[change.rule.source as keyof typeof REFERENCES]?.title}</small></details></article>)}</div>{result.changes.length > 6 && <button className="show-more" onClick={() => setExpanded(!expanded)}>{expanded ? '간단히 보기' : `변경 ${result.changes.length - 6}곳 더 보기`}<ChevronDown size={15}/></button>}</> : <div className="empty-state"><Languages size={25}/><p>{text ? '등록된 규칙에 해당하는 차이가 없습니다.' : '문장을 입력하면 달라진 표현과 이유를 보여드립니다.'}</p><small>변경이 없다는 것이 모든 규범에 맞는다는 뜻은 아닙니다.</small></div>}
          {contextual > 0 && <div className="context-note"><Info size={16}/><span>어휘·중의적 표현 {contextual}곳은 문맥 확인이 필요합니다. 이름이나 고유명사는 변환 설정에서 보호할 수 있어요.</span></div>}
        </section>
        <section className="bottom-banner"><div className="banner-icon"><Leaf size={27}/></div><div><h3>말의 차이를 넘어, 뜻은 그대로.</h3><p>{RULES.length}개의 명시적인 규칙과 함께 표현의 차이를 알아보세요.</p></div><button onClick={() => setPage('about')}>변환 원리 알아보기 <ArrowRight size={16}/></button></section>
      </>}
    </main>
    <footer className="site-footer"><div><span className="footer-brand">말사이.</span><span>말과 말 사이를 잇는 작은 다리</span></div><div><span>독립 정확도 평가 전 · 실험적 모델</span><a href="https://github.com/hslcrb/langswitcher" target="_blank" rel="noreferrer" aria-label="GitHub 저장소"><CodeXml size={17}/></a></div></footer>
    {settingsOpen && <Settings options={options} update={setOptions} protection={protection} setProtection={setProtection} close={() => setSettingsOpen(false)}/>}
    {downloadOpen && <DownloadDialog manifest={manifest} close={() => setDownloadOpen(false)}/>}
    {notice && <div role="status" className="toast"><Check size={16}/>{notice}<button aria-label="알림 닫기" onClick={() => setNotice('')}><X size={15}/></button></div>}
  </div>;
}
function DownloadDialog({ manifest, close }: { manifest: DownloadManifest | null; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="settings-dialog download-dialog" aria-labelledby="download-title" onCancel={close} onClick={event => { if (event.target === ref.current) close(); }}><div className="dialog-header"><span className="icon-tile"><MonitorDown size={20}/></span><h2 id="download-title">내 컴퓨터에서도, 말사이</h2><button className="icon-button" aria-label="다운로드 닫기" onClick={close}><X size={20}/></button></div><p className="muted">Windows 10/11 · 64비트 · 인터넷 없이 사용</p>{manifest?.artifacts.length ? <div className="download-list">{manifest.artifacts.map(artifact => <div key={artifact.name}><a className="primary" href={`./downloads/${artifact.name}`} download><ArrowDownToLine size={17}/>{artifact.label}<span>{(artifact.size / 1024 / 1024).toFixed(0)} MB</span></a><details><summary>SHA-256 확인</summary><code>{artifact.sha256}</code></details></div>)}</div> : <div className="reference-note">이 배포에는 Windows 실행 파일이 포함되어 있지 않습니다. 저장소의 Windows 빌드 절차로 생성할 수 있습니다.</div>}<small className="muted">서명되지 않은 실행 파일입니다. Windows 실행 검증은 별도로 필요합니다. 웹과 동일한 규칙 모델을 사용합니다.</small></dialog>;
}
