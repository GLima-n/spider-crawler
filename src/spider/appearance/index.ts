import type { Point, SpiderState } from '../../types';
import { SurfaceTheme } from './surface';

type Rgb = [number, number, number];
interface Palette {
  shell: string;
  face: string;
  edge: string;
  rim: string;
  leg: string;
  glint: string;
  joint: string;
  eye: string;
  accent: string;
}

const LIGHT_SURFACE = {
  shell: [17, 33, 52], face: [11, 24, 44], edge: [2, 15, 30],
  rim: [196, 223, 246], leg: [23, 45, 65], glint: [226, 242, 255],
  joint: [24, 51, 72], eye: [28, 143, 255],
} satisfies Record<string, Rgb>;

const DARK_SURFACE = {
  shell: [225, 240, 249], face: [242, 249, 255], edge: [14, 31, 47],
  rim: [29, 59, 83], leg: [224, 239, 249], glint: [57, 125, 165],
  joint: [27, 59, 83], eye: [10, 182, 239],
} satisfies typeof LIGHT_SURFACE;

const ACCENT: Record<string, string> = {
  IDLE: '#4aaafa', WALKING: '#4aaafa', TARGETING: '#4aaafa',
  APPROACHING: '#4aaafa', TOUCHING: '#df83e7', INSPECTING: '#bd80ef',
  WEBBING: '#bd80ef', REPORTING: '#5bda9b', RESTING: '#4aaafa',
};

function blend(a: Rgb, b: Rgb, amount: number): string {
  const channels = a.map((n, i) => Math.round(n + (b[i] - n) * amount));
  return `rgb(${channels[0]} ${channels[1]} ${channels[2]})`;
}

function palette(theme: SurfaceTheme, state: SpiderState): Palette {
  const result = {} as Palette;
  for (const key of Object.keys(LIGHT_SURFACE) as (keyof typeof LIGHT_SURFACE)[])
    result[key] = blend(LIGHT_SURFACE[key], DARK_SURFACE[key], theme.blend);
  result.accent = ACCENT[state];
  return result;
}

function line(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string, width: number) {
  ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}

function joint(ctx: CanvasRenderingContext2D, p: Point, fill: string, outline: string, radius: number) {
  ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth = 0.9; ctx.stroke();
}

function segment(ctx: CanvasRenderingContext2D, from: Point, to: Point, p: Palette, moving: boolean) {
  // The outside stroke holds the silhouette on both light and dark surfaces.
  line(ctx, from, to, p.edge, 5.1);
  line(ctx, from, to, p.leg, 3.2);
  const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length, ny = dx / length;
  const fromGlint = { x: from.x + dx * 0.15 + nx * 0.95, y: from.y + dy * 0.15 + ny * 0.95 };
  const toGlint = { x: from.x + dx * 0.79 + nx * 0.95, y: from.y + dy * 0.79 + ny * 0.95 };
  line(ctx, fromGlint, toGlint, p.glint, 0.9);
  if (!moving) {
    const pixel = { x: from.x + dx * 0.63, y: from.y + dy * 0.63 };
    ctx.fillStyle = p.accent;
    ctx.fillRect(Math.round(pixel.x - 1), Math.round(pixel.y - 1), 2, 2);
  }
}

export interface DrawLeg { hip: Point; knee: Point; tip: Point; side: number; pair: number; stepping: boolean }

export class SpiderAppearance {
  theme = new SurfaceTheme();
  update(dt: number, position: Point, reduced: boolean) { this.theme.update(dt, position, reduced); }

  draw(ctx: CanvasRenderingContext2D, position: Point, heading: number,
       legs: DrawLeg[], state: SpiderState, time: number, reduced: boolean) {
    const p = palette(this.theme, state);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // Existing IK supplies every knee and planted foot. These strokes only skin it.
    for (const leg of legs) {
      segment(ctx, leg.hip, leg.knee, p, leg.stepping);
      segment(ctx, leg.knee, leg.tip, p, leg.stepping);
      joint(ctx, leg.knee, p.joint, p.rim, 2.5);
      joint(ctx, leg.tip, leg.stepping ? p.accent : p.leg, p.edge, 2.1);
      if (!leg.stepping && !reduced) {
        ctx.beginPath(); ctx.ellipse(leg.tip.x, leg.tip.y + 2, 3.3, 1.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.accent; ctx.globalAlpha = 0.16; ctx.fill(); ctx.globalAlpha = 1;
      }
    }

    const studying = state === 'INSPECTING' || state === 'WEBBING';
    const bob = reduced ? 0 : Math.sin(time * 6.2) * 0.8;
    const tilt = reduced ? 0 : Math.cos(heading) * 0.11 +
      (studying ? 0.055 : state === 'RESTING' ? -0.025 : 0);
    // A nearly frontal body keeps both eyes readable while the eight feet follow
    // the actual heading and contact geometry underneath it.
    ctx.translate(position.x, position.y + bob); ctx.rotate(tilt);

    // Compact dome and broad face; the eyes are the only facial features.
    ctx.beginPath(); ctx.ellipse(0, -8, 15.5, 13.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = p.shell; ctx.fill(); ctx.strokeStyle = p.edge; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -8, 13.8, 11.6, 0, 0, Math.PI * 2);
    ctx.strokeStyle = p.rim; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 8, 13.9, 11.1, 0, 0, Math.PI * 2);
    ctx.fillStyle = p.face; ctx.fill(); ctx.strokeStyle = p.edge; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 8, 12.1, 9.4, 0, 0, Math.PI * 2);
    ctx.strokeStyle = p.rim; ctx.lineWidth = 1.1; ctx.stroke();

    // The short stepped marks echo terminal pixels without turning the body into text.
    ctx.fillStyle = p.glint;
    ctx.fillRect(-8, -20, 5, 1.8); ctx.fillRect(-1, -21, 2.5, 1.8);
    ctx.fillRect(6, -19, 3.3, 1.4);
    ctx.fillStyle = p.accent;
    ctx.fillRect(-11, -17, 2, 2); ctx.fillRect(10, -12, 2, 2);

    for (const x of [-5, 5]) {
      ctx.beginPath(); ctx.arc(x, 9, 2.45, 0, Math.PI * 2);
      ctx.fillStyle = p.eye; ctx.fill();
    }
    if (state === 'REPORTING' && !reduced) {
      ctx.globalAlpha = Math.max(0, 0.55 + Math.sin(time * 10) * 0.2);
      ctx.fillStyle = p.accent; ctx.fillRect(-8, -25, 2, 2); ctx.fillRect(7, -26, 2, 2);
    }
    ctx.restore();
  }
}
