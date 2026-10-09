import { Spider } from '../src/spider/engine';
import type { DOMInspector } from '../src/inspection/dom';
import { solveIK } from '../src/shared/math';
import type { Candidate, Point } from '../src/types';
import { drawHighFidelitySpider as drawPrevious } from './previous-integrated-shape';
import { drawReferenceSkin, type StudyLeg } from './reference-skin';

const referenceCanvas = document.querySelector<HTMLCanvasElement>('#reference')!;
const candidateCanvas = document.querySelector<HTMLCanvasElement>('#candidate')!;
const previousCanvas = document.querySelector<HTMLCanvasElement>('#previous')!;
const viewControl = document.querySelector<HTMLSelectElement>('#view')!;
const poseControl = document.querySelector<HTMLSelectElement>('#pose')!;
const surfaceControl = document.querySelector<HTMLSelectElement>('#surface')!;
const readout = document.querySelector<HTMLOutputElement>('#readout')!;
const variantCanvases: { canvas: HTMLCanvasElement; size: number; blend: number }[] = [];
type StudySnapshot = { legs: number; steps: number; contacts: number; inspections: number; state: string; position: Point };

for (const blend of [0, 1]) for (const size of [64, 96, 128]) {
  const item = document.createElement('article'); item.className = `sample ${blend ? 'dark' : ''}`;
  const title = document.createElement('h3'); title.textContent = `${size} px · ${blend ? 'escuro' : 'claro'}`;
  const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 128;
  item.append(title, canvas); document.querySelector('#sizes')!.append(item);
  variantCanvases.push({ canvas, size, blend });
}

const hiddenTargets = document.createElement('div'); hiddenTargets.hidden = true; document.body.append(hiddenTargets);
const rects = [
  { x: 220, y: 205, width: 80, height: 50 },
  { x: 380, y: 245, width: 85, height: 54 },
  { x: 170, y: 340, width: 92, height: 55 },
];
const candidates = rects.map((rect, i) => {
  const el = document.createElement('div'); hiddenTargets.append(el);
  return { id: `preview-${i}`, el, rect, visited: 0, tag: 'DIV', type: 'CARD', confidence: .97 } as unknown as Candidate;
});
const fakeDom = {
  candidates,
  visible: () => true,
  anchor: (point: Point, preferred?: Candidate) => preferred
    ? { point: { ...point }, candidate: preferred, uv: {
      x: (point.x-preferred.rect.x)/preferred.rect.width,
      y: (point.y-preferred.rect.y)/preferred.rect.height,
    } }
    : { point: { ...point } },
} as unknown as DOMInspector;

let contactCount = 0, inspectionCount = 0;
let actor: Spider;
let origin: Point;
let last = performance.now(), clock = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const studyWindow = window as Window & { __spiderVisualStudy?: () => StudySnapshot };
function makeActor() {
  contactCount = 0; inspectionCount = 0;
  candidates.forEach(candidate => { candidate.visited = 0; });
  actor = new Spider('visual-study', fakeDom, () => { contactCount++; }, () => { inspectionCount++; }, reducedMotion.matches);
  actor.heading = viewControl.value === 'side' ? 0 : Math.PI / 2;
  actor.update(0); origin = { ...actor.position };
  if (poseControl.value === 'walk') actor.focus(candidates[0]);
  last = performance.now(); clock = 0;
}
makeActor();
studyWindow.__spiderVisualStudy = () => ({
  legs: actor.legs.length, steps: actor.steps, contacts: contactCount, inspections: inspectionCount,
  state: actor.state, position: { ...actor.position },
});

function articulation(): StudyLeg[] {
  return actor.legs.map((leg: any) => ({
    hip: leg.hip, knee: leg.knee,
    tip: solveIK(leg.hip, leg.foot, 40, 46, (leg.pair === 3 ? -1 : 1) * leg.side).tip,
    side: leg.side, pair: leg.pair, stepping: leg.stepping, anchored: !!leg.anchor.candidate,
    contactWeight: leg.anchor.candidate ? (leg.stepping ? leg.phase*leg.phase*(3-2*leg.phase) : 1) : 0,
  }));
}
function oldArticulation() {
  return actor.legs.map((leg: any) => ({
    hip: leg.hip, knee: leg.knee,
    tip: solveIK(leg.hip, leg.foot, 40, 46, (leg.pair === 3 ? -1 : 1) * leg.side).tip,
    side: leg.side, pair: leg.pair, stepping: leg.stepping,
    anchored: !!leg.anchor.candidate,
  }));
}
function background(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, blend: number) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = blend ? '#0a1322' : '#f7f8f6'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = blend ? 'rgba(125,177,217,.14)' : 'rgba(18,54,86,.12)';
  ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, canvas.height - 16); ctx.lineTo(canvas.width, canvas.height - 16); ctx.stroke();
}
function renderLarge(canvas: HTMLCanvasElement, useNew: boolean, blend: number, time: number, moving: boolean) {
  const ctx = canvas.getContext('2d')!; background(ctx, canvas, blend);
  const scale = 2.65, follow = 1;
  const target = actor.position;
  const camera = { x: origin.x + (target.x - origin.x) * follow, y: origin.y + (target.y - origin.y) * follow };
  ctx.save();
  ctx.translate(canvas.width / 2 - camera.x * scale, canvas.height * .57 - camera.y * scale);
  ctx.scale(scale, scale);
  if (useNew) drawReferenceSkin(ctx, actor.position, actor.heading, articulation(), actor.state, time, reducedMotion.matches, blend);
  else drawPrevious(ctx, actor.position, actor.heading, oldArticulation(), actor.state, time, reducedMotion.matches, blend);
  ctx.restore();
}
function renderVariants(time: number) {
  const legs = articulation();
  for (const sample of variantCanvases) {
    const ctx = sample.canvas.getContext('2d')!; background(ctx, sample.canvas, sample.blend);
    const scale = sample.size / 148;
    ctx.save(); ctx.translate(100 - actor.position.x * scale, 63 - actor.position.y * scale); ctx.scale(scale, scale);
    drawReferenceSkin(ctx, actor.position, actor.heading, legs, actor.state, time, reducedMotion.matches, sample.blend);
    ctx.restore();
  }
}

const approved = new Image();
function paintReference() {
  if (!approved.complete || !approved.naturalWidth) return;
  const ctx = referenceCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, referenceCanvas.width, referenceCanvas.height);
  const crop = surfaceControl.value === 'dark'
    ? { x: 875, y: 67, width: 266, height: 180 }
    : { x: 587, y: 64, width: 285, height: 184 };
  const scale = Math.min(referenceCanvas.width / crop.width, referenceCanvas.height / crop.height);
  const width = crop.width * scale, height = crop.height * scale;
  ctx.fillStyle = surfaceControl.value === 'dark' ? '#03070d' : '#ffffff';
  ctx.fillRect(0, 0, referenceCanvas.width, referenceCanvas.height);
  ctx.drawImage(approved, crop.x, crop.y, crop.width, crop.height,
    (referenceCanvas.width - width) / 2, (referenceCanvas.height - height) / 2, width, height);
}
approved.onload = paintReference;
approved.src = '/preview/reference-approved.png';

function frame(now: number) {
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  if (poseControl.value === 'walk') { actor.update(dt); clock += dt; }
  const blend = surfaceControl.value === 'dark' ? 1 : 0;
  const time = (actor as unknown as { time: number }).time;
  renderLarge(candidateCanvas, true, blend, time, poseControl.value === 'walk');
  renderLarge(previousCanvas, false, blend, time, poseControl.value === 'walk');
  renderVariants(time);
  readout.value = `IK · 8 patas · ${poseControl.value === 'walk' ? actor.state.toLowerCase() : 'parado'} · ${contactCount} contatos · ${inspectionCount} análises`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

for (const control of [viewControl, poseControl]) control.addEventListener('change', makeActor);
reducedMotion.addEventListener('change', makeActor);
document.querySelector('#reset')!.addEventListener('click', makeActor);
surfaceControl.addEventListener('change', () => {
  document.querySelector('#candidate-card')!.classList.toggle('dark', surfaceControl.value === 'dark');
  document.querySelector('#previous-card')!.classList.toggle('dark', surfaceControl.value === 'dark');
  paintReference();
});
