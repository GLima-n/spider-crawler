// Canvas 2D skin using the movement engine's existing IK joints and foot contacts.
type Point = { x: number; y: number };
export type ShapeLeg = { hip: Point; knee: Point; tip: Point; side: number; pair: number; stepping: boolean; anchored?: boolean; contactBlend?: number };
type RGB = [number, number, number];
const HOME_ANGLES=[.52,1.12,1.98,2.62];
const HOME_REACH=[58,53,53,64];
const FREE_TIP_X=[56,72,72,58];
const FREE_TIP_Y=[42,33,18,20];
const FREE_KNEE_X=[39,51,53,41];
const FREE_KNEE_Y=[-6,-13,-14,-8];
const limited=(value:number,limit:number)=>Math.max(-limit,Math.min(limit,value));

const ON_LIGHT = {
  shell: [13, 27, 47], edge: [7, 17, 30],
  rim: [130, 171, 207], limb: [25, 48, 76], glint: [215, 231, 249],
  eyes: [42, 146, 253], accent: [64, 161, 255],
} satisfies Record<string, RGB>;
const ON_DARK = {
  shell: [224, 239, 248], edge: [13, 28, 47],
  rim: [124, 177, 208], limb: [212, 231, 244], glint: [255, 255, 255],
  eyes: [19, 182, 240], accent: [78, 193, 252],
} satisfies typeof ON_LIGHT;

function mix(a: RGB, b: RGB, n: number) {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * n));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}
function palette(blend: number) {
  const output: Record<keyof typeof ON_LIGHT, string> = {} as never;
  for (const key of Object.keys(ON_LIGHT) as (keyof typeof ON_LIGHT)[])
    output[key] = mix(ON_LIGHT[key], ON_DARK[key], blend);
  return output;
}

function curvedSegment(ctx: CanvasRenderingContext2D, a: Point, b: Point,
  outward: number, upper: boolean, colors: ReturnType<typeof palette>) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const control = { x: (a.x + b.x) / 2 + outward * (upper ? 8 : 6),
    y: (a.y + b.y) / 2 + (upper ? 3 : 4) };
  const path = () => {ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(control.x,control.y,b.x,b.y);};
  path();ctx.lineWidth = upper ? 3.6 : 3;ctx.strokeStyle = colors.edge;ctx.stroke();
  path();ctx.lineWidth = upper ? 2.1 : 1.7;ctx.strokeStyle = colors.limb;ctx.stroke();
  if (upper) {
    const start = {x:a.x+dx*.2+outward*.8,y:a.y+dy*.2-.8};
    const end = {x:a.x+dx*.67+outward*.8,y:a.y+dy*.67-.8};
    ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo(control.x+outward*.4,control.y-.4,end.x,end.y);
    ctx.lineWidth = 1;ctx.strokeStyle=colors.glint;ctx.stroke();
  }
}

export function drawCandidateSpider(ctx: CanvasRenderingContext2D, body: Point,
  heading: number, legs: ShapeLeg[], state: string, time: number, reduced: boolean,
  blend: number) {
  const colors = palette(blend);
  if (state==='REPORTING') colors.accent='#5bda9b';
  else if (state==='TOUCHING'||state==='INSPECTING'||state==='WEBBING') colors.accent='#bd80ef';
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  const pose=Math.PI/2+Math.sin(heading-Math.PI/2)*.22;
  // The free-leg pose is visual only. Component anchors retain the actual IK
  // foot position, so an interaction still originates at the real contact.
  for (const leg of legs) {
    const homeAngle=pose+leg.side*HOME_ANGLES[leg.pair];
    const reach=HOME_REACH[leg.pair];
    const dx=leg.tip.x-(body.x+Math.cos(homeAngle)*reach);
    const dy=leg.tip.y-(body.y+Math.sin(homeAngle)*reach);
    const freeTip={x:body.x+leg.side*FREE_TIP_X[leg.pair]+limited(dx*.28,12),
      y:body.y+FREE_TIP_Y[leg.pair]+limited(dy*.2,9)};
    const freeKnee={x:body.x+leg.side*FREE_KNEE_X[leg.pair]+limited((leg.knee.x-body.x)*.08,5),
      y:body.y+FREE_KNEE_Y[leg.pair]+limited((leg.knee.y-body.y)*.08,5)};
    const contactBlend=leg.contactBlend??(leg.anchored?1:0);
    const knee={x:freeKnee.x+(leg.knee.x-freeKnee.x)*contactBlend,
      y:freeKnee.y+(leg.knee.y-freeKnee.y)*contactBlend};
    const tip={x:freeTip.x+(leg.tip.x-freeTip.x)*contactBlend,
      y:freeTip.y+(leg.tip.y-freeTip.y)*contactBlend};
    const outward=leg.side;
    curvedSegment(ctx,leg.hip,knee,outward,true,colors);
    curvedSegment(ctx,knee,tip,outward,false,colors);
    ctx.fillStyle=colors.limb;ctx.strokeStyle=colors.edge;ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(knee.x,knee.y,1.45,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(tip.x,tip.y,1,0,Math.PI*2);ctx.fill();
    if (!leg.stepping) {
      ctx.fillStyle=colors.accent;ctx.globalAlpha=.36;
      ctx.fillRect(Math.round(tip.x-1),Math.round(tip.y+1),2,1);
      ctx.globalAlpha=1;
    }
  }

  const tilt=reduced?0:Math.cos(heading)*.08+(state==='INSPECTING'?.04:0);
  const bob=reduced?0:Math.sin(time*5)*.5;
  ctx.translate(body.x,body.y+bob);ctx.rotate(tilt);ctx.scale(1.18,1.02);
  // A single rounded digital-creature silhouette: no visor or separate head.
  ctx.beginPath();ctx.moveTo(-30,-2);ctx.lineTo(-30,-8);
  ctx.quadraticCurveTo(-28,-28,-10,-31);ctx.lineTo(-6,-32);
  ctx.quadraticCurveTo(0,-34,6,-32);ctx.lineTo(11,-31);
  ctx.quadraticCurveTo(29,-27,30,-8);ctx.lineTo(30,2);
  ctx.quadraticCurveTo(29,21,12,26);ctx.lineTo(8,27);
  ctx.quadraticCurveTo(0,28,-8,27);ctx.lineTo(-12,26);
  ctx.quadraticCurveTo(-29,21,-30,3);ctx.closePath();
  ctx.fillStyle=colors.shell;ctx.fill();ctx.strokeStyle=colors.edge;ctx.lineWidth=3.4;ctx.stroke();

  // Sparse terminal-like glints soften the contour without mechanical panels.
  ctx.strokeStyle=colors.rim;ctx.lineWidth=1.4;ctx.beginPath();
  ctx.moveTo(-25,-13);ctx.quadraticCurveTo(-20,-28,-8,-29);ctx.lineTo(7,-29);ctx.stroke();
  ctx.fillStyle=colors.glint;ctx.fillRect(-19,-26,3,2);ctx.fillRect(15,-24,2,2);
  ctx.fillStyle=colors.accent;ctx.fillRect(-28,-9,2,2);ctx.fillRect(26,-7,2,2);
  ctx.fillRect(-24,17,2,2);ctx.fillRect(22,16,2,2);

  // Exactly two small points, embedded directly in the face.
  ctx.fillStyle=colors.eyes;
  for (const x of [-8,8]) {ctx.beginPath();ctx.arc(x,11,2.7,0,Math.PI*2);ctx.fill();}
  if (state==='REPORTING'&&!reduced) {
    ctx.globalAlpha=.35;ctx.fillStyle=colors.accent;
    ctx.fillRect(-12,-36,2,2);ctx.fillRect(11,-35,2,2);
  }
  ctx.restore();
}
