"use strict";
function loadSurface(file,flipY=true){
 const tex=new THREE.TextureLoader().load('art/'+file);
 tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;
 tex.flipY=flipY;tex.anisotropy=4;return tex
}
// Rocketbox meshes retain their authored UV seams. The FBX skeleton poses are
// sampled offline so the same animated surface works with either renderer.
const peopleData=new Map(),peopleMaterials=new Map();
function readPerson(name){
 if(peopleData.has(name))return peopleData.get(name);
 const pending=fetch('people/'+name+'.model').then(async response=>{
  if(!response.ok)throw Error('Model ontbreekt: '+name);
  const bytes=await response.arrayBuffer(),size=new DataView(bytes).getUint32(0,true),start=4+size;
  const descriptors=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,4,size)));
  const read=(Type,offset,count)=>new Type(bytes.slice(start+offset,start+offset+count*Type.BYTES_PER_ELEMENT));
  return descriptors.map(d=>({...d,uv:read(Float32Array,d.uv,d.n*2),ids:read(Uint16Array,d.index,d.count),poses:d.frames.map(f=>read(Int16Array,f,d.n*3))}))
 }).catch(error=>{peopleData.delete(name);throw error});
 peopleData.set(name,pending);return pending
}
function embodiedPerson(parent,name){
 const T=THREE,root=new T.Group();parent.add(root);let parts=[];
 const ready=readPerson(name).then(data=>{
  parts=data.map(d=>{
   const geo=new T.BufferGeometry(),pos=new T.Float32BufferAttribute(Float32Array.from(d.poses[0],x=>x/8000),3);
   geo.setAttribute('position',pos);geo.setAttribute('uv',new T.BufferAttribute(d.uv,2));geo.setIndex(new T.BufferAttribute(d.ids,1));geo.computeVertexNormals();
   if(!peopleMaterials.has(d.tex)){
    const cutout=d.tex.includes('opacity'),map=new T.TextureLoader().load('people/'+d.tex+(cutout?'.webp':'.jpg'));map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    peopleMaterials.set(d.tex,new T.MeshStandardMaterial({map,roughness:.86,alphaTest:cutout?.42:0,side:T.DoubleSide}))
   }
   const mesh=new T.Mesh(geo,peopleMaterials.get(d.tex));mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;root.add(mesh);return {pos,geo,poses:d.poses}
  })
 });
 let stamp='';
 // Layers add baked poses on top of the rest pose: [[frame,weight],...]. Negative weights move away from a pose.
 function blend(layers){
  const mark=layers.map(([f,w])=>f+':'+Math.round(w*240)).join('/');if(mark===stamp||!parts.length)return;stamp=mark;
  for(const {pos,geo,poses} of parts){
   const idle=poses[0],dst=pos.array,used=layers.filter(([f,w])=>f&&w);
   for(let i=0;i<dst.length;i++){let v=idle[i];for(const [f,w] of used)v+=w*(poses[f][i]-idle[i]);dst[i]=v/8000}
   pos.needsUpdate=true;geo.computeVertexNormals()
  }
 }
 function animate(a,b,mix,weight){blend([[a,weight*(1-mix)],[b,weight*mix]])}
 return {root,ready,animate,blend}
}
// Standing still is never a statue: arms relax against the body, the chest breathes,
// the arms sway a little and the weight shifts. Shared by the pilot and the villagers.
function idleLayers(t){
 const breathe=Math.sin(t*1.55),sway=Math.sin(t*.62);
 return [[9,-.46+.05*breathe],[2,.06+.05*sway],[6,.06-.05*sway],[10,.035+.03*Math.max(0,Math.sin(t*.23))]]
}
function expeditionPilot(scene){
 const root=new THREE.Group();scene.add(root);const models={};let selected,heading=0,reachAt=-10,still=0,look=0;
 function outfit(name){
  const key=name==='Nova'?'floor':'niek';selected=models[key]??=embodiedPerson(root,key);
  for(const model of Object.values(models))model.root.visible=model===selected;
  selected.ready.catch(()=>{document.getElementById('toast').textContent='Personage laden mislukt. Vernieuw de pagina.'})
 }
 function pose(t,p,dt){
  root.position.set(p.x,p.y,p.z);heading+=Math.atan2(Math.sin(p.heading-heading),Math.cos(p.heading-heading))*(1-Math.exp(-15*dt));
  const resting=!(p.speed>.02)&&p.on!==false&&!p.glide;still=resting?still+Math.min(dt,.1):0;
  // After a few seconds of standing, the pilot glances left and right now and then.
  const beat=Math.floor((still-3)/3.4),glance=still>3&&beat%3!==2?.5*Math.sin(beat*2.1+1):0;
  look+=(glance-look)*(1-Math.exp(-2.4*Math.min(dt,.1)));root.rotation.y=heading+look;
  if(!selected)return;
  const phase=(p.walk||0)*4/Math.PI,index=Math.floor(phase)%8,reach=Math.max(0,1-Math.abs(t-reachAt-.21)/.28),w=Math.min(1,p.speed||0),m=phase%1;
  if(reach>0)selected.blend([[10,reach],[9,-.46*(1-reach)]]);
  else if(p.glide||p.on===false)selected.animate(9,9,0,p.glide?1:.55);
  else if(w>.02)selected.blend([[1+index,w*(1-m)],[1+(index+1)%8,w*m],[9,-.34*w-.46*(1-w)]]);
  else selected.blend(idleLayers(t));
  selected.root.position.y=.012*Math.sin(t*1.55)+.036*Math.abs(Math.sin(p.walk||0))*w;selected.root.rotation.z=resting?.012*Math.sin(t*.62):0
 }
 return {root,outfit,pose,reach(){reachAt=performance.now()/1000}}
}
