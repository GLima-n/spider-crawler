import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {drawHighFidelitySpider} from '../../src/spider/appearance/shape';
import {solveIK} from '../../src/shared/math';

export const C = {bg:'#07111b', ink:'#f0f5f3', muted:'#9cafbd', blue:'#38c8f2', mint:'#b7efcf', line:'#243645'};
export const font = '"Bahnschrift", "Segoe UI", sans-serif';
export const mono = '"Consolas", monospace';
export const clamp = {extrapolateLeft:'clamp',extrapolateRight:'clamp'};
export const ease = Easing.bezier(.16,1,.3,1);

export function Frame({children, chapter, index = '01', light = false}) {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return <AbsoluteFill style={{background:light?'#e9efed':C.bg,color:light?C.bg:C.ink,fontFamily:font,overflow:'hidden'}}>
    <svg width="1920" height="1080" style={{position:'absolute',opacity:light?.1:.23}}>
      <defs><radialGradient id="glow"><stop stopColor="#1f78a3" stopOpacity=".55"/><stop offset="1" stopColor="#07111b" stopOpacity="0"/></radialGradient></defs>
      <ellipse cx="1540" cy="470" rx="890" ry="720" fill="url(#glow)"/>
      {[0,1,2,3,4].map(i=><path key={i} d={`M ${1100+i*170} -100 L ${770+i*145} 1130`} stroke={C.blue} strokeWidth=".6" fill="none"/>)}
      <path d="M1060 0L1560 1050M1770 0L830 1080M700 460L1920 170" stroke={C.blue} strokeWidth=".6" fill="none"/>
    </svg>
    <div style={{position:'absolute',left:104,right:104,top:60,display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:mono,fontSize:22,letterSpacing:3}}>
      <span><span style={{color:light?'#117498':C.blue}}>✳</span> SPIDER CRAWLER</span>
      <span style={{color:light?'#4e6571':C.muted,fontSize:17}}>INTERFACES SOB OUTRO OLHAR / 0.1</span>
    </div>
    <div style={{position:'absolute',left:104,right:104,bottom:65,height:1,background:light?'#aebdbb':C.line}}/>
    <div style={{position:'absolute',left:104,bottom:31,fontSize:16,fontFamily:mono,letterSpacing:2,color:light?'#526b75':C.muted}}>{index} / {chapter}</div>
    <div style={{position:'absolute',right:104,bottom:31,fontSize:16,fontFamily:mono,color:light?'#526b75':C.muted}}>CHROMIUM MV3 · LOCAL</div>
    <div style={{position:'absolute',left:104,bottom:64,height:2,width:interpolate(frame,[0,durationInFrames],[0,1712],clamp),background:light?'#127698':C.blue}}/>
    {children}
  </AbsoluteFill>;
}

export function Reveal({children, delay=0, style={}}) {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{opacity:interpolate(f,[delay,delay+.65*fps],[0,1],clamp),
    translate:`0px ${interpolate(f,[delay,delay+.95*fps],[42,0],{...clamp,easing:ease})}px`,...style}}>{children}</div>;
}

// The exact approved production skin, animated in JavaScript for the title
// sequence. The product demonstration itself is separately recorded footage.
export function SpiderArt({light=false, style={}, speed=1}) {
  const ref = useRef(null);
  const frame = useCurrentFrame(), {fps}=useVideoConfig();
  useLayoutEffect(()=>{
    const ctx=ref.current.getContext('2d'), t=frame/fps*speed;
    ctx.clearRect(0,0,900,650);
    const legs=[];
    for(let i=0;i<8;i++){
      const side=i<4?-1:1,pair=i%4, off=(1.5-pair)*4;
      const hip={x:-side*4,y:off};
      const angle=Math.PI/2+side*[.52,1.12,1.98,2.62][pair];
      const reach=[58,53,53,64][pair];
      const phase=t*5.4+(pair+(side>0?1:0))*Math.PI;
      const lift=Math.max(0,Math.sin(phase))*9;
      const foot={x:Math.cos(angle)*reach+Math.cos(phase)*6,y:Math.sin(angle)*reach-lift};
      const {knee,tip}=solveIK(hip,foot,40,46,(pair===3?-1:1)*side);
      legs.push({hip,knee,tip,side,pair,stepping:lift>.5});
    }
    ctx.save();ctx.translate(450,330);ctx.scale(5.45,5.45);
    drawHighFidelitySpider(ctx,{x:0,y:0},Math.PI/2,legs,'WALKING',t,false,light?0:1);
    ctx.restore();
  },[frame,fps,light,speed]);
  return <canvas ref={ref} width={900} height={650} style={{width:900,height:650,...style}}/>;
}

export function SceneExit(){
  const f=useCurrentFrame(),{durationInFrames,fps}=useVideoConfig();
  return <AbsoluteFill style={{background:C.bg,pointerEvents:'none',opacity:interpolate(f,[durationInFrames-.28*fps,durationInFrames-1],[0,1],clamp)}}/>;
}
