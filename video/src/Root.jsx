import React from 'react';
import {Composition,Folder,Series,useVideoConfig,staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {Opening} from './Opening';
import {Explore,Chart,Audit} from './ProductScenes';
import {Closing} from './Closing';

export function Presentation(){
  const {fps}=useVideoConfig();
  return <><Audio src={staticFile('score.wav')} premountFor={fps} volume={.7}/><Series>
    <Series.Sequence name="01 · Sua interface" durationInFrames={6*fps} premountFor={fps}><Opening/></Series.Sequence>
    <Series.Sequence name="02 · Explorar" durationInFrames={8*fps} premountFor={fps}><Explore/></Series.Sequence>
    <Series.Sequence name="03 · Teias" durationInFrames={7*fps} premountFor={fps}><Chart/></Series.Sequence>
    <Series.Sequence name="04 · Auditoria" durationInFrames={8*fps} premountFor={fps}><Audit/></Series.Sequence>
    <Series.Sequence name="05 · Comece" durationInFrames={7*fps} premountFor={fps}><Closing/></Series.Sequence>
  </Series></>;
}
export function RemotionRoot(){
  return <>
    <Composition id="SpiderPresentation" component={Presentation} durationInFrames={1080} fps={30} width={1920} height={1080}/>
    <Folder name="Cenas">
      <Composition id="Opening" component={Opening} durationInFrames={180} fps={30} width={1920} height={1080}/>
      <Composition id="Explore" component={Explore} durationInFrames={240} fps={30} width={1920} height={1080}/>
      <Composition id="Chart" component={Chart} durationInFrames={210} fps={30} width={1920} height={1080}/>
      <Composition id="Audit" component={Audit} durationInFrames={240} fps={30} width={1920} height={1080}/>
      <Composition id="Closing" component={Closing} durationInFrames={210} fps={30} width={1920} height={1080}/>
    </Folder>
  </>;
}
