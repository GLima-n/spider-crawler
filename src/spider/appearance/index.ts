import type { Point, SpiderState } from '../../types';
import { SurfaceTheme } from './surface';
import { drawCandidateSpider, type ShapeLeg } from './shape';

export type DrawLeg = ShapeLeg;

// Skin only. The Spider engine still owns targets, planting, timing, and IK.
export class SpiderAppearance {
  theme = new SurfaceTheme();
  private contactBlends = Array(8).fill(0) as number[];
  private lastDrawTime?: number;

  update(dt: number, position: Point, reduced: boolean) {
    this.theme.update(dt, position, reduced);
  }

  draw(ctx: CanvasRenderingContext2D, position: Point, heading: number,
       legs: DrawLeg[], state: SpiderState, time: number, reduced: boolean) {
    const dt=this.lastDrawTime===undefined?1/60:Math.max(0,Math.min(.05,time-this.lastDrawTime));
    this.lastDrawTime=time;
    for(let i=0;i<legs.length;i++) {
      const leg=legs[i];
      const current=this.contactBlends[i]??0;
      const contactBlend=Math.max(0,Math.min(1,current+(leg.anchored?1:-1)*dt*9));
      this.contactBlends[i]=contactBlend;
      leg.contactBlend=contactBlend;
    }
    drawCandidateSpider(ctx, position, heading, legs, state, time, reduced, this.theme.blend);
  }
}
