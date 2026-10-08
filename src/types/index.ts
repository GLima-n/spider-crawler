export const COMPONENT_TYPES = ['TEXT','BUTTON','CARD','CHART','INPUT','IMAGE','MENU','TABLE','SVG','CANVAS','UNKNOWN'] as const;
export type ComponentType = typeof COMPONENT_TYPES[number];
export type SpiderState = 'IDLE'|'WALKING'|'TARGETING'|'APPROACHING'|'TOUCHING'|'INSPECTING'|'WEBBING'|'REPORTING'|'RESTING';
export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; width: number; height: number }
export interface Classification { type: ComponentType; confidence: number; evidence: string[]; manual?: boolean }
export interface Candidate extends Classification { id: string; el: Element; rect: Rect; visited: number }
export interface SpiderContact { spiderId: string; legId: number; elementId: string; elementType: ComponentType; position: Point; intensity: number; timestamp: number; state: SpiderState }
export interface Settings { mode: 'explore'|'audit'; count: number; intensity: 'soft'|'normal'|'intense' }
export const DEFAULT_SETTINGS: Settings = { mode: 'explore', count: 1, intensity: 'normal' };
export interface Finding { id: string; elementId: string; rule: string; severity: 'Erro confirmado'|'Possível problema'|'Observação'|'Sugestão'; title: string; evidence: string; suggestion: string }
export interface Inspection { id: string; type: ComponentType; confidence: number; manual: boolean; tag: string; dimensions: Rect; styles: Record<string,string>; structure: string[]; accessibility: Record<string,string|boolean|number>; technologies: string[]; evidence: string[]; metadata: Record<string,string|number|boolean>; inspectedAt: string }
export interface Report { schemaVersion: 1; generatedAt: string; mode: Settings['mode']; page: { origin: string }; components: Inspection[]; findings: Finding[]; limitations: string[] }
// Future adapters receive minimized data only. No provider/network implementation in this MVP.
export interface AnalysisProvider { analyze(report: Report, signal: AbortSignal): Promise<Finding[]> }
export interface ActiveAuditAdapter { run(authorization: { explicitConsent: true; environment: 'test'; origin: string }, signal: AbortSignal): Promise<Finding[]> }
