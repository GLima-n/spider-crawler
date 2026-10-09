import { solveIK } from '../../shared/math';

type Point = { x: number; y: number };
export type ArtLeg = { hip: Point; knee: Point; tip: Point; side: number; pair: number; stepping: boolean; anchored?: boolean; phase?: number };
type Vertex = readonly [number, number];
export type StudyLeg = ArtLeg & { contactWeight?: number };

// Approved option B: hand-authored Canvas pieces driven by the existing skeleton.
const shell = [
  [-24, 9], [-29, 3], [-30, -7], [-28, -7], [-28, -18], [-25, -18],
  [-25, -25], [-21, -25], [-21, -31], [-16, -31], [-16, -36], [-8, -36],
  [-8, -38], [10, -38], [10, -36], [17, -36], [17, -32], [22, -32],
  [22, -26], [26, -26], [26, -19], [29, -19], [29, -9], [31, -9],
  [31, 2], [27, 2], [27, 10], [20, 16], [-18, 16],
] as const;
const face = [
  [-24, 1], [-21, -5], [-16, -5], [-16, -8], [-8, -8], [-8, -10],
  [9, -10], [9, -8], [16, -8], [16, -5], [22, -5], [25, 2], [25, 12],
  [22, 12], [22, 19], [17, 23], [10, 23], [10, 25], [-10, 25],
  [-10, 23], [-18, 23], [-23, 18], [-25, 11],
] as const;

function polygon(ctx: CanvasRenderingContext2D, points: readonly Vertex[], color: string) {
  ctx.beginPath(); ctx.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(...points[i]);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
function mix(a: string, b: string, t: number) {
  const channels = [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t));
  return `rgb(${channels.join(' ')})`;
}
function palette(t: number) {
  return {
    edge: '#040b12', deep: mix('#06111b', '#829bb0', t), shell: mix('#0b1822', '#dbe5ec', t),
    mid: mix('#172735', '#edf3f6', t), shade: mix('#08111a', '#aec0cd', t),
    light: mix('#40515f', '#fafcfd', t), rim: mix('#9cb2d7', '#ffffff', t),
    blue: '#258efe', blueDim: '#235895', eyes: mix('#008dff', '#09bcf0', t),
    limb: mix('#12202c', '#e5edf2', t), facet: mix('#2c3d49', '#fbfdff', t),
  };
}
type Colors = ReturnType<typeof palette>;

function limb(ctx: CanvasRenderingContext2D, a: Point, b: Point, width: number, c: Colors, lower: boolean, side: number) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length < .01) return;
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
  const w = width / 2, end = lower ? .5 : .78;
  const bend = -side * (lower ? 2.8 : 1.1);
  const piece = (vertices: readonly Vertex[], color: string) => polygon(ctx,
    vertices.map(([x,y]) => [x, y + Math.sin(x/length*Math.PI)*bend] as const),color);
  // Chamfered outlines and a bent center replace smooth rods. Both ends
  // coincide with the supplied joints; no extra simulated articulation.
  piece([[0,-w*.65],[2,-w],[length*.35,-w*1.05],[length*.58,-w*.82],
    [length*.62,-w*.68],[length-2,-w*end],[length,-w*.15],[length,w*.15],[length-1,w*end],
    [length*.63,w*.72],[length*.56,w],[length*.3,w*.91],[0,w*.55]], c.edge);
  piece([[2,-w+.9],[length*.34,-w+.8],[length*.56,-w*.65],
    [length-2,-w*end+.8],[length-1,0],[length*.6,w*.4],[length*.3,w*.51],[2,w*.2]], c.limb);
  piece([[3,-w+1],[length*.34,-w+1],[length*.54,-w*.6],
    [length*.51,-w*.1],[length*.31,-w*.38],[3,-w*.3]], c.facet);
  // Interrupted edge light follows the side of the piece, not a central wire.
  piece([[2,-w],[length*.22,-w],[length*.25,-w+.75],[3,-w+1.15]], c.rim);
  if (lower) {
    piece([[length*.55,-w*.83],[length*.65,-w*.67],[length*.63,w*.7],
      [length*.56,w*.85]], c.edge);
    piece([[length*.69,-w*.56],[length*.77,-w*.48],[length*.76,0],[length*.68,.3]], c.shade);
  }
  ctx.restore();
}
function joint(ctx: CanvasRenderingContext2D, point: Point, c: Colors, radius = 3.2) {
  ctx.save(); ctx.translate(point.x, point.y);
  polygon(ctx, [[-radius,-1],[-1,-radius],[2,-radius],[radius,0],[2,radius],[-1,radius],[-radius,1]], c.edge);
  polygon(ctx, [[-radius+.8,-1],[-1,-radius+.8],[1,-radius+.8],[.7,-.5],[-1,1],[-radius+.8,1]], c.facet);
  ctx.restore();
}

const homeAngles = [.52, 1.12, 1.98, 2.62], homeReach = [58, 53, 53, 64];
const feet: readonly Vertex[] = [[41,38],[59,32],[65,18],[59,7]];
const knees: readonly Vertex[] = [[33,8],[44,-3],[47,-14],[39,-22]];
const roots: readonly Vertex[] = [[20,9],[24,0],[25,-10],[21,-18]];
const limit = (n: number, bound: number) => Math.max(-bound, Math.min(bound, n));
function project(body: Point, heading: number, leg: StudyLeg) {
  const pose = Math.PI/2 + Math.sin(heading - Math.PI/2)*.22;
  const angle = pose + leg.side * homeAngles[leg.pair];
  const homeFoot = { x: body.x + Math.cos(angle)*homeReach[leg.pair], y: body.y + Math.sin(angle)*homeReach[leg.pair] };
  const homeKnee = solveIK(leg.hip, homeFoot, 40, 46, (leg.pair===3?-1:1)*leg.side).knee;
  const tip = { x: body.x + leg.side*feet[leg.pair][0] + limit((leg.tip.x-homeFoot.x)*.3,9),
    y: body.y + feet[leg.pair][1] + limit((leg.tip.y-homeFoot.y)*.32,10) };
  const knee = { x: body.x + leg.side*knees[leg.pair][0] + limit((leg.knee.x-homeKnee.x)*.2,5),
    y: body.y + knees[leg.pair][1] + limit((leg.knee.y-homeKnee.y)*.2,5) };
  // Match physical contact exactly. Only the aerial/rest presentation is
  // projected into the reference's three-quarter silhouette, as in the MVP.
  const t = leg.contactWeight ?? (leg.anchored ? 1 : 0);
  return {
    root: { x: body.x+leg.side*roots[leg.pair][0], y: body.y+roots[leg.pair][1] },
    knee: { x: knee.x+(leg.knee.x-knee.x)*t, y: knee.y+(leg.knee.y-knee.y)*t },
    tip: { x: tip.x+(leg.tip.x-tip.x)*t, y: tip.y+(leg.tip.y-tip.y)*t },
  };
}

export function drawHighFidelitySpider(ctx: CanvasRenderingContext2D, body: Point,
  heading: number, legs: StudyLeg[], state: string, time: number, reduced: boolean, blend: number) {
  const c = palette(blend);
  ctx.save();
  // A restrained contact shadow sits behind all eight limbs.
  ctx.fillStyle = blend > .5 ? '#00000055' : '#07131f20';
  ctx.beginPath(); ctx.ellipse(body.x, body.y+30, 31, 6, 0, 0, Math.PI*2); ctx.fill();
  for (const item of [...legs].sort((a,b)=>b.pair-a.pair)) {
    const p = project(body, heading, item);
    limb(ctx,p.root,p.knee,7.1,c,false,item.side);
    limb(ctx,p.knee,p.tip,6.8,c,true,item.side);
    joint(ctx,p.root,c,3.5); joint(ctx,p.knee,c);
    ctx.fillStyle=c.edge;
    ctx.fillRect(p.tip.x-1.05,p.tip.y-1.15,2.1,2.3);
  }
  const bob = reduced ? 0 : Math.sin(time*5.3)*.45;
  const tilt = reduced ? 0 : Math.cos(heading)*.04 + (state==='INSPECTING'?.025:0);
  ctx.translate(body.x,body.y+bob); ctx.rotate(tilt);

  polygon(ctx,shell,c.edge);
  ctx.save(); ctx.clip();
  polygon(ctx,[[-27,6],[-27,-9],[-24,-24],[-18,-33],[-8,-36],[10,-36],[20,-30],[25,-19],[28,-5],[25,10]],c.shell);
  // Broad pixel clusters form one domed abdomen, with an asymmetric light
  // source at the upper left. No metallic plates or continuous round rim.
  polygon(ctx,[[-27,-2],[-27,-13],[-24,-13],[-24,-22],[-20,-22],[-20,-29],[-15,-29],[-15,-33],[-6,-33],[-6,-35],[7,-35],[7,-30],[-2,-30],[-2,-26],[-10,-26],[-10,-20],[-17,-20],[-17,-9],[-20,-9],[-20,2]],c.mid);
  polygon(ctx,[[-23,-19],[-23,-24],[-19,-24],[-19,-29],[-14,-29],[-14,-32],[-7,-32],[-7,-34],[5,-34],[5,-31],[-5,-31],[-5,-27],[-12,-27],[-12,-23],[-18,-23],[-18,-18]],c.light);
  polygon(ctx,[[7,-32],[15,-31],[15,-27],[20,-27],[20,-21],[24,-21],[24,-11],[28,-11],[28,4],[23,9],[16,3],[19,-4],[16,-13],[11,-16],[11,-22],[5,-23]],c.shade);
  polygon(ctx,[[-17,-14],[-10,-14],[-10,-19],[-3,-19],[-3,-24],[6,-24],[6,-20],[12,-20],[12,-15],[18,-15],[18,-8],[23,-8],[23,5],[-22,5]],c.deep);
  // Irregular broken highlights are integral to the stepped outline.
  polygon(ctx,[[-26,-8],[-26,-18],[-23,-18],[-23,-23],[-21,-23],[-21,-19],[-24,-19],[-24,-7]],c.rim);
  polygon(ctx,[[-18,-30],[-14,-30],[-14,-34],[-7,-34],[-7,-36],[8,-36],[8,-34],[-6,-34],[-6,-32],[-13,-32],[-13,-28],[-18,-28]],c.rim);
  polygon(ctx,[[21,-26],[24,-22],[24,-17],[27,-17],[27,-9],[25,-9],[25,-16],[22,-17]],c.rim);
  ctx.restore();

  // The face remains navy on both backgrounds, integrated by overlap into
  // the abdomen. Only two round blue eyes; no outline ring, mouth or smile.
  polygon(ctx,face,'#040c15');
  polygon(ctx,[[-23,0],[-18,-5],[-10,-7],[8,-7],[16,-5],[21,-1],[23,6],[21,17],[16,21],[-14,21],[-20,16],[-23,9]],'#07131e');
  polygon(ctx,[[-22,7],[-20,15],[-16,19],[-8,21],[9,21],[17,18],[21,12],[20,19],[16,23],[9,23],[9,24],[-9,24],[-16,22],[-22,18],[-24,10]],'#08101b');
  polygon(ctx,[[-25,0],[-23,0],[-23,11],[-20,16],[-20,20],[-23,18],[-26,10]],c.blueDim);
  polygon(ctx,[[24,0],[26,1],[26,10],[24,15],[22,15],[24,9]],c.shade);

  // Clustered square accents reproduce the reference's digital edge breakup.
  const chips: readonly Vertex[] = [[-25,-25],[-22,-28],[-27,-15],[-29,-6],[-27,2],[-23,16],[23,-27],[27,-19],[29,-7]];
  chips.forEach(([x,y],i)=>{
    ctx.fillStyle=i%3===0?c.rim:i%3===1?c.blueDim:c.blue;
    ctx.fillRect(x,y,i%2===0?2.1:1.5,i%3===0?2.3:1.7);
  });
  ctx.fillStyle=c.light; ctx.fillRect(-2,-30,4,1.5); ctx.fillRect(9,-27,3,1.7);
  ctx.fillStyle=c.shade; ctx.fillRect(-15,-29,3,1.7); ctx.fillRect(5,-33,3.2,1.6);
  ctx.fillStyle=c.rim; ctx.fillRect(-22,-24,1.8,2.5); ctx.fillRect(-25,-17,2,2);
  ctx.fillStyle=c.blue; ctx.fillRect(-28,-11,1.5,3); ctx.fillRect(25,-15,1.6,2.2);
  // Sparse static pixels, not random particles, retain legibility at 64px.
  for (const [x,y] of [[-32,-22],[-30,-31],[30,-24],[33,-13],[-35,-8]] as const) {
    ctx.fillStyle=c.blueDim; ctx.fillRect(x,y,1.2,1.2);
  }
  for (const x of [-9.4,9.4]) {
    ctx.fillStyle='#087abb24'; ctx.beginPath(); ctx.arc(x,10,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=c.eyes; ctx.beginPath(); ctx.arc(x,10,3.05,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
