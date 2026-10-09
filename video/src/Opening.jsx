import React from 'react';
import {useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
import {Frame,Reveal,SpiderArt,SceneExit,C,mono,clamp,ease} from './design';

export function Opening(){
  const f=useCurrentFrame(),{fps}=useVideoConfig();
  return <Frame chapter="DEIXE A CURIOSIDADE ANDAR" index="01">
    <Reveal delay={.12*fps} style={{position:'absolute',left:110,top:240,fontFamily:mono,fontSize:24,letterSpacing:4,color:C.blue}}>PEQUENAS CRIATURAS. GRANDES DESCOBERTAS.</Reveal>
    <Reveal delay={.3*fps} style={{position:'absolute',left:103,top:308,fontSize:135,lineHeight:1.01,fontWeight:600,letterSpacing:-7}}>Sua interface.<br/>Sob outro<br/><span style={{color:C.mint}}>olhar.</span></Reveal>
    <div style={{position:'absolute',left:1070,top:230,width:720,height:600,borderRadius:220,background:'#e9efed',
      scale:interpolate(f,[0,1.2*fps],[.86,1],{...clamp,easing:ease}),opacity:interpolate(f,[.35*fps,.9*fps],[0,1],clamp)}}>
      <SpiderArt light style={{position:'absolute',left:-90,top:-15}}/>
      <div style={{position:'absolute',bottom:28,left:0,right:0,textAlign:'center',fontFamily:mono,fontSize:17,color:'#536a72',letterSpacing:3}}>08 PATAS / MOVIMENTO PROCEDURAL</div>
    </div>
    <Reveal delay={1*fps} style={{position:'absolute',left:112,top:841,fontSize:32,lineHeight:1.5,color:C.muted}}>Inspeção visual. Auditoria passiva.<br/><span style={{color:C.ink}}>Tudo acontece no seu navegador.</span></Reveal>
    <SceneExit/>
  </Frame>;
}
