type Point = { x: number; y: number };
export type ArtLeg = { hip: Point; knee: Point; tip: Point; side: number; pair: number; stepping: boolean; anchored?: boolean };
type Palette = { edge: string; shell: string; shellLight: string; shellShade: string; limb: string; limbLight: string; joint: string; glint: string; eye: string; accent: string };

const LIGHT: Palette = {
  edge: '#061321', shell: '#101d30', shellLight: '#29394c', shellShade: '#080f1b',
  limb: '#172a40', limbLight: '#9eb4ca', joint: '#233b55', glint: '#e2effc',
  eye: '#218bff', accent: '#3d9dff',
};
const DARK: Palette = {
  edge: '#07172b', shell: '#e0ebf4', shellLight: '#f7fbff', shellShade: '#a9bfd3',
  limb: '#d4e3ef', limbLight: '#839eb7', joint: '#b9cddd', glint: '#ffffff',
  eye: '#10b9f2', accent: '#34b9ff',
};
function blendHex(a: string, b: string, amount: number) {
  const channel = (value: string, index: number) => parseInt(value.slice(index, index + 2), 16);
  const values = [1, 3, 5].map(index => Math.round(channel(a, index) + (channel(b, index) - channel(a, index)) * amount));
  return `rgb(${values[0]} ${values[1]} ${values[2]})`;
}
function palette(amount: number, state: string): Palette {
  const result = {} as Palette;
  for (const key of ['edge', 'shell', 'shellLight', 'shellShade', 'limb', 'limbLight', 'joint', 'glint', 'eye'] as const)
    result[key] = blendHex(LIGHT[key], DARK[key], amount);
  result.accent = state === 'REPORTING' ? '#4ad894'
    : state === 'TOUCHING' || state === 'INSPECTING' || state === 'WEBBING' ? '#bd80ef'
    : blendHex(LIGHT.accent, DARK.accent, amount);
  return result;
}

function quad(a: Point, c: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}
function tangent(a: Point, c: Point, b: Point, t: number): Point {
  return { x: 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x),
    y: 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y) };
}
function ribbon(ctx: CanvasRenderingContext2D, a: Point, c: Point, b: Point,
  startWidth: number, endWidth: number, color: string) {
  const left: Point[] = [], right: Point[] = [], count = 9;
  for (let i = 0; i <= count; i++) {
    const t = i / count, p = quad(a, c, b, t), d = tangent(a, c, b, t);
    const length = Math.hypot(d.x, d.y) || 1, radius = (startWidth + (endWidth - startWidth) * t) / 2;
    const n = { x: -d.y / length * radius, y: d.x / length * radius };
    left.push({ x: p.x + n.x, y: p.y + n.y });
    right.push({ x: p.x - n.x, y: p.y - n.y });
  }
  ctx.beginPath(); ctx.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
function leg(ctx: CanvasRenderingContext2D, a: Point, b: Point, side: number,
  pair: number, upper: boolean, colors: Palette, moving: boolean, seed: number) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const c = { x: mx + side * (upper ? (pair > 1 ? 10 : 7.5) : (pair > 1 ? 7 : 4.5)),
    y: my + (upper ? 5 : 6.5) };
  const outerA = upper ? 7.3 : 6.3, outerB = upper ? 6.1 : 3.4;
  ribbon(ctx, a, c, b, outerA, outerB, colors.edge);
  ribbon(ctx, a, c, b, outerA - 1.9, Math.max(1.8, outerB - 1.8), colors.limb);

  // A single broken glint keeps each member organic while retaining a pixel cue.
  if (upper) {
    const p0 = quad(a, c, b, .16), p1 = quad(a, c, b, .42);
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y - .9); ctx.quadraticCurveTo(c.x, c.y - 1.5, p1.x, p1.y - .5);
    ctx.strokeStyle = colors.limbLight; ctx.globalAlpha = moving ? .6 : .72; ctx.lineWidth = 1.05; ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (seed % 2 === 0 && upper) {
    const pixel = quad(a, c, b, .63);
    ctx.fillStyle = colors.accent; ctx.fillRect(Math.round(pixel.x), Math.round(pixel.y), 2, 1.7);
  }
}
function socket(ctx: CanvasRenderingContext2D, p: Point, colors: Palette, knee = false) {
  const r = knee ? 3.9 : 4.4;
  ctx.beginPath();
  ctx.moveTo(p.x - r * .52, p.y - r * .8); ctx.quadraticCurveTo(p.x, p.y - r * 1.2, p.x + r * .54, p.y - r * .72);
  ctx.lineTo(p.x + r, p.y + r * .18); ctx.quadraticCurveTo(p.x + r * .55, p.y + r, p.x - r * .4, p.y + r * .78);
  ctx.lineTo(p.x - r, p.y + r * .18);
  ctx.closePath(); ctx.fillStyle = colors.edge; ctx.fill();
  ctx.beginPath(); ctx.ellipse(p.x, p.y, r * .55, r * .48, -.18, 0, Math.PI * 2);
  ctx.fillStyle = colors.joint; ctx.fill();
  ctx.fillStyle = colors.accent; ctx.fillRect(Math.round(p.x + r * .12), Math.round(p.y - r * .12), 1.45, 1.45);
  ctx.fillStyle = colors.glint; ctx.fillRect(Math.round(p.x - r * .36), Math.round(p.y - r * .4), 1.5, 1.15);
}
function foot(ctx: CanvasRenderingContext2D, knee: Point, tip: Point, colors: Palette, moving: boolean) {
  const angle = Math.atan2(tip.y - knee.y, tip.x - knee.x);
  ctx.save(); ctx.translate(tip.x, tip.y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(-5.2, -2.1); ctx.lineTo(-.7, -1.6); ctx.lineTo(2.1, -.5);
  ctx.lineTo(3.8, 0); ctx.lineTo(1.8, 1.2); ctx.lineTo(-1.2, 1.7); ctx.lineTo(-5.5, 2.1);
  ctx.closePath(); ctx.fillStyle = colors.edge; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, -1); ctx.lineTo(-.5, -.75); ctx.lineTo(2.3, 0);
  ctx.lineTo(-.4, .6); ctx.lineTo(-4, 1); ctx.closePath();
  ctx.fillStyle = colors.limbLight; ctx.globalAlpha = moving ? .7 : 1; ctx.fill();
  ctx.globalAlpha = 1; ctx.fillStyle = colors.accent; ctx.fillRect(1.4, -.8, 1.5, 1.5);
  ctx.restore();
}

// IK points are authoritative at contacts. Between contacts, ease the visible
// limb toward the compact rest silhouette so the existing solver's alternate
// knee branch does not make the spider look like it has antennae.
function visibleLeg(body: Point, heading: number, leg: ArtLeg) {
  const angles = [.52, 1.12, 1.98, 2.62], reaches = [58, 53, 53, 64];
  const tipX = [56, 72, 72, 58], tipY = [42, 33, 18, 20];
  const kneeX = [39, 51, 53, 41], kneeY = [-6, -13, -14, -8];
  const limit = (n: number, max: number) => Math.max(-max, Math.min(max, n));
  const pose = Math.PI / 2 + Math.sin(heading - Math.PI / 2) * .22;
  const angle = pose + leg.side * angles[leg.pair];
  const nominal = { x: body.x + Math.cos(angle) * reaches[leg.pair], y: body.y + Math.sin(angle) * reaches[leg.pair] };
  const freeTip = { x: body.x + leg.side * tipX[leg.pair] + limit((leg.tip.x - nominal.x) * .28, 12),
    y: body.y + tipY[leg.pair] + limit((leg.tip.y - nominal.y) * .2, 9) };
  const freeKnee = { x: body.x + leg.side * kneeX[leg.pair] + limit((leg.knee.x - body.x) * .08, 5),
    y: body.y + kneeY[leg.pair] + limit((leg.knee.y - body.y) * .08, 5) };
  const contact = leg.anchored ? 1 : 0;
  return {
    knee: { x: freeKnee.x + (leg.knee.x - freeKnee.x) * contact, y: freeKnee.y + (leg.knee.y - freeKnee.y) * contact },
    tip: { x: freeTip.x + (leg.tip.x - freeTip.x) * contact, y: freeTip.y + (leg.tip.y - freeTip.y) * contact },
  };
}

export function drawHighFidelitySpider(ctx: CanvasRenderingContext2D, body: Point,
  heading: number, legs: ArtLeg[], state: string, time: number, reduced: boolean, blend: number) {
  const colors = palette(blend, state);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // Back legs are drawn first and the body covers their proximal sockets.
  const ordered = [...legs].sort((a, b) => b.pair - a.pair);
  ordered.forEach((item, index) => {
    const visible = visibleLeg(body, heading, item);
    const outward = item.side;
    leg(ctx, item.hip, visible.knee, outward, item.pair, true, colors, item.stepping, index);
    leg(ctx, visible.knee, visible.tip, outward, item.pair, false, colors, item.stepping, index + 1);
    socket(ctx, visible.knee, colors, true);
    foot(ctx, visible.knee, visible.tip, colors, item.stepping);
  });

  const tilt = reduced ? 0 : Math.cos(heading) * .055 + (state === 'INSPECTING' ? .035 : 0);
  const bob = reduced ? 0 : Math.sin(time * 5.3) * .65;
  ctx.translate(body.x, body.y + bob); ctx.rotate(tilt); ctx.scale(.86, .9);

  // One irregular, stepped silhouette with a raised rear abdomen and an
  // integrated front carapace; no round visor or separate head disk.
  ctx.save(); ctx.globalAlpha = .2; ctx.fillStyle = '#071321';
  ctx.beginPath(); ctx.ellipse(0, 26, 31, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

  ctx.beginPath();
  ctx.moveTo(-29, 1); ctx.lineTo(-32, -5); ctx.lineTo(-29, -12); ctx.lineTo(-31, -19);
  ctx.lineTo(-27, -27); ctx.quadraticCurveTo(-22, -35, -13, -36); ctx.lineTo(-8, -33);
  ctx.lineTo(-3, -37); ctx.lineTo(8, -36); ctx.lineTo(14, -32); ctx.lineTo(20, -30);
  ctx.quadraticCurveTo(29, -25, 29, -15); ctx.lineTo(25, -9); ctx.lineTo(22, -5);
  ctx.lineTo(29, -1); ctx.lineTo(33, 6); ctx.lineTo(31, 15);
  ctx.quadraticCurveTo(27, 26, 15, 28); ctx.lineTo(7, 29); ctx.lineTo(-2, 27);
  ctx.lineTo(-9, 29); ctx.lineTo(-18, 25); ctx.lineTo(-25, 19); ctx.lineTo(-29, 10); ctx.closePath();
  const bodyGradient = ctx.createLinearGradient(0, -40, 0, 30);
  bodyGradient.addColorStop(0, colors.shellLight); bodyGradient.addColorStop(.32, colors.shell);
  bodyGradient.addColorStop(.76, colors.shell); bodyGradient.addColorStop(1, colors.shellShade);
  ctx.fillStyle = bodyGradient; ctx.fill(); ctx.strokeStyle = colors.edge; ctx.lineWidth = 3.2; ctx.stroke();

  // Dorsal plates are broad shaded patches with stepped edges, not industrial armor.
  ctx.save(); ctx.beginPath();
  ctx.moveTo(-28, -8); ctx.lineTo(-29, -17); ctx.lineTo(-24, -27); ctx.lineTo(-18, -33);
  ctx.lineTo(-12, -34); ctx.lineTo(-8, -31); ctx.lineTo(-3, -35); ctx.lineTo(8, -34);
  ctx.lineTo(15, -30); ctx.lineTo(21, -28); ctx.quadraticCurveTo(27, -23, 27, -15);
  ctx.lineTo(21, -13); ctx.lineTo(14, -18); ctx.lineTo(6, -19); ctx.lineTo(-3, -17);
  ctx.lineTo(-11, -16); ctx.lineTo(-20, -13); ctx.closePath(); ctx.clip();
  const abdomen = ctx.createLinearGradient(-5, -39, 6, -11);
  abdomen.addColorStop(0, colors.shellLight); abdomen.addColorStop(.48, colors.shell);
  abdomen.addColorStop(1, colors.shellShade);
  ctx.fillStyle = abdomen; ctx.globalAlpha = blend > .5 ? .58 : .72;
  ctx.fillRect(-31, -41, 63, 32); ctx.globalAlpha = 1;
  ctx.fillStyle = colors.shellShade; ctx.globalAlpha = .3;
  ctx.fillRect(-24, -15, 7, 2); ctx.fillRect(-14, -20, 9, 2); ctx.fillRect(10, -23, 12, 2); ctx.globalAlpha = 1;
  ctx.restore();

  // Integrated lower face: contrast comes from value, without a panel border.
  ctx.save(); ctx.beginPath();
  ctx.moveTo(-24, -2); ctx.lineTo(-19, -7); ctx.lineTo(-10, -9); ctx.lineTo(0, -8);
  ctx.lineTo(10, -9); ctx.lineTo(20, -5); ctx.lineTo(25, 0); ctx.lineTo(25, 10);
  ctx.lineTo(21, 20); ctx.lineTo(13, 25); ctx.lineTo(5, 27); ctx.lineTo(-7, 26);
  ctx.lineTo(-17, 23); ctx.lineTo(-23, 16); ctx.closePath(); ctx.clip();
  const face = ctx.createLinearGradient(0, -5, 0, 28);
  face.addColorStop(0, colors.shell); face.addColorStop(1, colors.shellShade);
  ctx.fillStyle = face; ctx.fillRect(-27, -10, 54, 40); ctx.restore();

  // Short broken rim, block highlights and blue terminal pixels.
  ctx.strokeStyle = colors.limbLight; ctx.lineWidth = 1.8; ctx.beginPath();
  ctx.moveTo(-27, -11); ctx.lineTo(-26, -17); ctx.quadraticCurveTo(-21, -28, -12, -29);
  ctx.lineTo(-7, -32); ctx.lineTo(3, -32); ctx.stroke();
  ctx.fillStyle = colors.glint;
  ctx.fillRect(-20, -27, 3.2, 2.2); ctx.fillRect(-15, -30, 2, 2); ctx.fillRect(10, -28, 2.5, 2);
  ctx.fillStyle = colors.accent;
  ctx.fillRect(-30, -10, 2.7, 2.7); ctx.fillRect(27, -6, 2.2, 2.2);
  ctx.fillRect(-25, 17, 2.4, 2.4); ctx.fillRect(22, 20, 2.5, 2.5);
  ctx.fillRect(-9, -34, 2.1, 2); ctx.fillRect(17, -24, 2, 2);

  // Exactly two small round blue eyes. No mouth, brows or expression marks.
  for (const x of [-8.1, 8.1]) {
    ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = colors.eye;
    ctx.beginPath(); ctx.arc(x, 10, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = colors.eye; ctx.beginPath(); ctx.arc(x, 10, 1.9, 0, Math.PI * 2); ctx.fill();
  }
  if (state === 'REPORTING' && !reduced) {
    ctx.globalAlpha = .64; ctx.fillStyle = colors.accent;
    ctx.fillRect(-13, -39, 2.5, 2.5); ctx.fillRect(11, -38, 2, 2); ctx.globalAlpha = 1;
  }
  ctx.restore();
}
