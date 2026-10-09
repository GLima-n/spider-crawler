import {writeFileSync,mkdirSync} from 'node:fs';
// Deterministic original score: a quiet electronic pad and chapter chimes.
// No samples, external audio or speech services.
const rate=48000,seconds=36,count=rate*seconds;
const wav=Buffer.alloc(44+count*4);
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);
wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);
wav.write('data',36);wav.writeUInt32LE(count*4,40);
const chapters=[0,6,14,21,29];
for(let i=0;i<count;i++){
  const t=i/rate,fade=Math.min(1,t/1.5,(seconds-t)/2.5);
  const chord=t<14?[146.83,220,293.66]:t<29?[130.81,196,261.63]:[146.83,220,329.63];
  let pad=0;for(const frequency of chord)pad+=Math.sin(2*Math.PI*frequency*t)*.018*(.7+.3*Math.sin(t*.5));
  const beat=t%.5;
  const pulse=Math.sin(2*Math.PI*73.415*t)*Math.exp(-beat*16)*.035;
  let chime=0;
  for(const onset of chapters){const d=t-onset-.18;if(d>0&&d<2)chime+=(Math.sin(2*Math.PI*587.33*d)+Math.sin(2*Math.PI*880*d)*.3)*Math.exp(-d*3)*Math.min(1,d*40)*.045;}
  const pan=Math.sin(t*.33)*.12;
  const value=(pad+pulse+chime)*fade;
  wav.writeInt16LE(Math.round(value*(1-pan)*32767),44+i*4);
  wav.writeInt16LE(Math.round(value*(1+pan)*32767),46+i*4);
}
mkdirSync('public',{recursive:true});writeFileSync('public/score.wav',wav);
console.log('Original score: 36 seconds, stereo 48 kHz');
