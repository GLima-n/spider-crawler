import type { Point, Rect } from '../types/index.ts';
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const distance = (a: Point, b: Point) => Math.hypot(a.x-b.x,a.y-b.y);
export const mix = (a: Point,b: Point,t: number): Point => ({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
export const rectOf = (r: DOMRect): Rect => ({ x:r.x,y:r.y,width:r.width,height:r.height });
export function nearest(p: Point, r: Rect, inset=2): Point {
  const ix=Math.min(inset,r.width/2), iy=Math.min(inset,r.height/2);
  return { x:clamp(p.x,r.x+ix,r.x+r.width-ix), y:clamp(p.y,r.y+iy,r.y+r.height-iy) };
}
// Circle intersection, with reach clamping and a stable elbow side.
export function solveIK(hip: Point, foot: Point, upper: number, lower: number, side: number) {
  const raw=distance(hip,foot), d=clamp(raw,Math.abs(upper-lower)+0.001,upper+lower-0.001);
  const ux=raw>0.001?(foot.x-hip.x)/raw:1, uy=raw>0.001?(foot.y-hip.y)/raw:0;
  const along=(upper*upper-lower*lower+d*d)/(2*d), out=Math.sqrt(Math.max(0,upper*upper-along*along));
  return { knee:{ x:hip.x+ux*along-uy*out*side, y:hip.y+uy*along+ux*out*side }, tip:{x:hip.x+ux*d,y:hip.y+uy*d} };
}
