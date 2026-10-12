import { useEffect, useRef } from 'react';
import { LockKeyhole, Settings2, X } from 'lucide-react';
import type { Options } from '../engine/types';
export function Settings({ options, update, protection, setProtection, close }: { options: Options; update: (options: Options) => void; protection: string; setProtection: (value: string) => void; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  const fields = [
    ['orthography', '맞춤법·표기 변환', '두음 법칙, 사이시옷, 등록 외래어 표기'],
    ['vocabulary', '어휘 변환', '옥수수 → 강냉이처럼 표현을 바꿉니다. 문맥 확인이 필요해요.'],
    ['spacing', '등록 표현 띄어쓰기', '‘할 수 있다’ 등 사전에 등록된 표현만 적용합니다.'],
  ] as const;
  return <dialog ref={ref} className="settings-dialog" aria-labelledby="settings-title" onCancel={close} onClick={event => { if (event.target === ref.current) close(); }}>
    <div className="dialog-header"><span className="icon-tile"><Settings2 size={20}/></span><h2 id="settings-title">변환 설정</h2><button className="icon-button" aria-label="설정 닫기" onClick={close}><X size={20}/></button></div>
    <p className="muted">필요한 규칙만 골라서 적용하세요.</p>
    <div className="settings-options">{fields.map(([key, label, description]) => <label className="setting-row" key={key}><div><strong>{label}</strong><small>{description}</small></div><input type="checkbox" aria-label={label} checked={options[key] !== false} onChange={event => update({ ...options, [key]: event.target.checked })}/></label>)}</div>
    <label className="protection-label" htmlFor="protected-words"><LockKeyhole size={17}/> 보호할 이름과 표현</label>
    <textarea id="protected-words" value={protection} onChange={event => setProtection(event.target.value)} maxLength={3000} placeholder="예: 여행사 이름, 사람 이름" rows={3}/>
    <small className="muted">쉼표나 줄바꿈으로 구분하세요. 최대 200개. 보호어로 시작하는 단어와 조사는 그대로 유지합니다.</small>
    <button className="primary full-width" onClick={close}>설정 적용</button>
  </dialog>;
}
