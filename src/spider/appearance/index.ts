import type { Point, SpiderState } from '../../types';
import { SurfaceTheme } from './surface';
import { drawHighFidelitySpider, type ArtLeg } from './shape';

export type DrawLeg = ArtLeg;

// Skin only. The Spider engine still owns targets, planting, timing, and IK.
export class SpiderAppearance {
  theme = new SurfaceTheme();

  update(dt: number, position: Point, reduced: boolean) {
    this.theme.update(dt, position, reduced);
  }

  draw(ctx: CanvasRenderingContext2D, position: Point, heading: number,
       legs: DrawLeg[], state: SpiderState, time: number, reduced: boolean) {
    const articulated = legs.map(leg => {
      const phase = leg.phase ?? 1;
      return { ...leg, contactWeight: leg.anchored ? (leg.stepping ? phase*phase*(3-2*phase) : 1) : 0 };
    });
    drawHighFidelitySpider(ctx, position, heading, articulated, state, time, reduced, this.theme.blend);
  }
}
