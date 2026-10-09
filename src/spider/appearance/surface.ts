import type { Point } from '../../types';

export type ShellTheme = 'dark-shell' | 'light-shell';
type Rgb = [number, number, number];
interface Color { rgb: Rgb; alpha: number }

const WHITE: Rgb = [255, 255, 255];
const DARK: Rgb = [11, 18, 30];

function parseColor(value: string): Color | null {
  if (value === 'transparent') return { rgb: WHITE, alpha: 0 };
  const rgb = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/);
  if (!rgb) return null;
  return {
    rgb: [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])],
    alpha: rgb[4] === undefined ? 1 : Number(rgb[4]),
  };
}

export function luminance(rgb: Rgb): number {
  const linear = rgb.map(channel => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

export function composite(top: Rgb, alpha: number, bottom: Rgb): Rgb {
  return [0, 1, 2].map(i => top[i] * alpha + bottom[i] * (1 - alpha)) as Rgb;
}

// A CSS image, video or gradient cannot be sampled safely through computed styles.
// In those cases keep the last confident theme; the double contour remains legible.
export function backgroundAt(point: Point): number | null {
  if (point.x < 0 || point.y < 0 || point.x >= innerWidth || point.y >= innerHeight) return null;
  const hit = document.elementFromPoint(point.x, point.y);
  if (!hit || hit.closest('spider-inspector-overlay')) return null;
  const ancestors: Element[] = [];
  for (let node: Element | null = hit; node; node = node.parentElement) ancestors.push(node);
  const scheme = getComputedStyle(document.documentElement).colorScheme;
  let color: Rgb = scheme === 'dark' || scheme.startsWith('dark ') ? DARK : WHITE;
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const style = getComputedStyle(ancestors[i]);
    if (style.backgroundImage !== 'none') return null;
    const parsed = parseColor(style.backgroundColor);
    if (!parsed) return null;
    color = composite(parsed.rgb, parsed.alpha, color);
  }
  return luminance(color);
}

export class SurfaceTheme {
  mode: ShellTheme = 'dark-shell';
  blend = 0;
  luminance: number | null = null;
  samples = 0;
  switches = 0;
  private nextSample = 0;
  private elapsed = 0;
  update(dt: number, position: Point, reduced: boolean) {
    this.elapsed += dt;
    if (this.elapsed >= this.nextSample) {
      this.nextSample = this.elapsed + 0.22;
      // One local read per spider. Avoid repeated DOM/style reads in the draw loop.
      const value = backgroundAt(position);
      this.samples++;
      this.luminance = value;
      if (value !== null) {
        const next = value < 0.36 ? 'light-shell' : value > 0.64 ? 'dark-shell' : this.mode;
        if (next !== this.mode) { this.mode = next; this.switches++; }
      }
    }
    const target = this.mode === 'light-shell' ? 1 : 0;
    const easing = reduced ? 11 : 7;
    this.blend += (target - this.blend) * (1 - Math.exp(-easing * dt));
  }
}
