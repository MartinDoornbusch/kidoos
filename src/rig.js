"use strict";
// Skinned people with motion-captured clips (Microsoft Rocketbox Avatar Library, MIT).
// people/<id>.rig holds mesh, skin and skeleton; people/clips-<m|f>.bin holds the shared
// clips for the Biped skeleton. Both are compact binaries written by the asset pipeline.
const Rig=(()=>{
 const T=THREE,files=new Map(),textures=new Map(),materials=new Map(),clipSets=new Map();
 const BODY=/^(Pelvis|Spine\d?|Neck\d?|Head|[LR]_(Clavicle|UpperArm|Forearm|Hand|Finger\d+|Thigh|Calf|Foot|Toe0))$/;
 function bin(url){
  if(!files.has(url))files.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('Laden mislukt: '+url);return r.arrayBuffer()}).then(b=>{
   const n=new DataView(b).getUint32(0,true);return {head:JSON.parse(new TextDecoder().decode(new Uint8Array(b,4,n))),body:b.slice(4+n)}
  }).catch(e=>{files.delete(url);throw e}));
  return files.get(url)
 }
 function texture(file,color){
  if(!textures.has(file)){const t=new T.TextureLoader().load('people/'+file);if(color)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;textures.set(file,t)}
  return textures.get(file)
 }
 function material(name,skin){
  const key=name+'|'+(skin||'');if(materials.has(key))return materials.get(key);
  const [code,part]=name.split('_');let m;
  if(part==='opacity')m=new T.MeshStandardMaterial({map:texture(code+'_opacity.webp',true),alphaTest:.36,side:T.DoubleSide,roughness:.72});
  else m=new T.MeshStandardMaterial({map:texture((part==='body'&&skin?skin:code)+'_'+part+'.jpg',true),normalMap:texture(code+'_'+part+'_n.jpg',false),roughness:part==='head'?.6:.84});
  m.name=name;materials.set(key,m);return m
 }
 // Clips are stored for a generic Biped. Each skeleton gets its own copy with the right bone
 // prefix and the hip height scaled to its legs.
 function clipsFor(gender,prefix,hip,names){
  const key=gender+prefix+hip.toFixed(2);
  if(!clipSets.has(key))clipSets.set(key,bin('people/clips-'+gender+'.bin').then(({head,body})=>{
   const ref=(head.find(c=>c.name==='idle')||head[0]).hip,k=hip/ref,out={};
   for(const c of head){
    if(c.missing)continue;
    const times=new Float32Array(c.frames);for(let f=0;f<c.frames;f++)times[f]=Math.min(c.dur,f/c.fps);
    const raw=new Int16Array(body,c.root,c.frames*3),root=new Float32Array(c.frames*3);for(let i=0;i<root.length;i++)root[i]=raw[i]/50*k;
    const tracks=[new T.VectorKeyframeTrack(prefix+'.position',times,root)],q=new Int16Array(body,c.q,c.frames*c.bones.length*4);
    c.bones.forEach((bone,b)=>{
     const name=bone?prefix+'_'+bone:prefix;if(!names.has(name))return;
     const v=new Float32Array(c.frames*4);
     for(let f=0;f<c.frames;f++){let x=q[(f*c.bones.length+b)*4]/32767,y=q[(f*c.bones.length+b)*4+1]/32767,z=q[(f*c.bones.length+b)*4+2]/32767,w=q[(f*c.bones.length+b)*4+3]/32767;const l=Math.hypot(x,y,z,w)||1;v.set([x/l,y/l,z/l,w/l],f*4)}
     tracks.push(new T.QuaternionKeyframeTrack(name+'.quaternion',times,v))
    });
    const clip=new T.AnimationClip(c.name,c.dur,tracks);clip.userData={speed:c.speed*k,trimmed:c.trimmed};out[c.name]=clip
   }
   return out
  }));
  return clipSets.get(key)
 }
 // A still pose between a clip's first frame and the bind pose (arms out), for gliding and jumps.
 function between(clip,bones,amount,name){
  const tracks=[],q=new T.Quaternion(),r=new T.Quaternion();
  for(const t of clip.tracks){
   const [bone,prop]=t.name.split('.'),b=bones[bone];
   if(prop==='position'){tracks.push(new T.VectorKeyframeTrack(t.name,[0,1],[...t.values.slice(0,3),...t.values.slice(0,3)]));continue}
   q.fromArray(t.values,0);if(b&&/Clavicle|UpperArm|Forearm/.test(bone))q.slerp(r.copy(b.userData.bind),amount);
   tracks.push(new T.QuaternionKeyframeTrack(t.name,[0,1],[...q.toArray(),...q.toArray()]))
  }
  return new T.AnimationClip(name,1,tracks)
 }
 function person(parent,id,{gender,height,skin}){
  const root=new T.Group(),body=new T.Group();parent.add(root);root.add(body);body.rotation.y=Math.PI; // faces -z like the rest of the game
  const api={root,body,bones:{},clips:null,mixer:null,current:null,actions:{},ready:null,height,update,play,once,locomote,look,state:''};
  api.ready=bin('people/'+id+'.rig').then(async rig=>{
   const h=rig.head,bones=h.bones.map(b=>{const o=new T.Bone();o.name=b[0];o.position.set(b[2],b[3],b[4]);o.quaternion.set(b[5],b[6],b[7],b[8]);o.scale.set(b[9],b[10],b[11]);o.userData.bind=o.quaternion.clone();return o});
   h.bones.forEach((b,i)=>{if(b[1]>=0)bones[b[1]].add(bones[i])});
   const holder=new T.Group();holder.matrixAutoUpdate=false;holder.matrix.fromArray(h.rootParentMatrix);body.add(holder);
   const top=bones[h.bones.findIndex(b=>b[1]<0)];holder.add(top);
   const inv=new Float32Array(rig.body,h.inv,bones.length*16),skeleton=new T.Skeleton(bones,bones.map((_,i)=>new T.Matrix4().fromArray(inv,i*16)));
   for(const p of h.parts){
    const g=new T.BufferGeometry(),B=rig.body;
    g.setAttribute('position',new T.BufferAttribute(new Float32Array(B,p.pos,p.n*3),3));
    g.setAttribute('normal',new T.BufferAttribute(new Int16Array(B,p.nrm,p.n*3),3,true));
    g.setAttribute('uv',new T.BufferAttribute(new Float32Array(B,p.uv,p.n*2),2));
    g.setAttribute('skinIndex',new T.BufferAttribute(new Uint8Array(B,p.si,p.n*4),4));
    g.setAttribute('skinWeight',new T.BufferAttribute(new Uint8Array(B,p.sw,p.n*4),4,true));
    g.setIndex(new T.BufferAttribute(p.wide?new Uint32Array(B,p.idx,p.m):new Uint16Array(B,p.idx,p.m),1));
    for(const [start,count,mi] of p.groups)g.addGroup(start,count,mi);
    const mesh=new T.SkinnedMesh(g,p.mats.map(n=>material(n,skin)));
    mesh.matrixAutoUpdate=false;mesh.matrix.fromArray(p.matrix);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;
    body.add(mesh);mesh.bind(skeleton,new T.Matrix4().fromArray(p.bindMatrix))
   }
   for(const b of bones)api.bones[b.name.replace(/^Bip0\d_?/,'')||'Root']=b;
   body.scale.setScalar(height/h.height);api.scale=height/h.height;
   const names=new Set(bones.map(b=>b.name)),byName=Object.fromEntries(bones.map(b=>[b.name,b]));
   const clips=await clipsFor(gender,top.name,h.hip,names);
   api.clips={...clips,glide:between(clips.idle,byName,.72,'glide'),air:between(clips.idle,byName,.28,'air')};
   api.mixer=new T.AnimationMixer(body);
   play('idle',{fade:0})
  });
  function action(name){return api.actions[name]||(api.actions[name]=api.mixer.clipAction(api.clips[name]))}
  // Crossfade the base layer to a clip. Same clip: only the playback rate changes.
  function play(name,{fade=.3,rate=1,loop=true,restart=false}={}){
   if(!api.mixer||!api.clips[name])return;
   const a=action(name);a.setEffectiveTimeScale(rate);
   if(api.current===a&&!restart)return;
   a.enabled=true;a.setLoop(loop?T.LoopRepeat:T.LoopOnce,Infinity);a.clampWhenFinished=!loop;
   if(restart||!a.isRunning()){a.reset();a.setEffectiveTimeScale(rate);a.play()}
   a.setEffectiveWeight(1);if(fade){a.fadeIn(fade);api.current?.fadeOut(fade)}else api.current?.stop();
   api.current=a;api.state=name
  }
  // A one-shot clip that returns to `after` when it is close to done.
  function once(name,after='idle',{fade=.35,rate=1}={}){
   if(!api.clips?.[name])return 0;play(name,{fade,rate,loop:false,restart:true});api.after={name,after,fade};return api.clips[name].duration/rate
  }
  // Locomotion: choose walk, run or sprint by ground speed and match the stride to it.
  function locomote(speed,{turning=0,backwards=false}={}){
   if(!api.clips)return;const v=Math.abs(speed),natural=n=>api.clips[n].userData.speed*api.scale;
   if(v<.12&&Math.abs(turning)<.6){if(['walk','run','sprint','slow'].includes(api.state))play('idle',{fade:.32});return}
   let name='walk';if(v>5.1)name='sprint';else if(v>2.7)name='run';
   const rate=Math.max(name==='walk'?.55:.72,Math.max(v,turning?.8:0)/natural(name))*(backwards?-1:1);
   play(name,{fade:name===api.state?0:.22,rate:Math.min(1.7,Math.abs(rate))*Math.sign(rate)})
  }
  const up=new T.Vector3(0,1,0),pq=new T.Quaternion(),off=new T.Quaternion(),tmp=new T.Quaternion();
  let lookYaw=0,lookPitch=0,lookTarget=null;
  // Turn the head (and a little of the neck) toward a world position, within natural limits.
  function look(target){lookTarget=target}
  function update(dt){
   if(!api.mixer)return;api.mixer.update(dt);
   if(api.after&&api.current===api.actions[api.after.name]&&api.current.time>api.current.getClip().duration-api.after.fade-.05){const a=api.after;api.after=null;play(a.after,{fade:a.fade})}
   let yaw=0,pitch=0;const head=api.bones.Head,neck=api.bones.Neck;
   if(lookTarget&&head){
    body.updateWorldMatrix(true,false);const local=body.worldToLocal(lookTarget.clone()),eye=api.height*.93/api.scale;
    yaw=Math.max(-1,Math.min(1,Math.atan2(local.x,local.z)));pitch=Math.max(-.35,Math.min(.35,Math.atan2(local.y-eye,Math.hypot(local.x,local.z))));
    if(Math.abs(Math.atan2(local.x,local.z))>2.2)yaw=0
   }
   const k=1-Math.exp(-5*dt);lookYaw+=(yaw-lookYaw)*k;lookPitch+=(pitch-lookPitch)*k;
   if(head&&(Math.abs(lookYaw)>.01||Math.abs(lookPitch)>.01))for(const [bone,share] of [[neck,.35],[head,.65]]){
    if(!bone)continue;bone.parent.updateWorldMatrix(true,false);bone.parent.getWorldQuaternion(pq);body.getWorldQuaternion(tmp);
    const side=new T.Vector3(1,0,0).applyQuaternion(tmp);
    off.setFromAxisAngle(up,lookYaw*share).multiply(new T.Quaternion().setFromAxisAngle(side,-lookPitch*share));
    bone.quaternion.premultiply(pq.clone().invert().multiply(off).multiply(pq))
   }
  }
  return api
 }
 return {person,bin,BODY}
})();
