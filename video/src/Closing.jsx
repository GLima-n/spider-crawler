import React from 'react';
import {useVideoConfig} from 'remotion';
import {Frame,Reveal,SpiderArt,C,mono} from './design';

export function Closing(){
  const {fps}=useVideoConfig();
  return <Frame chapter="PRONTO PARA EXPLORAR" index="05">
    <Reveal delay={.1*fps} style={{position:'absolute',left:109,top:208,fontFamily:mono,fontSize:22,color:C.blue,letterSpacing:4}}>SPIDER CRAWLER / SPIDER INSPECTOR</Reveal>
    <Reveal delay={.25*fps} style={{position:'absolute',left:102,top:286,fontSize:121,fontWeight:600,letterSpacing:-5,lineHeight:1.05}}>Libere a<br/><span style={{color:C.mint}}>curiosidade.</span></Reveal>
    <Reveal delay={.6*fps} style={{position:'absolute',left:110,top:624,fontSize:34,color:C.muted,lineHeight:1.75}}>1 a 3 aranhas. Explorar ou Auditar.<br/>Pausar. Exportar. Recolher.</Reveal>
    <Reveal delay={1*fps} style={{position:'absolute',left:110,top:798,fontFamily:mono,fontSize:23,letterSpacing:1,color:C.ink,borderLeft:`3px solid ${C.blue}`,paddingLeft:22}}>PROCESSAMENTO LOCAL<br/><span style={{color:C.muted,fontSize:21}}>Sem envio de conteúdo a servidores.</span></Reveal>
    <SpiderArt style={{position:'absolute',left:991,top:245}} speed={.7}/>
    <Reveal delay={1.3*fps} style={{position:'absolute',left:1120,top:868,color:C.blue,fontFamily:mono,fontSize:24,letterSpacing:2}}>COMECE PELO README ↗</Reveal>
  </Frame>;
}
