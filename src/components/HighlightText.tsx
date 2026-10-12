import type { ConversionResult, Segment } from '../engine/types';
export function HighlightText({ segments, result, enabled }: { segments: Segment[]; result: ConversionResult; enabled: boolean }) {
  return <>{segments.map((segment, index) => {
    const change = segment.changeId === undefined ? undefined : result.changes[segment.changeId];
    return enabled && change ? <mark key={index} className={`highlight ${change.rule.category}`} title={`${change.before} → ${change.after} · ${change.rule.explanation}`}>{segment.text}</mark> : <span key={index}>{segment.text}</span>;
  })}</>;
}
