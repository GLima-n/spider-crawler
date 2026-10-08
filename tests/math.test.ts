import test from 'node:test';
import assert from 'node:assert/strict';
import { solveIK, distance } from '../src/shared/math.ts';
test('IK preserves both segment lengths for reachable targets in all quadrants',()=>{for(let i=0;i<48;i++){const a=i*Math.PI/24,d=10+i%8*8,hip={x:30,y:40},foot={x:hip.x+Math.cos(a)*d,y:hip.y+Math.sin(a)*d};for(const side of [-1,1]){const k=solveIK(hip,foot,40,46,side);assert.ok(Math.abs(distance(hip,k.knee)-40)<1e-7);assert.ok(Math.abs(distance(k.knee,k.tip)-46)<1e-7);assert.ok(distance(foot,k.tip)<1e-7);}}});
test('IK handles coincident and unreachable points without NaN',()=>{for(const foot of [{x:0,y:0},{x:1e6,y:-1e6}]){const {knee,tip}=solveIK({x:0,y:0},foot,40,46,1);assert.ok(Number.isFinite(knee.x)&&Number.isFinite(tip.y));assert.ok(distance({x:0,y:0},tip)<=86);assert.ok(Math.abs(distance(knee,tip)-46)<1e-7);}});
