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
 function animate(a,b,mix,weight){
  const mark=[a,b,Math.round(mix*32),Math.round(weight*24)].join('/');if(mark===stamp||!parts.length)return;stamp=mark;
  for(const {pos,geo,poses} of parts){
   const idle=poses[0],from=poses[a],to=poses[b],dst=pos.array;
   for(let i=0;i<dst.length;i++)dst[i]=(idle[i]+weight*(from[i]+(to[i]-from[i])*mix-idle[i]))/8000;
   pos.needsUpdate=true;geo.computeVertexNormals()
  }
 }
 return {root,ready,animate}
}
function expeditionPilot(scene){
 const root=new THREE.Group();scene.add(root);const models={};let selected,heading=0,reachAt=-10;
 function outfit(name){
  const key=name==='Nova'?'floor':'niek';selected=models[key]??=embodiedPerson(root,key);
  for(const model of Object.values(models))model.root.visible=model===selected;
  selected.ready.catch(()=>{document.getElementById('toast').textContent='Personage laden mislukt. Vernieuw de pagina.'})
 }
 function pose(t,p,dt){
  root.position.set(p.x,p.y,p.z);heading+=Math.atan2(Math.sin(p.heading-heading),Math.cos(p.heading-heading))*(1-Math.exp(-15*dt));root.rotation.y=heading;
  if(!selected)return;
  const phase=(p.walk||0)*4/Math.PI,index=Math.floor(phase)%8,reach=Math.max(0,1-Math.abs(t-reachAt-.21)/.28);
  if(reach>0)selected.animate(10,10,0,reach);
  else if(p.glide||p.on===false)selected.animate(9,9,0,p.glide?1:.55);
  else selected.animate(1+index,1+(index+1)%8,phase%1,Math.min(1,p.speed||0));
  selected.root.position.y=.018*Math.sin(t*1.75)+.036*Math.abs(Math.sin(p.walk||0))*(p.speed||0)
 }
 return {root,outfit,pose,reach(){reachAt=performance.now()/1000}}
}
