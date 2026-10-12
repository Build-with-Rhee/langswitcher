export type Direction = 'south-to-north' | 'north-to-south';
export type Category = 'orthography' | 'vocabulary' | 'spacing';
export interface Rule {
  id: string;
  south: string;
  north: string;
  category: Category;
  explanation: string;
  source: string;
  contextual?: boolean;
  oneWay?: boolean;
}
export interface Options {
  orthography?: boolean;
  vocabulary?: boolean;
  spacing?: boolean;
  protectedWords?: string[];
}
export interface Change {
  id: number;
  rule: Rule;
  before: string;
  after: string;
  sourceStart: number;
  sourceEnd: number;
  outputStart: number;
  outputEnd: number;
}
export interface Segment { text: string; changeId?: number }
export interface ConversionResult {
  source: string;
  output: string;
  changes: Change[];
  sourceSegments: Segment[];
  outputSegments: Segment[];
  normalized: boolean;
  modelVersion: string;
}
export interface EvaluationCase { id: string; direction: Direction; input: string; expected: string }
