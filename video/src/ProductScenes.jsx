import React from 'react';
import {Video} from '@remotion/media';
import {staticFile,useVideoConfig,useCurrentFrame,interpolate} from 'remotion';
import {Frame,Reveal,SceneExit,C,mono,clamp,ease} from './design';

function ProductLayout({children,index,kicker,title,description,label,accent=C.blue}){
  const {fps}=useVideoConfig();const f=useCurrentFrame();
  return <Frame chapter={kicker} index={index}>
    <Reveal delay={.1*fps} style={{position:'absolute',left:106,top:275,color:accent,fontFamily:mono,fontSize:23,letterSpacing:3}}>{kicker}</Reveal>
    <Reveal delay={.2*fps} style={{position:'absolute',left:100,top:338,width:490,fontSize:91,lineHeight:1.02,letterSpacing:-4,fontWeight:600,whiteSpace:'pre-line'}}>{title}</Reveal>
    <Reveal delay={.55*fps} style={{position:'absolute',left:106,top:690,width:430,fontSize:30,lineHeight:1.5,color:C.muted}}>{description}</Reveal>
    <div style={{position:'absolute',left:587,top:189,width:1250,height:805,border:'1px solid #496073',borderRadius:20,overflow:'hidden',background:'#f5f6f2',boxShadow:'0 30px 90px #0007',
      translate:`${interpolate(f,[0,.9*fps],[50,0],{...clamp,easing:ease})}px 0px`,opacity:interpolate(f,[0,.45*fps],[0,1],clamp)}}>
      <div style={{height:40,background:'#122331',display:'flex',alignItems:'center',padding:'0 18px',gap:7,fontFamily:mono,fontSize:14,color:'#afc1ce'}}>
        <span style={{color:'#e48189'}}>●</span><span style={{color:'#e9c16f'}}>●</span><span style={{color:'#82c7a6'}}>●</span>
        <span style={{paddingLeft:220}}>spider-inspector / laboratório local</span>
      </div>
      {children}
    </div>
    <Reveal delay={1.1*fps} style={{position:'absolute',left:611,top:139,fontFamily:mono,fontSize:17,letterSpacing:2,color:'#95b4c8'}}>● {label}</Reveal>
    <SceneExit/>
  </Frame>;
}
const screen={width:'100%',height:765};

export function Explore(){
  const {fps}=useVideoConfig();
  return <ProductLayout index="02" kicker="EXPLORAR" title={'Cada toque,\numa\ndescoberta.'} description="Componentes, dimensões e estilos. Informações reais, organizadas no painel." label="CAPTURA REAL · MOTOR DA EXTENSÃO">
    <Video src={staticFile('explore.webm')} trimBefore={2.6*fps} premountFor={fps} muted objectFit="cover" style={screen}/>
  </ProductLayout>;
}
export function Chart(){
  const {fps}=useVideoConfig();
  return <ProductLayout index="03" kicker="INVESTIGAR" title={'Uma teia\nde\nevidências.'} description="A aranha toca o gráfico. A teia acompanha a inspeção da estrutura acessível." label="CAPTURA REAL · GRÁFICO SVG" accent="#c5adf7">
    <Video src={staticFile('chart.webm')} trimBefore={1*fps} premountFor={fps} muted objectFit="cover" style={screen}/>
  </ProductLayout>;
}
export function Audit(){
  const {fps}=useVideoConfig();
  return <ProductLayout index="04" kicker="AUDITAR" title={'Encontre\npistas.\nEntenda.'} description="Achados passivos com evidências e sugestões. Relatórios exportáveis em JSON." label="CAPTURA REAL · FALHAS INTENCIONAIS" accent="#efc784">
    <Video src={staticFile('audit.webm')} trimBefore={2*fps} premountFor={fps} muted objectFit="cover" style={screen}/>
  </ProductLayout>;
}
